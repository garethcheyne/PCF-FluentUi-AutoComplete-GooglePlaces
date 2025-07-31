# PCF Bundle Optimization Best Practices

This guide provides comprehensive strategies for reducing PCF bundle sizes and improving performance.

## 🎯 Quick Wins

### 1. Use Production Build Mode

**Always use production builds for deployment:**

```bash
# ✅ Production build (optimized)
npm run build -- --buildMode production

# ❌ Development build (large)
npm run build
```

**Bundle Size Impact:** Up to 69% reduction (5.4MB → 1.7MB)

### 2. Optimize FluentUI Imports

**❌ Don't import from root package:**
```typescript
import { ThemeProvider, SearchBox, Stack, Icon, FontWeights } from '@fluentui/react'
```

**✅ Use specific lib imports:**
```typescript
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import { Stack } from '@fluentui/react/lib/Stack'
import { Icon } from '@fluentui/react/lib/Icon'
import { FontWeights } from '@fluentui/react/lib/Styling'
```

**Why:** Root imports pull the entire FluentUI library into your bundle.

### 3. Remove Unused Dependencies

**Common culprits to remove if unused:**

```json
{
  "dependencies": {
    // ❌ Remove if not used
    "@fluentui/example-data": "^8.2.8",      // ~500KB+ of sample data
    "@pnp/spfx-controls-react": "^3.x.x",    // ~2MB+ SharePoint controls
    "moment": "^2.29.4",                     // ~500KB+ date library
    "react-moment": "^1.1.3",               // Moment wrapper
    "axios": "^0.24.0",                     // Use fetch instead
    "lodash": "^4.17.21"                    // Use native JS methods
  }
}
```

**Bundle Impact:** Each unused library removed can save 200KB - 2MB+

## 🚀 Advanced Optimization

### 4. Use Lightweight Alternatives

| Heavy Dependency | Lightweight Alternative | Size Savings |
|------------------|-------------------------|--------------|
| `moment` | Native `Date` or `date-fns` | ~500KB |
| `lodash` | Native ES6 methods | ~200-500KB |
| `axios` | Native `fetch` | ~100KB |
| Custom debounce | `usehooks-ts` debounce | ~50KB |

### 5. Dynamic Imports for Heavy Features

**Split large features into async chunks:**

```typescript
// ❌ Import heavy component directly
import { EntityHoverCard } from './EntityHoverCard'

// ✅ Use dynamic import
const EntityHoverCard = React.lazy(() => import('./EntityHoverCard'))

function MyComponent() {
  return (
    <React.Suspense fallback={<Spinner />}>
      {showHoverCard && <EntityHoverCard {...props} />}
    </React.Suspense>
  )
}
```

### 6. Optimize Package.json Scripts

**Configure your build scripts for maximum optimization:**

```json
{
  "scripts": {
    "build": "pcf-scripts build --buildMode production",
    "build:dev": "pcf-scripts build",
    "build:analyze": "pcf-scripts build --buildMode production --analyze"
  }
}
```

## 📊 Bundle Analysis

### Measuring Bundle Size

**Check your current bundle size:**

```bash
# Build and check size
npm run build
ls -lh out/controls/YourControl/bundle.js

# Windows
dir out\\controls\\YourControl\\bundle.js
```

### Target Bundle Sizes

| Control Complexity | Target Size | Status |
|-------------------|-------------|--------|
| Simple controls | < 500KB | 🟢 Excellent |
| Medium controls | 500KB - 1MB | 🟡 Good |
| Complex controls | 1MB - 2MB | 🟠 Acceptable |
| Very complex | > 2MB | 🔴 Needs optimization |

### Before/After Comparison

**Example optimization results:**

```
Before Optimization:
├── bundle.js: 5.4MB
├── Solution package: 951KB
└── Load time: ~3-5 seconds

After Optimization:
├── bundle.js: 1.7MB (69% smaller)
├── Solution package: 467KB (51% smaller)  
└── Load time: ~1-2 seconds
```

## 🔧 BuildDataversePCFSolution Integration

### Automatic Optimization

The BuildDataversePCFSolution system automatically:

- ✅ Uses production mode for Release builds
- ✅ Uses development mode for Debug builds  
- ✅ Applies webpack optimizations
- ✅ Enables tree shaking
- ✅ Minifies output

### Configuration

**In your package.json:**

```json
{
  "scripts": {
    "build": "pcf-scripts build --buildMode production",
    "build:dev": "pcf-scripts build"
  }
}
```

**Build commands:**

```bash
# Optimized release build
npm run boom

# Development build for debugging
npm run boom-debug
```

## 🚨 Common Pitfalls

### 1. Development Builds in Production

**Problem:** Using development React builds in production
**Solution:** Always use `--buildMode production`

### 2. Importing Entire Libraries

**Problem:** `import * as React from 'react'`
**Solution:** `import React from 'react'` (when possible)

### 3. Including Test/Dev Dependencies

**Problem:** Test utilities in production bundle
**Solution:** Keep them in `devDependencies`

### 4. Large Static Assets

**Problem:** Including large images/fonts in bundle
**Solution:** Use external CDN or Power Platform resources

## 📝 Checklist

Before deployment, verify:

- [ ] Production build mode enabled
- [ ] FluentUI imports use specific lib paths
- [ ] Unused dependencies removed
- [ ] Bundle size < 2MB (ideally < 1MB)
- [ ] No development-only code included
- [ ] External assets optimized

## 🔍 Troubleshooting

### Bundle Still Too Large?

1. **Analyze what's included:**
   ```bash
   npm run build -- --buildMode production --analyze
   ```

2. **Check for duplicate dependencies:**
   ```bash
   npm ls --depth=0
   ```

3. **Review import statements** - ensure using specific lib imports

4. **Consider code splitting** for complex features

### Build Errors?

- Ensure TypeScript types match import patterns
- Check that all imports resolve correctly
- Verify FluentUI version compatibility

## 📚 Further Reading

- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [FluentUI Tree Shaking Guide](https://github.com/microsoft/fluentui/wiki/Bundle-size-optimization)
- [React Production Build Guide](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)
