#!/usr/bin/env pwsh

#==============================================================================
# PCF SOLUTION BUILD SCRIPT - COMPREHENSIVE BUILD AUTOMATION
#==============================================================================
# This script provides complete automation for building Power Platform Custom
# Control Framework (PCF) controls and packaging them into solution files.
#
# KEY FEATURES:
# ✓ Automated version management with auto-increment
# ✓ Comprehensive project validation and dependency checking
# ✓ Intelligent build configuration with proper XML parsing
# ✓ Support for Unmanaged, Managed, and Both solution types
# ✓ CI/CD integration (GitHub Actions, Azure DevOps, Local)
# ✓ Robust error handling and detailed logging
# ✓ Proper root component configuration for PCF controls
#
# WORKFLOW OVERVIEW:
# 1. 🔧 ENVIRONMENT SETUP: Validate tools, detect CI/CD mode
# 2. 📁 PROJECT VALIDATION: Check structure, load configuration
# 3. 🧹 CLEANUP: Remove previous build artifacts if needed
# 4. 📦 DEPENDENCIES: Install npm packages and restore tools
# 5. 🔢 VERSION MANAGEMENT: Auto-increment versions across files
# 6. 🏗️  PCF BUILD: Compile TypeScript, bundle with webpack
# 7. 🔨 SOLUTION CREATION: Initialize Power Platform solution structure
# 8. ⚙️  XML CONFIGURATION: Update Solution.xml with metadata and root components
# 9. 📋 FILE ORGANIZATION: Copy PCF files to solution structure
# 10. 📦 PACKAGING: Create unmanaged/managed solution ZIP files
# 11. ✅ VALIDATION: Verify outputs and report results
#==============================================================================

<#
.SYNOPSIS
    Build PCF Control and create Power Platform solution package using solution.yaml configuration

.DESCRIPTION
    This script provides a complete automated build pipeline for PCF controls with the following capabilities:
    
    🏗️  BUILD PROCESS:
    - Validates project structure and required files
    - Auto-increments version numbers across ControlManifest.Input.xml and package.json
    - Builds PCF control with TypeScript compilation and webpack bundling
    - Creates Power Platform solution structure with proper metadata
    
    📦 SOLUTION PACKAGING:
    - Supports Unmanaged solutions (for development/customization environments)
    - Supports Managed solutions (for production environments - read-only)  
    - Can create both types in a single build process
    - Proper XML parsing and root component configuration
    
    🔧 CI/CD INTEGRATION:
    - GitHub Actions support with environment detection
    - Azure DevOps pipeline integration
    - Local development workflow
    - Comprehensive error handling and logging
    
    ⚙️  CONFIGURATION:
    Uses solution.yaml for project configuration including:
    - Solution metadata (name, description, version)
    - Publisher information (name, prefix, contact details) 
    - Build settings (clean build, output paths)
    - Root component definitions for PCF controls

.PARAMETER ConfigFile
    Path to the solution.yaml configuration file 
    Default: "./solution.yaml"

.PARAMETER SolutionName
    Override solution name from config file
    Used to customize solution naming without modifying config

.PARAMETER PublisherName
    Override publisher name from config file
    Useful for different deployment environments

.PARAMETER PublisherPrefix
    Override publisher prefix from config file
    Must be valid Power Platform customization prefix

.PARAMETER CleanBuild
    Override clean build setting from config file
    When true, removes out/ and solution/ folders before building
    Default: $true

.PARAMETER BuildConfiguration
    Build configuration for compilation and packaging
    - "Debug": Development builds with source maps and debugging info
    - "Release": Production builds with optimization and minification
    Default: "Release"

.PARAMETER SolutionType
    Type of solution package(s) to create:
    - "Managed": Read-only solution for production deployment
    - "Unmanaged": Customizable solution for development environments  
    - "Both": Creates both managed and unmanaged packages
    Default: "Both"

.PARAMETER CiMode
    CI/CD integration mode (auto-detected if not specified):
    - "GitHub": GitHub Actions environment with specific logging
    - "DevOps": Azure DevOps pipeline integration
    - "Local": Interactive local development with user prompts
    Default: Auto-detected based on environment variables

.EXAMPLE
    .\build-solution.ps1
    # Standard build with default settings (Release, Both solutions, auto-detect CI mode)

.EXAMPLE
    .\build-solution.ps1 -ConfigFile ".\custom-solution.yaml" -BuildConfiguration "Debug"
    # Use custom config file with debug build

