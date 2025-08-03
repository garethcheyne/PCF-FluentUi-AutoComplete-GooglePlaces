#!/usr/bin/env pwsh

#==============================================================================
# PCF SOLUTION CREATION SCRIPT - POWER PLATFORM SOLUTION INITIALIZATION
#==============================================================================
# This script handles the creation and configuration of Power Platform solutions
# based on solution.yaml configuration. It initializes the solution structure,
# updates XML metadata, and prepares the solution for PCF control integration.
#
# KEY FEATURES:
# ✓ Solution initialization with Power Platform CLI
# ✓ XML metadata configuration from solution.yaml
# ✓ Root component configuration for PCF controls
# ✓ Project GUID management for consistent solution identity
# ✓ Publisher information setup and validation
#
# WORKFLOW OVERVIEW:
# 1. 🔧 PARAMETER VALIDATION: Validate input parameters and paths
# 2. 📁 SOLUTION INITIALIZATION: Create Power Platform solution structure
# 3. 🔧 PROJECT CONFIGURATION: Update project GUID and settings
# 4. 📋 XML METADATA: Configure Solution.xml with comprehensive information
# 5. 🔗 PCF INTEGRATION: Add PCF control reference and root components
# 6. ✅ VALIDATION: Verify solution structure and configuration
#==============================================================================

<#
.SYNOPSIS
    Create and configure Power Platform solution based on solution.yaml configuration

.DESCRIPTION
    This script creates a new Power Platform solution structure using the Power Platform CLI
    and configures it with metadata from solution.yaml. It handles:
    
    🏗️  SOLUTION CREATION:
    - Initializes Power Platform solution structure
    - Configures publisher information and customization prefix
    - Sets up project GUID for solution identity consistency
    
    📝 XML CONFIGURATION:
    - Updates Solution.xml with comprehensive metadata
    - Configures solution name, version, and descriptions
    - Sets up publisher information and localized names
    - Adds root components for PCF controls
    
    🔗 PCF INTEGRATION:
    - Adds PCF control reference to solution
    - Configures root component schema names
    - Validates control manifest information

.PARAMETER ConfigFile
    Path to the solution.yaml configuration file
    Default: "../solution.yaml"

.PARAMETER SolutionDirectory
    Directory where the solution will be created
    Default: Current directory

.PARAMETER PublisherName
    Override publisher name from config file
    Used for different deployment environments

.PARAMETER PublisherPrefix
    Override publisher prefix from config file
    Must be valid Power Platform customization prefix

.PARAMETER PCFRootPath
    Path to the PCF control project root
    Default: "../" (parent directory)

.PARAMETER CiMode
    CI/CD integration mode for logging:
    - "GitHub": GitHub Actions environment
    - "DevOps": Azure DevOps pipeline
    - "Local": Interactive local development
    Default: Auto-detected

.EXAMPLE
    .\create-solution.ps1
    # Create solution with default settings using ../solution.yaml

.EXAMPLE
    .\create-solution.ps1 -ConfigFile "custom-solution.yaml" -SolutionDirectory "mysolution"
    # Create solution in custom directory with custom config

.EXAMPLE
    .\create-solution.ps1 -PublisherName "CustomPublisher" -PublisherPrefix "custom"
    # Override publisher settings from config file

.NOTES
    REQUIREMENTS:
    - PowerShell 5.1 or later
    - Power Platform CLI (pac) installed and available
    - Valid solution.yaml configuration file
    - PCF control project with ControlManifest.Input.xml
    
    OUTPUT:
    - Complete Power Platform solution structure
    - Configured Solution.xml with metadata
    - PCF control reference added to solution
    - Ready for solution packaging
#>

param(
    [string]$ConfigFile = "../solution.yaml",
    [string]$SolutionDirectory = ".",
    [string]$PublisherName = "",
    [string]$PublisherPrefix = "",
    [string]$PCFRootPath = "../",
    [string]$CiMode = ""
)

