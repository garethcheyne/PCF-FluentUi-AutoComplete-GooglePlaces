#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build PCF Control and create Power Platform solution package using solution.yaml configuration
.DESCRIPTION
    This script builds the PCF control, creates a Power Platform solution, and packages it for deployment.
    Uses solution.yaml for configuration, making it reusable across different PCF projects.
    Supports both GitHub Actions and Azure DevOps CI/CD environments.
.PARAMETER ConfigFile
    Path to the solution.yaml configuration file (default: ./solution.yaml)
.PARAMETER SolutionName
    Override solution name from config file
.PARAMETER PublisherName
    Override publisher name from config file
.PARAMETER PublisherPrefix
    Override publisher prefix from config file
.PARAMETER CleanBuild
    Override clean build setting from config file
.PARAMETER BuildConfiguration
    Build configuration (Debug, Release) - default: Release
.PARAMETER SolutionType
    Solution type to build (Managed, Unmanaged, Both) - default: Both
.PARAMETER CiMode
    CI/CD mode (GitHub, DevOps, Local) - auto-detected if not specified
.EXAMPLE
    .\build-solution.ps1
    .\build-solution.ps1 -ConfigFile ".\custom-solution.yaml"
    .\build-solution.ps1 -SolutionName "MyCustomSolution" -BuildConfiguration "Debug"
    .\build-solution.ps1 -CiMode "DevOps" -BuildConfiguration "Release"
    .\build-solution.ps1 -SolutionType "Managed" -BuildConfiguration "Release"
    .\build-solution.ps1 -SolutionType "Both"
#>

