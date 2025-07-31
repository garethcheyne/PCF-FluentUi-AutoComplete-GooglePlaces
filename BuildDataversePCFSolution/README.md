# Build Dataverse PCF Solution - PCF CI/CD System

**A complete, reusable CI/CD system for PowerApps Component Framework (PCF) controls.**

## 🚀 Quick Installation

### Option 1: One-Line Install (Recommended)

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.ps1 | iex
```

**macOS/Linux (Bash):**

```bash
curl -fsSL https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.sh | bash
```

**With options:**

```powershell
# Force reinstall (if already installed)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.ps1" -OutFile "install-temp.ps1"; & ".\install-temp.ps1" -Force; Remove-Item "install-temp.ps1"

# Skip interactive setup
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.ps1" -OutFile "install-temp.ps1"; & ".\install-temp.ps1" -SkipSetup; Remove-Item "install-temp.ps1"
```

### Option 2: Manual Installation

1. **Download the installer:**

   ```powershell
   # Windows
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.ps1" -OutFile "install.ps1"
   .\install.ps1
   ```

   ```bash
   # macOS/Linux
   curl -O https://raw.githubusercontent.com/garethcheyne/BuildDataversePCFSolution/main/install.sh
   chmod +x install.sh
   ./install.sh
   ```

2. **Clone the repository:**

   ```bash
   git clone https://github.com/garethcheyne/BuildDataversePCFSolution.git
   cd YourPCFProject
   cp -r ../BuildDataversePCFSolution/BuildDataversePCFSolution .
   .\BuildDataversePCFSolution\setup-project.ps1
   ```

## 🎯 What Happens During Install

The installer will:

1. ✅ **Validate** your PCF project structure
2. ✅ **Download** the latest BuildDataversePCFSolution files
3. ✅ **Check for updates** if already installed
4. ✅ **Run interactive setup** to configure your project
5. ✅ **Add npm boom scripts** to your package.json for quick building

### 📦 NPM Scripts Added After Setup

The setup process automatically adds these convenient npm scripts to your `package.json`:

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run boom` | Release build + package | **Most common** - Production ready solution |
| `npm run boom-debug` | Debug build + package | Development/testing with debug symbols |
| `npm run boom-managed` | Managed solution only | Creates managed solution package |
| `npm run boom-unmanaged` | Unmanaged solution only | Creates unmanaged solution package |  
| `npm run boom-check` | Environment validation | Checks if your dev environment is ready |
| `npm run boom-create` | PCF project creator | Creates new PCF project structure |
| `npm run boom-upgrade` | Update tool | Checks for and installs latest version |

## 📚 Documentation

- **[BUNDLE-OPTIMIZATION.md](./BUNDLE-OPTIMIZATION.md)** - Comprehensive guide to reducing PCF bundle sizes by up to 69%
- **[CHANGELOG.md](./CHANGELOG.md)** - Recent updates and version history
- **[GETTING-STARTED.md](./GETTING-STARTED.md)** - Step-by-step setup guide
- **[YAML-XML-MAPPING.md](./YAML-XML-MAPPING.md)** - Configuration reference

## ⚡ Quick Start After Installation

Once installed, you have access to several convenient npm scripts:

### 🚀 NPM Boom Commands (Available after setup)

```bash
# Quick release build and package (most common)
npm run boom

# Debug build for testing
npm run boom-debug

# Build managed solution only
npm run boom-managed

# Build unmanaged solution only  
npm run boom-unmanaged

# Check development environment
npm run boom-check

# Create new PCF project structure
npm run boom-create

# Update to latest version
npm run boom-upgrade
```

### 🔧 Manual PowerShell Commands

If you prefer direct PowerShell execution:

```powershell
# Manual build
.\BuildDataversePCFSolution\build-solution.ps1

# Reconfigure your project
.\BuildDataversePCFSolution\setup-project.ps1

# Environment check
.\BuildDataversePCFSolution\environment-check.ps1

# Check for updates
.\BuildDataversePCFSolution\upgrade-builddataverse.ps1
```

## 📋 What You Get