#==============================================================================
# 🚀 SCRIPT INITIALIZATION
#==============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

# Auto-detect CI/CD environment if not specified
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

# Logging functions adapted for CI environments
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

# YAML parsing function (simple parser for basic YAML structure)
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

try {
    Write-Info "Starting Power Platform Solution Creation..."
    Write-Info "Configuration File: $ConfigFile"
    Write-Info "Solution Directory: $SolutionDirectory"
    Write-Info "CI/CD Mode: $CiMode"
    
    # Step 1: Load and validate configuration
    Write-Info "Loading solution configuration..."
    if (-not (Test-Path $ConfigFile)) {
        throw "Configuration file not found: $ConfigFile"
    }
    
    $config = Parse-YamlFile -FilePath $ConfigFile
    
    # Resolve configuration values with parameter overrides
    $finalPublisherName = if ($PublisherName) { $PublisherName } else { $config.publisher.uniqueName }
    $finalPublisherPrefix = if ($PublisherPrefix) { $PublisherPrefix } else { $config.publisher.customizationPrefix }
    
    Write-Success "Configuration loaded successfully"
    Write-Info "Solution: $($config.solution.uniqueName) v$($config.solution.version)"
    Write-Info "Publisher: $finalPublisherName ($finalPublisherPrefix)"
    
    # Step 2: Verify Power Platform CLI is available
    Write-Info "Checking Power Platform CLI availability..."
    try {
        $pacVersion = & pac --version 2>&1
        $versionString = ($pacVersion -join ' ').Split('+')[0]
        Write-Success "PAC CLI available: $versionString"
    }
    catch {
        throw "Power Platform CLI not found. Please install Microsoft.PowerApps.CLI.Tool"
    }
    
    # Step 3: Initialize solution directory
    Write-Info "Preparing solution directory: $SolutionDirectory"
    if (-not (Test-Path $SolutionDirectory)) {
        New-Item -ItemType Directory -Path $SolutionDirectory -Force | Out-Null
    }
    
    # Change to solution directory
    $originalLocation = Get-Location
    Set-Location $SolutionDirectory
    
    # Step 4: Initialize Power Platform solution
    Write-Info "Initializing Power Platform solution..."
    & pac solution init --publisher-name $finalPublisherName --publisher-prefix $finalPublisherPrefix
    if ($LASTEXITCODE -ne 0) { 
        throw "Solution initialization failed" 
    }
    Write-Success "Solution initialized successfully"
    
    # Step 5: Update project GUID if specified
    if ($config.solution.projectGuid) {
        Write-Info "Updating project GUID from configuration..."
        $solutionProjPath = Get-ChildItem -Filter "*.cdsproj" | Select-Object -First 1 -ExpandProperty FullName
        if ($solutionProjPath) {
            $projectContent = Get-Content $solutionProjPath -Raw
            $oldGuidPattern = '<ProjectGuid>[^<]+</ProjectGuid>'
            $newGuidValue = "<ProjectGuid>$($config.solution.projectGuid)</ProjectGuid>"
            $projectContent = $projectContent -replace $oldGuidPattern, $newGuidValue
            $projectContent | Set-Content $solutionProjPath -Encoding UTF8
            Write-Success "Project GUID updated: $($config.solution.projectGuid)"
        }
        else {
            Write-Warning "Solution project file not found - cannot update project GUID"
        }
    }
    
    # Step 6: Add PCF control reference to solution
    Write-Info "Adding PCF control reference to solution..."
    & pac solution add-reference --path $PCFRootPath
    if ($LASTEXITCODE -ne 0) { 
        throw "Failed to add PCF control reference" 
    }
    Write-Success "PCF control reference added successfully"
    
    # Step 7: Configure Solution.xml with comprehensive metadata
    Write-Info "Configuring Solution.xml with metadata from configuration..."
    $solutionXmlPath = "src\Other\Solution.xml"
    
    if (-not (Test-Path $solutionXmlPath)) {
        throw "Solution.xml not found at expected location: $solutionXmlPath"
    }
    
    # Load and update Solution.xml
    [xml]$xmlDoc = Get-Content $solutionXmlPath -Raw -Encoding UTF8
    $solutionManifest = $xmlDoc.ImportExportXml.SolutionManifest
    
    # Update solution metadata
    $solutionManifest.UniqueName = $config.solution.uniqueName
    Write-Info "Updated solution UniqueName: $($config.solution.uniqueName)"
    
    $solutionManifest.Version = $config.solution.version
    Write-Info "Updated solution Version: $($config.solution.version)"
    
    # Update localized name
    if ($config.solution.localizedName) {
        $localizedName = $solutionManifest.LocalizedNames.LocalizedName | Where-Object { $_.languagecode -eq "1033" }
        if ($localizedName) {
            $localizedName.description = $config.solution.localizedName
            Write-Info "Updated solution LocalizedName: $($config.solution.localizedName)"
        }
    }
    
    # Update solution description
    if ($config.solution.description) {
        $descriptionsElement = $solutionManifest.SelectSingleNode("Descriptions")
        if (-not $descriptionsElement -or $descriptionsElement.IsEmpty) {
            # Remove empty element and create new one
            if ($descriptionsElement) {
                $solutionManifest.RemoveChild($descriptionsElement) | Out-Null
            }
            
            $descriptionsNode = $xmlDoc.CreateElement("Descriptions")
            $description = $xmlDoc.CreateElement("Description")
            $description.SetAttribute("description", $config.solution.description)
            $description.SetAttribute("languagecode", "1033")
            $descriptionsNode.AppendChild($description) | Out-Null
            $solutionManifest.AppendChild($descriptionsNode) | Out-Null
        }
        else {
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
        Write-Info "Updated solution Description: $($config.solution.description)"
    }
    
    # Update publisher information
    $publisher = $solutionManifest.Publisher
    $publisher.UniqueName = $config.publisher.uniqueName
    Write-Info "Updated publisher UniqueName: $($config.publisher.uniqueName)"
    
    if ($config.publisher.localizedName) {
        $publisherLocalizedName = $publisher.LocalizedNames.LocalizedName | Where-Object { $_.languagecode -eq "1033" }
        if ($publisherLocalizedName) {
            $publisherLocalizedName.description = $config.publisher.localizedName
            Write-Info "Updated publisher LocalizedName: $($config.publisher.localizedName)"
        }
    }
    
    if ($config.publisher.description) {
        $publisherDescription = $publisher.Descriptions.Description | Where-Object { $_.languagecode -eq "1033" }
        if ($publisherDescription) {
            $publisherDescription.description = $config.publisher.description
            Write-Info "Updated publisher Description: $($config.publisher.description)"
        }
    }
    
    if ($config.publisher.customizationPrefix) {
        $publisher.CustomizationPrefix = $config.publisher.customizationPrefix
        Write-Info "Updated CustomizationPrefix: $($config.publisher.customizationPrefix)"
    }
    
    # Set solution to unmanaged mode initially
    $solutionManifest.Managed = "0"
    Write-Info "Set solution to unmanaged mode for packaging flexibility"
    
    # Step 8: Configure root components for PCF control
    Write-Info "Configuring root components for PCF control..."
    $rootComponentsNode = $xmlDoc.SelectSingleNode("//RootComponents")
    if ($rootComponentsNode) {
        # Clear existing root components
        $rootComponentsNode.RemoveAll()
        
        # Read control information from ControlManifest.Input.xml
        $controlNamespace = ""
        $controlConstructor = ""
        
        # Find PCF control manifest dynamically
        $manifestSearchPath = Join-Path $PCFRootPath "*\ControlManifest.Input.xml"
        $manifestFiles = Get-ChildItem $manifestSearchPath -ErrorAction SilentlyContinue
        
        if ($manifestFiles.Count -gt 0) {
            $manifestPath = $manifestFiles[0].FullName
            Write-Info "Reading control information from: $manifestPath"
            
            try {
                [xml]$manifestXml = Get-Content $manifestPath -Raw
                $controlNode = $manifestXml.manifest.control
                
                if ($controlNode) {
                    $controlNamespace = $controlNode.GetAttribute("namespace")
                    $controlConstructor = $controlNode.GetAttribute("constructor")
                    Write-Info "Found control: namespace='$controlNamespace', constructor='$controlConstructor'"
                }
            }
            catch {
                Write-Warning "Failed to read control manifest: $($_.Exception.Message)"
            }
        }
        
        # Fallback to config values if manifest reading failed
        if ([string]::IsNullOrEmpty($controlNamespace) -or [string]::IsNullOrEmpty($controlConstructor)) {
            Write-Warning "Using config fallback for control information"
            $controlNamespace = $config.publisher.customizationPrefix
            $controlConstructor = $config.solution.uniqueName
        }
        
        # Build schema name and add root component
        $schemaName = "$controlNamespace.$controlConstructor"
        $rootComponent = $xmlDoc.CreateElement("RootComponent")
        $rootComponent.SetAttribute("type", "66")  # CustomControl type
        $rootComponent.SetAttribute("schemaName", $schemaName)
        $rootComponent.SetAttribute("behavior", "0")
        $rootComponentsNode.AppendChild($rootComponent) | Out-Null
        Write-Info "Added root component with schema: $schemaName"
    }
    
    # Save the updated XML
    $xmlDoc.Save((Resolve-Path $solutionXmlPath).Path)
    Write-Success "Solution.xml updated with comprehensive configuration"
    
    # Step 9: Validate solution structure
    Write-Info "Validating solution structure..."
    $expectedPaths = @(
        "src\Other\Solution.xml",
        "src\Other\Customizations.xml",
        "src\Other\Relationships.xml"
    )
    
    $missingPaths = @()
    foreach ($path in $expectedPaths) {
        if (-not (Test-Path $path)) {
            $missingPaths += $path
        }
    }
    
    if ($missingPaths.Count -gt 0) {
        Write-Warning "Some expected solution files are missing:"
        foreach ($missing in $missingPaths) {
            Write-Warning "  - $missing"
        }
    }
    else {
        Write-Success "Solution structure validation passed"
    }
    
    # Step 10: Display solution summary
    Write-Success "Power Platform Solution created successfully!"
    Write-Info "Solution Summary:"
    Write-Info "  - Name: $($config.solution.uniqueName)"
    Write-Info "  - Display Name: $($config.solution.localizedName)"
    Write-Info "  - Version: $($config.solution.version)"
    Write-Info "  - Publisher: $($config.publisher.localizedName) ($($config.publisher.customizationPrefix))"
    Write-Info "  - Root Component: $schemaName"
    Write-Info "  - Location: $((Get-Location).Path)"
    
    return 0
}
catch {
    $errorMessage = $_.Exception.Message
    $stackTrace = $_.ScriptStackTrace
    
    Write-BuildError "Solution creation failed: $errorMessage"
    
    if ($CiMode -eq "DevOps") {
        Write-Host "##vso[task.logissue type=error]Solution creation failed: $errorMessage"
        if ($stackTrace) {
            Write-Host "##[debug]Stack trace: $stackTrace"
        }
    }
    elseif ($CiMode -eq "GitHub") {
        Write-Host "::error::Solution creation failed: $errorMessage"
        if ($stackTrace) {
            Write-Host "::debug::Stack trace: $stackTrace"
        }
    }
    else {
        Write-Host "Stack trace: $stackTrace" -ForegroundColor Red
    }
    
    return 1
}
finally {
    # Return to original location
    if ($originalLocation) {
        Set-Location $originalLocation
    }
}