param(
    [string]$ConfigFile = "./solution.yaml",
    [string]$SolutionName = "",
    [string]$PublisherName = "", 
    [string]$PublisherPrefix = "",
    [bool]$CleanBuild = $true,
    [string]$BuildConfiguration = "Release",
    [ValidateSet("Managed", "Unmanaged", "Both")]
    [string]$SolutionType = "Both",
    [string]$CiMode = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Detect CI/CD environment if not specified
if ([string]::IsNullOrEmpty($CiMode)) {
    if ($env:GITHUB_ACTIONS -eq "true") {
        $CiMode = "GitHub"
    }
    elseif ($env:TF_BUILD -eq "True") {
        $CiMode = "DevOps"
    }
    else {
        $CiMode = "Local"
    }
}

# Color functions for output (adapted for different CI environments)
function Write-Info { 
    param($Message) 
    if ($CiMode -eq "DevOps") {
        Write-Host "##[section]INFO: $Message"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::notice::$Message"
    }
    else {
        Write-Host "INFO: $Message" -ForegroundColor Cyan 
    }
}

function Write-Success { 
    param($Message) 
    if ($CiMode -eq "DevOps") {
        Write-Host "##[section]SUCCESS: $Message"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::notice::✅ $Message"
    }
    else {
        Write-Host "SUCCESS: $Message" -ForegroundColor Green 
    }
}

function Write-Warning { 
    param($Message) 
    if ($CiMode -eq "DevOps") {
        Write-Host "##[warning]WARNING: $Message"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::warning::$Message"
    }
    else {
        Write-Host "WARNING: $Message" -ForegroundColor Yellow 
    }
}

function Write-BuildError { 
    param($Message) 
    if ($CiMode -eq "DevOps") {
        Write-Host "##[error]ERROR: $Message"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::error::$Message"
    }
    else {
        Write-Host "ERROR: $Message" -ForegroundColor Red 
    }
}

# Function to parse YAML file (simple parser for basic YAML structure)
function Parse-YamlFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        throw "Configuration file not found: $FilePath"
    }
    
    $yaml = @{}
    $currentSection = $null
    
    # Read content and handle BOM properly
    $content = Get-Content $FilePath -Encoding UTF8 -Raw
    $content = $content -replace "^\xEF\xBB\xBF", ""  # Remove BOM if present
    $lines = $content -split "`r?`n"
    
    foreach ($rawLine in $lines) {
        $line = $rawLine.Trim()
        
        # Skip comments and empty lines
        if ($line.StartsWith("#") -or [string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        
        # Handle top-level sections (no indentation, ends with colon)
        if ($line -match "^([a-zA-Z_][a-zA-Z0-9_]*):$") {
            $currentSection = $matches[1]
            $yaml[$currentSection] = @{}
        }
        # Handle properties with 2 spaces indentation
        elseif ($rawLine -match "^  ([a-zA-Z_][a-zA-Z0-9_]*): ?(.+)$") {
            $key = $matches[1]
            $value = $matches[2].Trim()
            
            # Remove surrounding quotes
            $value = $value -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
            
            if ($currentSection) {
                $yaml[$currentSection][$key] = $value
            }
        }
    }
    
    return $yaml
}

# Function to resolve template variables
function Resolve-Template {
    param([string]$Template, [hashtable]$Config)
    
    $resolved = $Template
    
    # Replace {{section.key}} patterns
    $resolved = $resolved -replace '\{\{solution\.name\}\}', $Config.solution.uniqueName
    $resolved = $resolved -replace '\{\{solution\.uniqueName\}\}', $Config.solution.uniqueName
    $resolved = $resolved -replace '\{\{solution\.displayName\}\}', $Config.solution.displayName
    $resolved = $resolved -replace '\{\{solution\.version\}\}', $Config.solution.version
    $resolved = $resolved -replace '\{\{publisher\.name\}\}', $Config.publisher.uniqueName
    $resolved = $resolved -replace '\{\{publisher\.uniqueName\}\}', $Config.publisher.uniqueName
    $resolved = $resolved -replace '\{\{publisher\.prefix\}\}', $Config.publisher.customizationPrefix
    $resolved = $resolved -replace '\{\{publisher\.customizationPrefix\}\}', $Config.publisher.customizationPrefix
    
    return $resolved
}

try {
    # Change to project root directory (parent of BuildDataverseSolution)
    $projectRoot = Split-Path -Parent $PSScriptRoot
    Set-Location $projectRoot
    Write-Info "Working directory: $projectRoot"
    Write-Info "CI/CD Mode: $CiMode"
    
    # Display environment information for debugging
    if ($CiMode -eq "DevOps") {
        Write-Info "Azure DevOps Build detected (TF_BUILD: $env:TF_BUILD)"
        Write-Info "Build ID: $env:BUILD_BUILDID"
        Write-Info "Build Number: $env:BUILD_BUILDNUMBER"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Info "GitHub Actions detected (GITHUB_ACTIONS: $env:GITHUB_ACTIONS)"
        Write-Info "Workflow: $env:GITHUB_WORKFLOW"
        Write-Info "Run ID: $env:GITHUB_RUN_ID"
    }
    else {
        Write-Info "Local build environment"
    }
    
    Write-Info "Loading configuration from: $ConfigFile"
    $config = Parse-YamlFile -FilePath $ConfigFile
    
    # Override config values with command line parameters
    $baseSolutionName = if ($SolutionName) { $SolutionName } else { $config.solution.uniqueName }
    $solutionVersion = $config.solution.version
    $finalSolutionName = "${baseSolutionName}_v${solutionVersion}"
    $finalPublisherName = if ($PublisherName) { $PublisherName } else { $config.publisher.uniqueName }
    $finalPublisherPrefix = if ($PublisherPrefix) { $PublisherPrefix } else { $config.publisher.customizationPrefix }
    $finalCleanBuild = if ($PSBoundParameters.ContainsKey('CleanBuild')) { $CleanBuild } else { $config.build.cleanBuild -eq "true" }
    $finalSolutionType = if ($PSBoundParameters.ContainsKey('SolutionType')) { $SolutionType } else { 
        if ($config.build.solutionType) { $config.build.solutionType } else { "Both" }
    }
    
    Write-Info "Starting PCF Control Build Process..."
    Write-Info "Solution Name: $baseSolutionName"
    Write-Info "Solution Version: $solutionVersion"
    Write-Info "Final Package Name: releases/$finalSolutionName.zip"
    Write-Info "Publisher: $finalPublisherName ($finalPublisherPrefix)"
    Write-Info "Build Configuration: $BuildConfiguration"
    Write-Info "Solution Type: $finalSolutionType"
    Write-Info "Clean Build: $finalCleanBuild"
    
    # Step 1: Validate required files
    Write-Info "Validating project structure..."
    if ($config.validation.requiredFiles) {
        foreach ($file in $config.validation.requiredFiles) {
            if (-not (Test-Path $file)) {
                throw "Required file missing: $file"
            }
        }
    }
    Write-Success "Project structure validation passed"
    
    # Step 2: Create releases directory and clean previous build artifacts
    $releasesDir = "releases"
    if (-not (Test-Path $releasesDir)) {
        New-Item -ItemType Directory -Path $releasesDir -Force | Out-Null
        Write-Info "Created releases directory: $releasesDir"
    }
    
    if ($finalCleanBuild) {
        Write-Info "Cleaning previous build artifacts..."
        $cleanPaths = @("out", $config.solutionStructure.tempDirectory)
        
        # Clean solution packages based on naming pattern in releases directory
        $packagePatterns = @(
            "$releasesDir/${finalSolutionName}_managed.zip",
            "$releasesDir/${finalSolutionName}_unmanaged.zip",
            "$releasesDir/$finalSolutionName.zip",  # Legacy single package
            "${finalSolutionName}_managed.zip",      # Legacy root location
            "${finalSolutionName}_unmanaged.zip",   # Legacy root location
            "$finalSolutionName.zip"                 # Legacy root location
        )
        
        foreach ($pattern in $packagePatterns) {
            $cleanPaths += $pattern
        }
        
        foreach ($path in $cleanPaths) {
            if (Test-Path $path) { 
                Remove-Item $path -Recurse -Force 
                Write-Info "Cleaned: $path"
            }
        }
        Write-Success "Clean completed"
    }
    
    # Step 3: Install npm dependencies
    Write-Info "Installing npm dependencies..."
    $npmCmd = if ($config.build.npmCommand) { $config.build.npmCommand } else { "ci" }
    if (Test-Path "package-lock.json") {
        & npm $npmCmd
    }
    else {
        & npm install
    }
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Success "Dependencies installed"
    
    # Step 3.5: Auto-increment version numbers
    Write-Info "Auto-incrementing version numbers..."
    
    # Read current version from ControlManifest.Input.xml and increment it
    $manifestPath = Join-Path $projectRoot "PCFFluentUiAutoComplete\ControlManifest.Input.xml"
    if (Test-Path $manifestPath) {
        try {
            # Load XML to get current version
            [xml]$manifestXml = Get-Content $manifestPath -Raw
            $controlNode = $manifestXml.manifest.control
            
            if ($controlNode) {
                $currentVersion = $controlNode.GetAttribute("version")
                Write-Info "Current version: $currentVersion"
                
                # Parse version (expected format: x.y.z)
                if ($currentVersion -match '^(\d+)\.(\d+)\.(\d+)$') {
                    $major = [int]$matches[1]
                    $minor = [int]$matches[2] 
                    $patch = [int]$matches[3]
                    
                    # Increment version with rollover logic
                    $patch++
                    
                    # Handle rollover: 0.0.99 -> 0.1.0
                    if ($patch -gt 99) {
                        $patch = 0
                        $minor++
                        
                        # Handle rollover: 0.99.x -> 1.0.0  
                        if ($minor -gt 99) {
                            $minor = 0
                            $major++
                        }
                    }
                    
                    $newVersion = "$major.$minor.$patch"
                    
                    Write-Info "Incrementing to version: $newVersion"
                    
                    # Update control version
                    $controlNode.SetAttribute("version", $newVersion)
                    
                    # Save with proper XML formatting
                    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                    $xmlWriterSettings = New-Object System.Xml.XmlWriterSettings
                    $xmlWriterSettings.Encoding = $utf8NoBom
                    $xmlWriterSettings.Indent = $true
                    $xmlWriterSettings.IndentChars = "  "
                    $xmlWriterSettings.NewLineChars = "`r`n"
                    $xmlWriterSettings.OmitXmlDeclaration = $false
                    
                    $xmlWriter = [System.Xml.XmlWriter]::Create($manifestPath, $xmlWriterSettings)
                    $manifestXml.Save($xmlWriter)
                    $xmlWriter.Close()
                    
                    Write-Success "Updated ControlManifest.Input.xml to version $newVersion"
                    
                    # Update package.json with same version
                    $packageJsonPath = Join-Path $projectRoot "package.json" 
                    if (Test-Path $packageJsonPath) {
                        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
                        $packageJson.version = $newVersion
                        $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -NoNewline
                        Write-Success "Updated package.json to version $newVersion"
                    }
                    
                } else {
                    Write-Warning "Version format not recognized: $currentVersion. Expected format: x.y.z"
                    Write-Info "Using default version 0.0.1"
                    $newVersion = "0.0.1"
                    $controlNode.SetAttribute("version", $newVersion)
                    $manifestXml.Save($manifestPath)
                }
            } else {
                Write-Warning "Could not find control element in ControlManifest.Input.xml"
            }
        } catch {
            Write-Warning "Failed to auto-increment version: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "ControlManifest.Input.xml not found at $manifestPath"
    }
    
    # Step 4: Build PCF control
    Write-Info "Building PCF control..."
    
    # Determine build command based on configuration
    if ($config.build.pcfBuildCommand) {
        $buildCmd = $config.build.pcfBuildCommand
    } elseif ($BuildConfiguration -eq "Release") {
        $buildCmd = "build"  # Uses production mode from package.json
    } else {
        $buildCmd = "build:dev"  # Uses development mode
    }
    
    & npm run $buildCmd
    if ($LASTEXITCODE -ne 0) { throw "PCF build failed" }
    Write-Success "PCF control built successfully"
    
    # Step 5: Validate post-build files
    if ($config.validation.postBuildFiles) {
        Write-Info "Validating build output..."
        foreach ($file in $config.validation.postBuildFiles) {
            if (-not (Test-Path $file)) {
                Write-Warning "Expected build output missing: $file"
            }
        }
        Write-Success "Build output validation completed"
    }
    
    # Step 6: Verify PAC CLI is available
    Write-Info "Checking Power Platform CLI..."
    try {
        $pacVersion = & pac --version 2>&1
        # Split on + and show first part only (version without build hash)
        $versionString = ($pacVersion -join ' ').Split('+')[0]
        Write-Success "PAC CLI available: $versionString"
    }
    catch {
        Write-Error "Power Platform CLI not found. Installing..."
        & dotnet tool install --global Microsoft.PowerApps.CLI.Tool
        if ($LASTEXITCODE -ne 0) { throw "Failed to install PAC CLI" }
        Write-Success "PAC CLI installed"
    }

    # Step 7: Create solution folder
    $tempDir = if ($config.solutionStructure.tempDirectory) { $config.solutionStructure.tempDirectory } else { "solution" }
    Write-Info "Creating solution structure in: $tempDir"
    
    # Clean up existing solution directory if it exists
    if (Test-Path $tempDir) {
        Write-Info "Removing existing solution directory: $tempDir"
        Remove-Item $tempDir -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Set-Location $tempDir

    # Step 8: Initialize solution
    Write-Info "Initializing Power Platform solution..."
    & pac solution init --publisher-name $finalPublisherName --publisher-prefix $finalPublisherPrefix
    if ($LASTEXITCODE -ne 0) { throw "Solution initialization failed" }
    Write-Success "Solution initialized"
    
    # Step 8.5: Update ProjectGuid if specified in solution.yaml
    if ($config.solution.projectGuid) {
        Write-Info "Updating ProjectGuid from solution.yaml..."
        $solutionProjPath = Get-ChildItem -Filter "*.cdsproj" | Select-Object -First 1 -ExpandProperty FullName
        if ($solutionProjPath) {
            $projectContent = Get-Content $solutionProjPath -Raw
            $oldGuidPattern = '<ProjectGuid>[^<]+</ProjectGuid>'
            $newGuidValue = "<ProjectGuid>$($config.solution.projectGuid)</ProjectGuid>"
            $projectContent = $projectContent -replace $oldGuidPattern, $newGuidValue
            $projectContent | Set-Content $solutionProjPath -Encoding UTF8
            Write-Success "ProjectGuid updated to: $($config.solution.projectGuid)"
        }
        else {
            Write-Warning "Solution project file not found - cannot update ProjectGuid"
        }
    }
    
    # Step 9: List solution contents for debugging
    Write-Info "Solution contents:"
    Get-ChildItem | ForEach-Object { Write-Host "  - $($_.Name)" }
    
    # Step 10: Add PCF control reference to solution
    Write-Info "Adding PCF control to solution..."
    $pcfPath = if ($config.project.pcfRootPath) { $config.project.pcfRootPath } else { "../" }
    & pac solution add-reference --path $pcfPath
    if ($LASTEXITCODE -ne 0) { throw "Failed to add PCF reference" }
    Write-Success "PCF control added to solution"
    
    # Step 10.5: Update Solution.xml with comprehensive solution information from solution.yaml BEFORE building
    if ($config.solution.uniqueName) {
        Write-Info "Updating Solution.xml with solution information from solution.yaml..."
        $solutionXmlPath = "src\Other\Solution.xml"
        if (Test-Path $solutionXmlPath) {
            # Load XML using proper XML parser
            [xml]$xmlDoc = Get-Content $solutionXmlPath -Raw -Encoding UTF8
            
            # Update Solution UniqueName
            $solutionManifest = $xmlDoc.ImportExportXml.SolutionManifest
            $solutionManifest.UniqueName = $config.solution.uniqueName
            Write-Info "Updated solution UniqueName to: $($config.solution.uniqueName)"
            
            # Update Solution Version
            $solutionVersion = if ($config.solution.version) { $config.solution.version } else { "1.0.0.0" }
            $solutionManifest.Version = $solutionVersion
            Write-Info "Updated solution Version to: $solutionVersion"
            
            # Update Solution Display Name
            if ($config.solution.localizedName) {
                $localizedName = $solutionManifest.LocalizedNames.LocalizedName | Where-Object { $_.languagecode -eq "1033" }
                if ($localizedName) {
                    $localizedName.description = $config.solution.localizedName
                    Write-Info "Updated solution LocalizedName to: $($config.solution.localizedName)"
                }
            }
            
            # Update Solution Description
            if ($config.solution.description) {
                # Check if Descriptions node exists, create if not
                if (-not $solutionManifest.Descriptions) {
                    $descriptionsNode = $xmlDoc.CreateElement("Descriptions")
                    $solutionManifest.AppendChild($descriptionsNode) | Out-Null
                }
                
                # Check if Description element exists, create if not
                $description = $solutionManifest.Descriptions.Description | Where-Object { $_.languagecode -eq "1033" }
                if (-not $description) {
                    $description = $xmlDoc.CreateElement("Description")
                    $description.SetAttribute("description", $config.solution.description)
                    $description.SetAttribute("languagecode", "1033")
                    $solutionManifest.Descriptions.AppendChild($description) | Out-Null
                } else {
                    $description.description = $config.solution.description
                }
                Write-Info "Updated solution Description to: $($config.solution.description)"
            }
            
            # Update Publisher Information
            $publisher = $solutionManifest.Publisher
            $publisher.UniqueName = $config.publisher.uniqueName
            Write-Info "Updated publisher UniqueName to: $($config.publisher.uniqueName)"
            
            # Update Publisher Display Name
            if ($config.publisher.localizedName) {
                $publisherLocalizedName = $publisher.LocalizedNames.LocalizedName | Where-Object { $_.languagecode -eq "1033" }
                if ($publisherLocalizedName) {
                    $publisherLocalizedName.description = $config.publisher.localizedName
                    Write-Info "Updated publisher LocalizedName to: $($config.publisher.localizedName)"
                }
            }
            
            # Update Publisher Description
            if ($config.publisher.description) {
                $publisherDescription = $publisher.Descriptions.Description | Where-Object { $_.languagecode -eq "1033" }
                if ($publisherDescription) {
                    $publisherDescription.description = $config.publisher.description
                    Write-Info "Updated publisher Description to: $($config.publisher.description)"
                }
            }
            
            # Update Customization Prefix
            if ($config.publisher.customizationPrefix) {
                $publisher.CustomizationPrefix = $config.publisher.customizationPrefix
                Write-Info "Updated CustomizationPrefix to: $($config.publisher.customizationPrefix)"
            }
            
            # Set Solution.xml to unmanaged initially (0) - we'll handle packaging separately
            # This ensures the source solution is always unmanaged, and managed packages are created via PAC CLI
            $managedValue = 0  # Always start with unmanaged
            Write-Info "Setting Solution.xml to unmanaged mode for proper packaging"
            $solutionManifest.Managed = $managedValue.ToString()
            
            # Update RootComponent for PCF control (type="66" is for CustomControl)
            $rootComponents = $solutionManifest.RootComponents
            if ($rootComponents) {
                # Clear existing root components
                $rootComponents.RemoveAll()
                
                # Add our PCF control root component
                $rootComponent = $xmlDoc.CreateElement("RootComponent")
                $rootComponent.SetAttribute("type", "66")
                $rootComponent.SetAttribute("schemaName", "$($config.publisher.customizationPrefix).PCFFluentUiAutoCompleteGooglePlaces")
                $rootComponent.SetAttribute("behavior", "0")
                $rootComponents.AppendChild($rootComponent) | Out-Null
                Write-Info "Updated RootComponent with schemaName: $($config.publisher.customizationPrefix).PCFFluentUiAutoCompleteGooglePlaces"
            }
            
            # Save the updated XML with proper formatting
            $xmlSettings = New-Object System.Xml.XmlWriterSettings
            $xmlSettings.Indent = $true
            $xmlSettings.IndentChars = "  "
            $xmlSettings.NewLineChars = "`r`n"
            $xmlSettings.Encoding = [System.Text.Encoding]::UTF8
            
            $xmlWriter = [System.Xml.XmlWriter]::Create($solutionXmlPath, $xmlSettings)
            try {
                $xmlDoc.WriteTo($xmlWriter)
                Write-Info "Successfully updated Solution.xml with proper XML formatting"
            }
            finally {
                $xmlWriter.Close()
            }
            Write-Success "Solution.xml updated with comprehensive solution information:"
            Write-Info "  - Solution Name: $($config.solution.uniqueName)"
            Write-Info "  - Version: $solutionVersion"  
            Write-Info "  - Publisher: $($config.publisher.localizedName)"
            Write-Info "  - Prefix: $($config.publisher.customizationPrefix)"
            Write-Info "  - Managed Mode: $managedValue (Unmanaged)"
            Write-Info "  - Root Component: $($config.publisher.customizationPrefix).PCFFluentUiAutoCompleteGooglePlaces"
        } else {
            Write-Warning "Solution.xml file not found - cannot update solution information"
        }
    }
    
    # Step 11: Build solution to ensure PCF control files are copied to solution structure
    Write-Info "Building solution to copy PCF control files..."
    $buildConfig = $BuildConfiguration.ToLower()
    & dotnet build --configuration $BuildConfiguration --verbosity minimal
    if ($LASTEXITCODE -ne 0) { 
        Write-Warning "Solution build had issues, but continuing with packaging..."
        Write-Info "The build may have failed due to managed/unmanaged package type conflicts, but PCF files should still be built."
    }
    else {
        Write-Success "Solution built successfully"
    }
    
    # Step 11.5: Verify and copy PCF control files to src for packaging
    $controlsOutPath = "../out/controls"
    $controlsSrcPath = "src/Controls"
    
    if (Test-Path $controlsOutPath) {
        Write-Success "PCF control files found in build output: $controlsOutPath"
        Get-ChildItem $controlsOutPath -Recurse | ForEach-Object { Write-Host "    - $($_.FullName.Replace($PWD, '.'))" }
        
        # Copy control files from out to src for solution packaging
        Write-Info "Copying PCF control files from $controlsOutPath to $controlsSrcPath..."
        if (-not (Test-Path $controlsSrcPath)) {
            New-Item -ItemType Directory -Path $controlsSrcPath -Force | Out-Null
        }
        Copy-Item -Path "$controlsOutPath/*" -Destination $controlsSrcPath -Recurse -Force
        Write-Success "PCF control files copied to solution src directory"
        
        # Verify files were copied
        if (Test-Path $controlsSrcPath) {
            Write-Info "Verifying copied control files:"
            Get-ChildItem $controlsSrcPath -Recurse | ForEach-Object { Write-Host "    - $($_.FullName.Replace($PWD, '.'))" }
        }
    }
    else {
        Write-Warning "PCF control files not found at expected build output location: $controlsOutPath"
        Write-Info "Checking for alternative control file locations..."
        $alternativePaths = @("bin/Release", "obj/Release", "out")
        foreach ($altPath in $alternativePaths) {
            if (Test-Path $altPath) {
                Write-Info "Found files at: $altPath"
                Get-ChildItem $altPath -Recurse -File | ForEach-Object { Write-Host "    - $($_.FullName.Replace($PWD, '.'))" }
            }
        }
    }
    
    # Step 12: Pack solution(s) based on SolutionType
    Write-Info "Packaging solution(s) - Type: $finalSolutionType..."
    $buildConfig = $BuildConfiguration.ToLower()
    $createdPackages = @()
    
    if ($finalSolutionType -eq "Unmanaged" -or $finalSolutionType -eq "Both") {
        Write-Info "Creating unmanaged solution package..."
        $unmanagedName = "${finalSolutionName}_unmanaged"
        $unmanagedPath = "../releases/$unmanagedName.zip"
        
        # Ensure Solution.xml is set to unmanaged before packing
        $solutionXmlPath = "src\Other\Solution.xml"
        if (Test-Path $solutionXmlPath) {
            $xmlContent = Get-Content $solutionXmlPath -Raw -Encoding UTF8
            $xmlContent = $xmlContent -replace '<Managed>\d+</Managed>', '<Managed>0</Managed>'
            $xmlContent | Set-Content $solutionXmlPath -Encoding UTF8
            Write-Info "Set Solution.xml to unmanaged mode (0) for unmanaged package"
        }
        
        # For unmanaged solutions, use pac solution pack without packagetype (defaults to unmanaged)
        & pac solution pack --zipfile $unmanagedPath --folder src
        if ($LASTEXITCODE -ne 0) { throw "Unmanaged solution packaging failed" }
        Write-Success "Unmanaged solution packaged: releases/$unmanagedName.zip"
        $createdPackages += "releases/$unmanagedName.zip"
    }
    
    if ($finalSolutionType -eq "Managed" -or $finalSolutionType -eq "Both") {
        Write-Info "Creating managed solution package..."
        $managedName = "${finalSolutionName}_managed"
        $managedPath = "../releases/$managedName.zip"
        
        # For managed solutions, set Solution.xml to managed, then use pac solution pack
        $solutionXmlPath = "src\Other\Solution.xml"
        if (Test-Path $solutionXmlPath) {
            $xmlContent = Get-Content $solutionXmlPath -Raw -Encoding UTF8
            $xmlContent = $xmlContent -replace '<Managed>\d+</Managed>', '<Managed>1</Managed>'
            $xmlContent | Set-Content $solutionXmlPath -Encoding UTF8
            Write-Info "Set Solution.xml to managed mode (1) for managed package"
        }
        
        # Use pac solution pack with --packagetype Managed
        & pac solution pack --zipfile $managedPath --packagetype Managed --folder src
        if ($LASTEXITCODE -ne 0) { throw "Managed solution packaging failed" }
        Write-Success "Managed solution packaged: releases/$managedName.zip"
        $createdPackages += "releases/$managedName.zip"
    }
    
    # Step 13: Return to root directory
    Set-Location ..
    
    # Step 14: Verify final output and validate
    if ($createdPackages.Count -gt 0) {
        Write-Success "Build completed successfully!"
        Write-Info "Created solution packages:"
        
        $totalSize = 0
        foreach ($package in $createdPackages) {
            if (Test-Path $package) {
                $zipSize = (Get-Item $package).Length
                $sizeKB = [math]::Round($zipSize / 1KB, 2)
                $totalSize += $zipSize
                
                # Validate minimum package size
                $minSize = if ($config.validation.solutionValidation.minPackageSize) { 
                    [int]$config.validation.solutionValidation.minPackageSize 
                }
                else { 1024 }
                
                if ($zipSize -lt $minSize) {
                    Write-Warning "Solution package size ($sizeKB KB) is smaller than expected minimum ($([math]::Round($minSize/1KB, 2)) KB) for $package"
                }
                
                Write-Host "  - $package ($sizeKB KB)"
            }
            else {
                Write-Warning "Expected package not found: $package"
            }
        }
        
        $totalSizeKB = [math]::Round($totalSize / 1KB, 2)
        Write-Info "Total package size: $totalSizeKB KB"
        
        # List all build outputs
        Write-Info "Build outputs:"
        if (Test-Path "out") {
            Write-Host "  PCF Build Output (out/):"
            Get-ChildItem "out" -Recurse | ForEach-Object { Write-Host "    - $($_.FullName.Replace($PWD, '.'))" }
        }
        Write-Host "  Solution Packages:"
        foreach ($package in $createdPackages) {
            Write-Host "    - $package"
        }
        
        # Run post-build script if defined
        if ($config.scripts.postBuild -and $config.scripts.postBuild.Trim()) {
            Write-Info "Running post-build script..."
            try {
                Invoke-Expression $config.scripts.postBuild
            }
            catch {
                Write-Warning "Post-build script failed: $($_.Exception.Message)"
            }
        }
        
    }
    else {
        throw "No solution packages were created"
    }
    
    Write-Success "Build process completed successfully!"
    
    # Set CI-specific success indicators
    if ($CiMode -eq "DevOps") {
        Write-Host "##vso[task.complete result=Succeeded;]Build completed successfully"
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::notice::✅ Build completed successfully"
    }
    
    return 0
}
catch {
    $errorMessage = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    
    Write-BuildError "Build failed: $errorMessage"
    
    # Set CI-specific error indicators
    if ($CiMode -eq "DevOps") {
        Write-Host "##vso[task.logissue type=error]Build failed: $errorMessage"
        Write-Host "##vso[task.complete result=Failed;]Build failed"
        if ($stackTrace) {
            Write-Host "##[debug]Stack trace: $stackTrace"
        }
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::error::Build failed: $errorMessage"
        if ($stackTrace) {
            Write-Host "::debug::Stack trace: $stackTrace"
        }
    }
    else {
        Write-Host "Stack trace: $stackTrace" -ForegroundColor Red
    }
    
    # Cleanup on failure
    Set-Location $PSScriptRoot
    $tempDir = if ($config.solutionStructure.tempDirectory) { $config.solutionStructure.tempDirectory } else { "solution" }
    if (Test-Path $tempDir) {
        Write-Warning "Cleaning up failed build artifacts..."
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    return 1
}
finally {
    # Ensure we're back in the root directory
    Set-Location $PSScriptRoot
}
