# Solution.xml Node Mapping Guide

This document explains how the new YAML configuration properties map to the XML nodes in Solution.xml, making it clearer to understand and maintain the build system.

## YAML to XML Mapping

### Solution Section
The `solution` section in YAML maps to the `<SolutionManifest>` section in Solution.xml:

| YAML Property | XML Node | Description |
|---------------|----------|-------------|
| `solution.uniqueName` | `<SolutionManifest><UniqueName>` | Unique identifier for the solution |
| `solution.localizedName` | `<SolutionManifest><LocalizedNames><LocalizedName description="">` | Display name shown in Power Platform |
| `solution.description` | `<SolutionManifest><Descriptions><Description description="">` | Solution description |
| `solution.version` | `<SolutionManifest><Version>` | Solution version number |
| `solution.projectGuid` | Project file `.csproj` | GUID for consistent solution identity |

### Publisher Section
The `publisher` section in YAML maps to the `<Publisher>` section in Solution.xml:

| YAML Property | XML Node | Description |
|---------------|----------|-------------|
| `publisher.uniqueName` | `<Publisher><UniqueName>` | Publisher's unique identifier |
| `publisher.localizedName` | `<Publisher><LocalizedNames><LocalizedName description="">` | Publisher display name |
| `publisher.description` | `<Publisher><Descriptions><Description description="">` | Publisher description |
| `publisher.customizationPrefix` | `<Publisher><CustomizationPrefix>` | Customization prefix for resources |

## Example Mapping

### YAML Configuration:
```yaml
solution:
  uniqueName: "PCFFluentUiAutoCompleteGooglePlaces"
  localizedName: "PCF FluentUI Google Address AutoComplete"
  description: "A Google Places autocomplete control"
  version: "2025.7.30.01"

publisher:
  uniqueName: "err403"
  localizedName: "err403.com (Gareth Cheyne)"
  description: "err403.com (Gareth Cheyne)"
  customizationPrefix: "err403"
```

### Resulting XML:
```xml
<SolutionManifest>
  <UniqueName>PCFFluentUiAutoCompleteGooglePlaces</UniqueName>
  <LocalizedNames>
    <LocalizedName description="PCF FluentUI Google Address AutoComplete" languagecode="1033" />
  </LocalizedNames>
  <Version>2025.7.30.01</Version>
  <Publisher>
    <UniqueName>err403</UniqueName>
    <LocalizedNames>
      <LocalizedName description="err403.com (Gareth Cheyne)" languagecode="1033" />
    </LocalizedNames>
    <Descriptions>
      <Description description="err403.com (Gareth Cheyne)" languagecode="1033" />
    </Descriptions>
    <CustomizationPrefix>err403</CustomizationPrefix>
  </Publisher>
</SolutionManifest>
```

## Benefits of This Approach

1. **Clarity**: YAML property names directly indicate which XML node they update
2. **Maintainability**: Easy to understand the relationship between configuration and XML
3. **Consistency**: Standardized naming convention across all PCF projects
4. **Documentation**: Self-documenting configuration structure

## Migration from Old Properties

If you have existing solution.yaml files with the old property names, here's the migration mapping:

| Old Property | New Property |
|-------------|-------------|
| `solution.name` | `solution.uniqueName` |
| `solution.displayName` | `solution.localizedName` |
| `publisher.name` | `publisher.uniqueName` |
| `publisher.displayName` | `publisher.localizedName` |
| `publisher.prefix` | `publisher.customizationPrefix` |

The build script supports both old and new property names for backward compatibility.
