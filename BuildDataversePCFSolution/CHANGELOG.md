# Changelog

All notable changes to the BuildDataversePCFSolution project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025.07.31.01] - 2025-07-31

### 🎯 Added - Bundle Size Optimization
- **Automatic production build mode selection** - Release builds now automatically use `--buildMode production`
- **Smart build command logic** - Automatically selects production/development builds based on configuration
- **Bundle size optimization documentation** - Comprehensive guide for reducing PCF bundle sizes
- **FluentUI import optimization support** - Built-in support for tree-shakeable imports

### 🚀 Performance Improvements
- **Up to 69% bundle size reduction** - Production builds create significantly smaller bundles
- **Faster Power Platform loading** - Optimized bundles improve runtime performance
- **Smaller solution packages** - Reduced package sizes from optimized builds

### 🔧 Build System Enhancements
- **Enhanced build command logic** in `build-solution.ps1`
  - Respects configuration file `pcfBuildCommand` setting
  - Automatically uses `build` (production) for Release configuration
  - Automatically uses `build:dev` (development) for Debug configuration
- **Standard PCF output directory support** - Better compatibility with default PCF project structure

### 📝 Documentation Updates
- **Bundle optimization best practices** added to README
- **FluentUI import patterns** with before/after examples
- **Performance benchmarks** with real-world size comparisons
- **Package.json optimization guide** for better build results

### 🔧 Technical Details
- **Production build detection** - Properly identifies and applies production optimizations
- **Dependency cleanup support** - Guidelines for removing unused dependencies
- **Tree shaking optimization** - Leverages webpack production mode for dead code elimination

## [2025.07.27.01] - 2025-07-27

### Added
- Initial release of BuildDataversePCFSolution
- GitHub Actions and Azure DevOps CI/CD support
- YAML-driven configuration system
- Automated solution packaging
- Interactive setup script
- Multi-platform installer (Windows/macOS/Linux)

### Features
- Complete PCF build automation
- Solution versioning from package.json
- Custom pre/post build scripts
- Environment detection and adaptation
- Built-in validation and error handling