### Core Features
- 🔄 **GitHub Actions** and **Azure DevOps** support (independent of each other)
- 📝 **YAML-driven configuration** - one file controls everything
- 🎯 **Bundle Size Optimization** - automatic production builds reduce bundle size by up to 69%
- ⚡ **Smart Build Mode Selection** - automatically uses production builds for Release, development for Debug
- 🔧 **FluentUI Import Optimization** - supports optimized import patterns for smaller bundles
- 🔧 **Custom build scripts** - add your own pre/post build logic
- 🎯 **Environment detection** - automatically adapts to CI/CD platform
- 📦 **Automated packaging** - creates Power Platform solution packages
- 🔍 **Built-in validation** - ensures build quality and consistency

### Directory Structure After Setup
```
YourPCFProject/
├── solution.yaml              # Your project configuration (auto-generated)
├── BuildDataversePCFSolution/    # The build system (copy this directory)
│   ├── README.md             # This file
│   ├── setup-project.ps1     # Automated setup script
│   ├── build-solution.ps1    # Main build script
│   ├── create-github-release.ps1  # GitHub release automation
│   ├── templates/            # CI/CD templates
│   │   ├── github/           # GitHub Actions templates
│   │   └── devops/           # Azure DevOps templates
│   └── examples/             # Configuration examples
├── .github/workflows/        # GitHub Actions (if chosen)
│   └── build-and-release.yml
└── azure-pipelines.yml      # Azure DevOps (if chosen)
```

## 🎯 Platform Choice Guide

**Choose GitHub Actions if:**
- ✅ You're using GitHub for source control
- ✅ You want automatic releases when you tag versions
- ✅ You prefer GitHub's integrated security scanning
- ✅ You want public visibility of your builds

**Choose Azure DevOps if:**
- ✅ You're using Azure DevOps for source control
- ✅ You're working in a corporate environment
- ✅ You need advanced build agent customization
- ✅ You prefer Azure's ecosystem integration

**Both platforms are completely independent** - you can switch between them or use both simultaneously without any conflicts.

## 📝 Configuration File (solution.yaml)

The `solution.yaml` file controls everything about your build:

```yaml
solution:
  name: "MyPCFControl"                    # No spaces, alphanumeric
  displayName: "My PCF Control"           # Human-readable name
  version: "1.0.0.0"                      # Version number

publisher:
  name: "YourName"                        # Your name/company
  prefix: "xyz"                           # 2-8 character prefix

# GitHub configuration (only if using GitHub Actions)
github:
  repository:
    owner: "your-username"
    name: "your-repo-name"

### 📋 Version Management

**Version Source Priority:**
1. **Primary**: `package.json` version field (recommended)
2. **Fallback**: `solution.yaml` version field 

The build system automatically extracts the version from your PCF control's `package.json` file for consistency. This ensures your GitHub releases, solution packages, and NPM package all use the same version number.

To update your control version:
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0  
npm version major  # 1.1.0 → 2.0.0
```

**Release Tags:** Use the format `v{version}` (e.g., `v1.2.3`) for official releases.

## 🎯 Bundle Size Optimization

The build system automatically optimizes your PCF bundle size for production builds, often reducing bundle size by **up to 69%**. Here's how it works:

### Automatic Build Mode Selection

| Configuration | Bundle Mode | Bundle Size | Use Case |
|---------------|-------------|-------------|----------|
| **Release** (`npm run boom`) | Production | ~1.7MB | Deployment to Power Platform |
| **Debug** (`npm run boom-debug`) | Development | ~5.4MB | Local testing and debugging |

### FluentUI Import Optimization

**❌ Don't do this (pulls entire library):**
```typescript
import { ThemeProvider, SearchBox, Stack } from '@fluentui/react'
```

**✅ Do this instead (tree-shakeable imports):**
```typescript
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import { Stack } from '@fluentui/react/lib/Stack'
```

### Package.json Optimization

The build system works best when your `package.json` includes these optimized scripts:

```json
{
  "scripts": {
    "build": "pcf-scripts build --buildMode production",
    "build:dev": "pcf-scripts build"
  },
  "dependencies": {
    "@fluentui/react": "^8.123.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2"
  }
}
```

### Bundle Size Results

**Before optimization:**
- Bundle: 5.4MB
- Solution package: 951KB

**After optimization:**
- Bundle: 1.7MB (**69% smaller**)
- Solution package: 467KB (**51% smaller**)