.EXAMPLE
    .\build-solution.ps1 -SolutionType "Managed" -BuildConfiguration "Release"
    # Create only managed solution package for production deployment

.EXAMPLE
    .\build-solution.ps1 -SolutionName "MyCustomSolution" -PublisherPrefix "custom"
    # Override solution name and publisher prefix from config

.EXAMPLE
    .\build-solution.ps1 -CiMode "GitHub" -CleanBuild $false
    # Force GitHub Actions mode without cleaning previous build

.NOTES
    REQUIREMENTS:
    - PowerShell 5.1 or later
    - Node.js 14+ and npm for PCF building
    - Power Platform CLI (pac) for solution operations
    - .NET SDK 6.0+ for solution building
    
    FILE DEPENDENCIES:
    - solution.yaml: Solution configuration and metadata
    - package.json: Node.js project configuration with dependencies
    - ControlManifest.Input.xml: PCF control manifest and properties
    - PCF source files in designated project folder
    
    OUTPUT FILES:
    - out/: Compiled PCF control files
    - solution/: Power Platform solution structure  
    - releases/: Final solution ZIP packages
    
    ERROR HANDLING:
    - Comprehensive validation of all dependencies and files
    - Graceful error messages with troubleshooting guidance
    - Build continues where possible, with clear failure points
    - Exit codes for CI/CD integration
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

#==============================================================================
# 🚀 SCRIPT INITIALIZATION AND ENVIRONMENT SETUP
#==============================================================================
# This section handles the initial setup and environment detection needed
# for the build process. It configures error handling, detects CI/CD mode,
# and sets up the foundation for the rest of the build pipeline.
#==============================================================================

# Set error action preference - Stop on any error to ensure build integrity
$ErrorActionPreference = "Stop"

