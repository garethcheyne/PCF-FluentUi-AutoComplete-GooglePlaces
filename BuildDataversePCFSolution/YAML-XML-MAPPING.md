# PCF Solution YAML Configuration Guide

## Overview
This guide explains the updated YAML configuration structure for PCF solutions and how it directly maps to the Solution.xml file structure. The new configuration uses explicit node names that clearly correspond to XML elements, making it easier to understand and maintain.

## YAML to XML Mapping

### Solution Section
The `solution` section in YAML maps to the `<SolutionManifest>` section in Solution.xml:

```yaml
solution:
  # Maps to <SolutionManifest><UniqueName>
  uniqueName: "PCFFluentUiAutoCompleteGooglePlaces"
  # Maps to <SolutionManifest><LocalizedNames><LocalizedName description="">
  localizedName: "PCF FluentUI Google Address AutoComplete"
  # Maps to <SolutionManifest><Descriptions><Description description="">
  description: "A Google Places autocomplete control using React and FluentUI."
  # Maps to <SolutionManifest><Version>
  version: "2025.7.30.01"
  # Project GUID - ensures consistent solution identity across rebuilds
  projectGuid: "5e9de1b4-a755-483b-9a09-7aaf6e2836d1"
```

**XML Output:**
```xml
<SolutionManifest>
  <UniqueName>PCFFluentUiAutoCompleteGooglePlaces</UniqueName>
  <LocalizedNames>
    <LocalizedName description="PCF FluentUI Google Address AutoComplete" languagecode="1033" />
  </LocalizedNames>
  <Descriptions>
    <Description description="A Google Places autocomplete control using React and FluentUI." languagecode="1033" />
  </Descriptions>
  <Version>2025.7.30.01</Version>
  ...
</SolutionManifest>
```

### Publisher Section
The `publisher` section in YAML maps to the `<Publisher>` section in Solution.xml:

```yaml
publisher:
  # Maps to <Publisher><UniqueName>
  uniqueName: "err403"
  # Maps to <Publisher><LocalizedNames><LocalizedName description="">
  localizedName: "err403.com (Gareth Cheyne)"
  # Maps to <Publisher><Descriptions><Description description="">  
  description: "err403.com (Gareth Cheyne)"
  # Maps to <Publisher><CustomizationPrefix>
  customizationPrefix: "err403"
```

**XML Output:**
```xml
<Publisher>
  <UniqueName>err403</UniqueName>
  <LocalizedNames>
    <LocalizedName description="err403.com (Gareth Cheyne)" languagecode="1033" />
  </LocalizedNames>
  <Descriptions>
    <Description description="err403.com (Gareth Cheyne)" languagecode="1033" />
  </Descriptions>
  <CustomizationPrefix>err403</CustomizationPrefix>
  ...
</Publisher>
```

## Changes from Previous Structure

### Old Structure (confusing)
```yaml
solution:
  name: "PCFFluentUiAutoCompleteGooglePlaces"          # Unclear what XML element this maps to
  displayName: "PCF FluentUI Google Address AutoComplete"  # Vague naming
  
publisher:
  name: "err403"                                       # Unclear what XML element this maps to
  displayName: "err403.com (Gareth Cheyne)"          # Vague naming
  prefix: "err403"                                    # Not clear this is CustomizationPrefix
```

### New Structure (clear XML mapping)
```yaml
solution:
  uniqueName: "PCFFluentUiAutoCompleteGooglePlaces"          # Clearly maps to <UniqueName>
  localizedName: "PCF FluentUI Google Address AutoComplete"  # Clearly maps to <LocalizedName>
  
publisher:
  uniqueName: "err403"                                       # Clearly maps to <UniqueName>
  localizedName: "err403.com (Gareth Cheyne)"              # Clearly maps to <LocalizedName>
  customizationPrefix: "err403"                            # Clearly maps to <CustomizationPrefix>
```

## Template Variables
The build script now supports both old and new template variable formats:

### Solution Variables
- `{solution.uniqueName}` or `{solution.name}` → Solution UniqueName
- `{solution.localizedName}` or `{solution.displayName}` → Solution LocalizedName
- `{solution.version}` → Solution Version

### Publisher Variables
- `{publisher.uniqueName}` or `{publisher.name}` → Publisher UniqueName
- `{publisher.localizedName}` or `{publisher.displayName}` → Publisher LocalizedName
- `{publisher.customizationPrefix}` or `{publisher.prefix}` → CustomizationPrefix

## Migration Guide

### Step 1: Update solution.yaml
Replace the old property names with the new XML-mapped names:

```yaml
# OLD FORMAT
solution:
  name: "YourSolutionName"
  displayName: "Your Display Name"
publisher:
  name: "yourprefix"
  displayName: "Your Company"
  prefix: "yourprefix"

# NEW FORMAT  
solution:
  uniqueName: "YourSolutionName"
  localizedName: "Your Display Name"
publisher:
  uniqueName: "yourprefix"
  localizedName: "Your Company"
  customizationPrefix: "yourprefix"
```

### Step 2: Update Build Scripts (if customized)
If you have custom build scripts, update property references:
- `$config.solution.name` → `$config.solution.uniqueName`
- `$config.solution.displayName` → `$config.solution.localizedName`
- `$config.publisher.name` → `$config.publisher.uniqueName`
- `$config.publisher.displayName` → `$config.publisher.localizedName`
- `$config.publisher.prefix` → `$config.publisher.customizationPrefix`

### Step 3: Test Build
Run the build script to ensure everything works correctly:

```powershell
.\BuildDataversePCFSolution\build-solution.ps1
```

## Benefits of New Structure

1. **Clear XML Mapping**: Each YAML property directly corresponds to an XML element
2. **Reduced Confusion**: No guessing about which XML element a property affects
3. **Better Documentation**: Self-documenting configuration with XML element names
4. **Easier Troubleshooting**: When issues occur, you know exactly which XML element to check
5. **Backward Compatibility**: Build script supports both old and new property names during transition

## Validation

After migration, verify the Solution.xml contains the correct values:

1. Check `<SolutionManifest><UniqueName>` matches `solution.uniqueName`
2. Check `<SolutionManifest><LocalizedNames><LocalizedName description="">` matches `solution.localizedName`
3. Check `<Publisher><UniqueName>` matches `publisher.uniqueName`
4. Check `<Publisher><LocalizedNames><LocalizedName description="">` matches `publisher.localizedName`
5. Check `<Publisher><CustomizationPrefix>` matches `publisher.customizationPrefix`

## Example Complete Configuration

```yaml
# Solution Information (maps to Solution.xml <SolutionManifest> section)
solution:
  uniqueName: "PCFFluentUiAutoCompleteGooglePlaces"
  localizedName: "PCF FluentUI Google Address AutoComplete"
  description: "A Google Places autocomplete control using React and FluentUI."
  version: "2025.7.30.01"
  projectGuid: "5e9de1b4-a755-483b-9a09-7aaf6e2836d1"

# Publisher Information (maps to Solution.xml <Publisher> section)
publisher:
  uniqueName: "err403"
  localizedName: "err403.com (Gareth Cheyne)"
  description: "err403.com (Gareth Cheyne)"
  customizationPrefix: "err403"
```