### Performance Benefits

- ⚡ **Faster loading** in Power Platform environments
- 📱 **Better mobile performance** 
- 💾 **Reduced solution package size**
- 🚀 **Improved user experience**

# Custom scripts (optional)
scripts:
  preBuild: |
    Write-Host "Custom pre-build logic here"
  postBuild: |
    Write-Host "Custom post-build logic here"
```

## 🔧 Local Testing

Always test locally before pushing to CI/CD:

```powershell
# Test your build locally
.\BuildDataversePCFSolution\build-solution.ps1 -BuildConfiguration "Debug"

# Test with custom solution name
.\BuildDataversePCFSolution\build-solution.ps1 -SolutionName "TestSolution"

# Verbose output for debugging
.\BuildDataversePCFSolution\build-solution.ps1 -Verbose
```

## 🚦 Step-by-Step Deployment Guide

### For GitHub Actions:
1. **Run setup script** → creates `.github/workflows/build-and-release.yml`
2. **Git add/commit/push** → triggers first build automatically
3. **Create version tag** (`git tag v1.0.0 && git push origin v1.0.0`) → triggers release
4. **Check GitHub Actions tab** → monitor your builds

### For Azure DevOps:
1. **Run setup script** → creates `azure-pipelines.yml`
2. **Create new pipeline** in Azure DevOps → point to `azure-pipelines.yml`
3. **Queue build** → first build runs
4. **For GitHub releases** → add `GITHUB_TOKEN` variable to pipeline

## 📁 Directory Contents

### Core Files
- **`setup-project.ps1`** - Interactive setup script (run this first!)
- **`build-solution.ps1`** - Main build engine
- **`solution-template.yaml`** - Configuration template
- **`create-github-release.ps1`** - GitHub release automation

### Templates Directory
- **`templates/github/`** - GitHub Actions workflow files
- **`templates/devops/`** - Azure DevOps pipeline files

### Examples Directory
- **`examples/basic-pcf.yaml`** - Minimal configuration example
- **`examples/advanced-pcf.yaml`** - Full-featured configuration example

### Documentation
- **`CI-CD-SETUP.md`** - Detailed setup instructions and troubleshooting
- **`README.md`** - This file

## ⚡ Quick Commands Reference

### NPM Boom Scripts (Recommended)
```bash
# Release build and package (most common use)
npm run boom

# Debug build for development
npm run boom-debug

# Build managed solution package
npm run boom-managed

# Build unmanaged solution package
npm run boom-unmanaged

# Check your development environment
npm run boom-check

# Create new PCF project structure
npm run boom-create

# Update to latest version
npm run boom-upgrade
```

### PowerShell Direct Commands
```powershell
# Setup new project
.\BuildDataversePCFSolution\setup-project.ps1

# Local debug build
.\BuildDataversePCFSolution\build-solution.ps1 -BuildConfiguration "Debug"

# Local release build
.\BuildDataversePCFSolution\build-solution.ps1 -BuildConfiguration "Release"

# Test configuration only
.\BuildDataversePCFSolution\build-solution.ps1 -WhatIf

# Create GitHub release (manual)
.\BuildDataversePCFSolution\create-github-release.ps1 -TagName "v1.0.0" -ArtifactPath "MySolution.zip"
```

## 🆘 Troubleshooting

### Common Issues:
1. **"No .pcfproj file found"** → Run from your PCF project root directory
2. **"Power Platform CLI not found"** → Script will auto-install it
3. **"Build failed"** → Check Node.js version (needs 18+) and .NET SDK (needs 6.0+)
4. **"YAML parse error"** → Check indentation in your `solution.yaml` file

### Get Help:
- Review `examples/` directory for configuration samples
- Check `CI-CD-SETUP.md` for detailed platform-specific instructions
- Validate your setup by testing locally first

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Local build completes without errors
- ✅ Solution.zip file is created in your project root
- ✅ CI/CD pipeline shows green/successful status
- ✅ (GitHub) Release is automatically created when you tag a version
- ✅ (Azure DevOps) Build artifacts are published and available

---

**Ready to get started?** Run `.\BuildDataversePCFSolution\setup-project.ps1` and follow the prompts!