# 🔍 DETECT CI/CD ENVIRONMENT
# Auto-detect the CI/CD environment if not explicitly specified
# This enables environment-specific optimizations and logging
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
    # Find the PCF control folder dynamically instead of hardcoding
    $pcfFolders = Get-ChildItem $projectRoot -Directory | Where-Object { 
        Test-Path (Join-Path $_.FullName "ControlManifest.Input.xml") 
    }
    
    if ($pcfFolders.Count -eq 0) {
        throw "No PCF control folder with ControlManifest.Input.xml found in project root"
    }
    elseif ($pcfFolders.Count -gt 1) {
        Write-Warning "Multiple PCF control folders found. Using first one: $($pcfFolders[0].Name)"
    }
    
    $pcfControlFolder = $pcfFolders[0].Name
    $manifestPath = Join-Path $projectRoot "$pcfControlFolder\ControlManifest.Input.xml"
    Write-Info "Using PCF control folder: $pcfControlFolder"
    
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
                    
                }
                else {
                    Write-Warning "Version format not recognized: $currentVersion. Expected format: x.y.z"
                    Write-Info "Using default version 0.0.1"
                    $newVersion = "0.0.1"
                    $controlNode.SetAttribute("version", $newVersion)
                    $manifestXml.Save($manifestPath)
                }
            }
            else {
                Write-Warning "Could not find control element in ControlManifest.Input.xml"
            }
        }
        catch {
            Write-Warning "Failed to auto-increment version: $($_.Exception.Message)"
        }
    }
    else {
        Write-Warning "ControlManifest.Input.xml not found at $manifestPath"
    }
    
    # Step 4: Build PCF control
    Write-Info "Building PCF control..."
    
    # Determine build command based on configuration
    if ($config.build.pcfBuildCommand) {
        $buildCmd = $config.build.pcfBuildCommand
    }
    elseif ($BuildConfiguration -eq "Release") {
        $buildCmd = "build"  # Uses production mode from package.json
    }
    else {
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
                # Check if Descriptions node exists and has content, create proper structure if not
                $descriptionsElement = $solutionManifest.SelectSingleNode("Descriptions")
                if (-not $descriptionsElement -or $descriptionsElement.IsEmpty) {
                    # Remove empty Descriptions element if it exists
                    if ($descriptionsElement) {
                        $solutionManifest.RemoveChild($descriptionsElement) | Out-Null
                    }
                    
                    # Create new Descriptions element with content
                    $descriptionsNode = $xmlDoc.CreateElement("Descriptions")
                    $description = $xmlDoc.CreateElement("Description")
                    $description.SetAttribute("description", $config.solution.description)
                    $description.SetAttribute("languagecode", "1033")
                    $descriptionsNode.AppendChild($description) | Out-Null
                    $solutionManifest.AppendChild($descriptionsNode) | Out-Null
                }
                else {
                    # Check if Description element exists, create if not
                    $description = $descriptionsElement.SelectSingleNode("Description[@languagecode='1033']")
                    if (-not $description) {
                        $description = $xmlDoc.CreateElement("Description")
                        $description.SetAttribute("description", $config.solution.description)
                        $description.SetAttribute("languagecode", "1033")
                        $descriptionsElement.AppendChild($description) | Out-Null
                    }
                    else {
                        $description.SetAttribute("description", $config.solution.description)
                    }
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
            $rootComponentsNode = $xmlDoc.SelectSingleNode("//RootComponents")
            if ($rootComponentsNode) {
                # Clear existing root components
                $rootComponentsNode.RemoveAll()
                
                # Read control information from ControlManifest.Input.xml to build schema name dynamically
                $controlNamespace = ""
                $controlConstructor = ""
                
                # Find PCF control folder dynamically
                $pcfFolders = Get-ChildItem $projectRoot -Directory | Where-Object { 
                    Test-Path (Join-Path $_.FullName "ControlManifest.Input.xml") 
                }
                
                if ($pcfFolders.Count -gt 0) {
                    $pcfControlFolder = $pcfFolders[0].Name
                    $manifestPath = Join-Path $projectRoot "$pcfControlFolder\ControlManifest.Input.xml"
                    
                    if (Test-Path $manifestPath) {
                        try {
                            [xml]$manifestXml = Get-Content $manifestPath -Raw
                            $controlNode = $manifestXml.manifest.control
                            
                            if ($controlNode) {
                                $controlNamespace = $controlNode.GetAttribute("namespace")
                                $controlConstructor = $controlNode.GetAttribute("constructor")
                                Write-Info "Found control in manifest: namespace='$controlNamespace', constructor='$controlConstructor'"
                            }
                        }
                        catch {
                            Write-Warning "Failed to read control information from ControlManifest.Input.xml: $($_.Exception.Message)"
                        }
                    }
                }
                
                # Fallback to config values if manifest reading failed
                if ([string]::IsNullOrEmpty($controlNamespace) -or [string]::IsNullOrEmpty($controlConstructor)) {
                    Write-Warning "Could not read control information from manifest, using config fallback"
                    $controlNamespace = $config.publisher.customizationPrefix
                    $controlConstructor = $config.solution.uniqueName
                }
                
                # Build schema name: namespace.constructor (e.g., "err403.PCFFluentUiAutoCompleteGooglePlaces")
                $schemaName = "$controlNamespace.$controlConstructor"
                
                # Add our PCF control root component  
                $rootComponent = $xmlDoc.CreateElement("RootComponent")
                $rootComponent.SetAttribute("type", "66")
                $rootComponent.SetAttribute("schemaName", $schemaName)
                $rootComponent.SetAttribute("behavior", "0")
                $rootComponentsNode.AppendChild($rootComponent) | Out-Null
                Write-Info "Updated RootComponent with schemaName: $schemaName"
            }
            
            # Save the updated XML with proper formatting
            $xmlDoc.Save((Resolve-Path $solutionXmlPath).Path)
            Write-Info "Successfully updated Solution.xml with proper XML formatting"
            Write-Success "Solution.xml updated with comprehensive solution information:"
            Write-Info "  - Solution Name: $($config.solution.uniqueName)"
            Write-Info "  - Version: $solutionVersion"  
            Write-Info "  - Publisher: $($config.publisher.localizedName)"
            Write-Info "  - Prefix: $($config.publisher.customizationPrefix)"
            Write-Info "  - Managed Mode: $managedValue (Unmanaged)"
            Write-Info "  - Root Component: $schemaName"
        }

        #==============================================================================
        # 📁 STEP 11: PCF CONTROL FILE ORGANIZATION
        #==============================================================================  
        # Copy the built PCF control files from the out/ directory to the solution 
        # src/ directory structure. This step prepares files for solution packaging
        # without using the problematic MSBuild process that causes managed/unmanaged
        # conflicts.
        #==============================================================================
    
        # 📋 COPY PCF FILES TO SOLUTION STRUCTURE
        # Instead of using dotnet build (which has managed/unmanaged conflicts),
        # we directly copy the already-built PCF files to the solution structure
        Write-Info "Copying PCF control files from ../out/controls to src/Controls..."
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
    
        #==============================================================================
        # 📦 STEP 12: SOLUTION PACKAGING
        #==============================================================================
        # This section handles the creation of the final solution ZIP packages.
        # It supports three packaging modes:
        # 
        # 🔓 UNMANAGED SOLUTIONS:
        #   - For development and customization environments
        #   - Allows modification of components after import
        #   - Solution.xml <Managed> set to 0
        #   - Uses: pac solution pack (defaults to unmanaged)
        #
        # 🔒 MANAGED SOLUTIONS: 
        #   - For production environments
        #   - Components are read-only after import
        #   - Solution.xml <Managed> set to 1
        #   - Uses: pac solution pack --packagetype Managed
        #
        # 📦 BOTH MODE:
        #   - Creates separate unmanaged and managed packages
        #   - Modifies Solution.xml appropriately for each package
        #   - Ideal for complete deployment pipeline support
        #==============================================================================

        Write-Info "Packaging solution(s) - Type: $finalSolutionType..."
        $buildConfig = $BuildConfiguration.ToLower()
        $createdPackages = @()
    
        # 🔓 CREATE UNMANAGED SOLUTION PACKAGE
        # Unmanaged solutions allow customization after import and are ideal for
        # development environments where components may need to be modified
        if ($finalSolutionType -eq "Unmanaged" -or $finalSolutionType -eq "Both") {
            Write-Info "Creating unmanaged solution package..."
            $unmanagedName = "${finalSolutionName}_unmanaged"
            $unmanagedPath = "../releases/$unmanagedName.zip"
        
            # 📝 CONFIGURE SOLUTION.XML FOR UNMANAGED PACKAGE
            # Set the <Managed> element to 0 to indicate this is an unmanaged solution
            $solutionXmlPath = "src\Other\Solution.xml"
            if (Test-Path $solutionXmlPath) {
                Write-Info "Set Solution.xml to unmanaged mode (0) for unmanaged package"
                $xmlDoc = [xml](Get-Content $solutionXmlPath -Raw -Encoding UTF8)
                $managedNode = $xmlDoc.SelectSingleNode("//Managed")
                if ($managedNode) {
                    $managedNode.InnerText = "0"
                    $xmlDoc.Save((Resolve-Path $solutionXmlPath).Path)
                }
            }
        
            # 📦 PACKAGE UNMANAGED SOLUTION
            # Use pac solution pack without packagetype parameter (defaults to unmanaged)
            Write-Info "Packing Solution..."
            & pac solution pack --zipfile $unmanagedPath --folder src
            if ($LASTEXITCODE -ne 0) { throw "Unmanaged solution packaging failed" }
            Write-Success "Unmanaged solution packaged: releases/$unmanagedName.zip"
            $createdPackages += "releases/$unmanagedName.zip"
        }
    
        # 🔒 CREATE MANAGED SOLUTION PACKAGE
        # Managed solutions provide read-only components for production environments
        # Components cannot be customized after import, ensuring solution integrity
        if ($finalSolutionType -eq "Managed" -or $finalSolutionType -eq "Both") {
            Write-Info "Creating managed solution package..."
            $managedName = "${finalSolutionName}_managed"
            $managedPath = "../releases/$managedName.zip"
        
            # 📝 CONFIGURE SOLUTION.XML FOR MANAGED PACKAGE
            # Set the <Managed> element to 1 to indicate this is a managed solution
            $solutionXmlPath = "src\Other\Solution.xml"
            if (Test-Path $solutionXmlPath) {
                Write-Info "Set Solution.xml to managed mode (1) for managed package"
                $xmlDoc = [xml](Get-Content $solutionXmlPath -Raw -Encoding UTF8)
                $managedNode = $xmlDoc.SelectSingleNode("//Managed")
                if ($managedNode) {
                    $managedNode.InnerText = "1"
                    $xmlDoc.Save((Resolve-Path $solutionXmlPath).Path)
                }
            }
        
            # 📦 PACKAGE MANAGED SOLUTION
            # Use pac solution pack with explicit --packagetype Managed parameter
            Write-Info "Packing Solution..."
            & pac solution pack --zipfile $managedPath --packagetype Managed --folder src
            if ($LASTEXITCODE -ne 0) { throw "Managed solution packaging failed" }
            Write-Success "Managed solution packaged: releases/$managedName.zip"
            $createdPackages += "releases/$managedName.zip"
        }
    
        # Close the main if ($config.solution.uniqueName) block
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
