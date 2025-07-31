# PCF FluentUI AutoComplete - Google Places

A powerful PowerApps Component Framework (PCF) control that provides Google Places autocomplete functionality with React and FluentUI. This control integrates seamlessly with Dataverse and offers advanced features like hover cards with Google Maps integration, country restrictions, and comprehensive address parsing.

![PCF Control Preview](./screenshots/screenshot01.png)

## ✨ Features

### 🌍 Google Places Integration
- **Modern API Support**: Uses the latest Google Places JavaScript API with fallback to legacy API
- **Real-time Search**: Debounced search with configurable minimum character length
- **Country Restrictions**: Optional filtering by country codes (e.g., 'NZ,AU')
- **Toggle Control**: Users can enable/disable country restrictions on-the-fly

### 🗺️ Interactive Hover Cards
- **Google Maps Integration**: Shows location on interactive map with markers
- **Smart Positioning**: Coordinate-based arrow positioning that points accurately to hovered items
- **Smooth Transitions**: Invisible bridge area allows seamless mouse movement from dropdown to hover card
- **Rich Information**: Displays address components, coordinates, ratings, and external links

### 🎨 Modern UI/UX
- **FluentUI Components**: Consistent with Microsoft's design system
- **Responsive Design**: Adapts to different screen sizes and containers
- **Loading States**: Smooth loading indicators and error handling
- **Accessibility**: Keyboard navigation and screen reader support

### 📍 Comprehensive Address Parsing
- **Complete Address Components**: Street, suburb, city, state, country, postal code
- **Geographic Coordinates**: Latitude and longitude for mapping
- **Building Information**: Premise/building details when available
- **Flexible Formats**: Choose between full names or abbreviations for states/countries

## 🚀 Quick Start & Build System

This project uses the **BuildDataversePCFSolution** CI/CD system for automated building, packaging, and deployment.

### Prerequisites
- Power Platform CLI installed
- Node.js (version 18 or higher)
- Google Places API key with Places API enabled
- Power Platform environment with PCF controls enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/garethcheyne/PCF-FluentUi-AutoComplete-GooglePlaces.git
   cd PCF-FluentUi-AutoComplete-GooglePlaces
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build and package for Power Platform**
   ```bash
   # Quick release build (most common)
   npm run boom
   
   # Debug build for development
   npm run boom-debug
   
   # Build only managed solution
   npm run boom-managed
   
   # Build only unmanaged solution
   npm run boom-unmanaged
   ```

## 🔧 Build System (BuildDataversePCFSolution)

This project includes an advanced CI/CD system that automates PCF control building and packaging:

### Available Build Commands

| Command | Purpose | Output |
|---------|---------|---------|
| `npm run boom` | **Production build** (Release configuration, both packages) | `releases/PCFFluentUiAutoCompleteGooglePlaces_v{version}_managed.zip`<br>`releases/PCFFluentUiAutoCompleteGooglePlaces_v{version}_unmanaged.zip` |
| `npm run boom-debug` | Development build with debug symbols | Debug packages for testing |
| `npm run boom-managed` | Managed solution only (for production deployment) | Managed package only |
| `npm run boom-unmanaged` | Unmanaged solution only (for customization) | Unmanaged package only |
| `npm run boom-check` | Validate development environment | Environment check report |
| `npm run boom-upgrade` | Check for system updates | Update BuildDataversePCFSolution |

### Build Configuration

The build system is configured via `solution.yaml`:

```yaml
solution:
  name: "PCFFluentUiAutoCompleteGooglePlaces"
  displayName: "PCF FluentUI Google Address AutoComplete"
  version: "2025.7.30.01"
  projectGuid: "5e9de1b4-a755-483b-9a09-7aaf6e2836d1"

publisher:
  name: "err403"
  displayName: "err403.com (Gareth Cheyne)"
  prefix: "err403"

package:
  createManaged: true
  createUnmanaged: true
```

### 🔄 Automatic Version Management

The build system includes **intelligent auto-incrementing version control** that eliminates manual version updates:

#### **Version Format & Logic**
- **Format**: `major.minor.patch` (e.g., `1.0.2`, `0.1.15`, `2.3.47`)
- **Auto-Increment**: Each build automatically increments the patch version
- **Smart Rollover**: Handles version boundaries intelligently

#### **Version Increment Examples**

| Current Version | Next Build | Action Taken |
|----------------|------------|--------------|
| `1.0.2` | `1.0.3` | Normal patch increment |
| `0.0.98` | `0.0.99` | Normal patch increment |
| `0.0.99` | `0.1.0` | **Minor rollover** (patch resets to 0) |
| `0.1.99` | `0.2.0` | **Minor rollover** |
| `0.99.99` | `1.0.0` | **Major rollover** (minor resets to 0) |
| `1.0.0` | `1.0.1` | Normal patch increment |

#### **How It Works**
1. **Reads Current Version**: Parses version from `ControlManifest.Input.xml`
2. **Increments Intelligently**: Applies rollover logic at 99 boundaries
3. **Synchronizes Files**: Updates both `ControlManifest.Input.xml` and `package.json`
4. **PCF Compatible**: No leading zeros, follows semantic versioning

#### **Benefits**
- ✅ **No Manual Updates**: Version bumps automatically on each build
- ✅ **Consistent Versioning**: Both manifest and package stay synchronized  
- ✅ **PCF Compliant**: Meets all Power Platform version requirements
- ✅ **Scalable**: Handles thousands of builds (up to 99.99.99)
- ✅ **Error Recovery**: Falls back to 0.0.1 if version format is unrecognized

**Note**: The version in `solution.yaml` is no longer used for PCF files - the system now uses auto-incrementing versions starting from your current `ControlManifest.Input.xml` version.

4. **Test locally (optional)**
   ```bash
   npm start watch
   ```

## 📦 Deployment to Dataverse

### Option 1: Using Power Platform CLI

1. **Authenticate with your environment**
   ```bash
   pac auth create --url https://yourorg.crm.dynamics.com
   ```

2. **Create and deploy solution**
   ```bash
   pac solution init --publisher-name "YourPublisher" --publisher-prefix "prefix"
   pac solution add-reference --path ./
   pac solution pack --zipfile solution.zip
   pac solution import --path solution.zip
   ```

### Option 2: Manual Import

1. Navigate to the `out/controls` folder after building
2. Create a new solution in your Power Platform environment
3. Add the PCF control to your solution
4. Publish the solution

## 🚀 BuildDataversePCFSolution - Enhanced Build Commands

This project includes **BuildDataversePCFSolution**, a comprehensive build and deployment system that extends the standard PCF development experience with automated solution packaging, environment management, and CI/CD integration.

### 🛠️ Available Boom Commands

All BuildDataversePCFSolution commands are prefixed with `boom-` to distinguish them from standard PCF scripts:

#### **Environment Management**
```bash
# Check development environment and validate all required tools
npm run boom-check
```
Validates Node.js, .NET SDK, Power Platform CLI, and Git installations. Provides installation guidance for missing dependencies.

#### **Build Commands**
```bash
# Quick Release build (creates both managed and unmanaged solutions)
npm run boom

# Quick Debug build for development and testing
npm run boom-debug

# Build managed solution only (for production deployment)
npm run boom-managed

# Build unmanaged solution only (for development environments)
npm run boom-unmanaged
```

#### **Project Management**
```bash
# Create new PCF projects with BuildDataversePCFSolution integration
npm run boom-create
```
Interactive project creator with template selection and automatic BuildDataversePCFSolution setup.

### 📦 Automated Solution Packaging

All build commands automatically:
- ✅ Create versioned solution packages in the `releases/` directory
- ✅ Generate both managed and unmanaged solutions (unless specified otherwise)
- ✅ Include proper versioning based on `package.json`
- ✅ Validate project structure and dependencies
- ✅ Create deployment-ready ZIP files

### 📁 Output Structure
```
releases/
├── PCFFluentUiAutoCompleteGooglePlaces_v2025.7.27.01_managed.zip
└── PCFFluentUiAutoCompleteGooglePlaces_v2025.7.27.01_unmanaged.zip
```

### 🔄 CI/CD Integration

BuildDataversePCFSolution includes GitHub Actions workflows for:
- Automated builds on push/PR
- Release creation with solution packages
- Environment validation and testing
- Multi-environment deployment support

To set up CI/CD, commit your changes and push to GitHub:
```bash
git add .
git commit -m "Add BuildDataversePCFSolution"
git push origin main

# Create a release
git tag v1.0.0
git push origin v1.0.0
```

### 📋 Quick Reference

| Command | Purpose | Output Location |
|---------|---------|-----------------|
| `npm run boom-check` | Validate development environment | Console output |
| `npm run boom` | Release build (both managed & unmanaged) | `releases/` directory |
| `npm run boom-debug` | Debug build for development | `releases/` directory |
| `npm run boom-managed` | Managed solution only | `releases/` directory |
| `npm run boom-unmanaged` | Unmanaged solution only | `releases/` directory |
| `npm run boom-create` | Create new PCF project | Interactive wizard |

> 💡 **Tip**: Always run `npm run boom-check` first to ensure your development environment is properly configured before building solutions.

## ⚙️ Configuration

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| **apiToken** | String | Google Places API key (required) |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| **countryRestriction** | String | - | ISO 3166-1 alpha-2 country codes (e.g., 'NZ,AU') |
| **stateReturnShortName** | Boolean | false | Return state as abbreviation (e.g., 'CA' vs 'California') |
| **countryReturnShortName** | Boolean | false | Return country as code (e.g., 'US' vs 'United States') |

### Output Properties

The control populates the following fields automatically:

| Field | Description | Example |
|-------|-------------|---------|
| **street** | Street number and name | "123 Main Street" |
| **suburb** | Suburb/locality | "Downtown" |
| **city** | City name | "San Francisco" |
| **state** | State/region | "California" or "CA" |
| **country** | Country name | "United States" or "US" |
| **latitude** | Geographic latitude | "37.7749" |
| **longitude** | Geographic longitude | "-122.4194" |
| **building** | Building/premise | "Suite 100" |
| **postcode** | Postal/ZIP code | "94102" |

## 🎯 Usage Examples

### Basic Setup
1. Add the control to a form or canvas app
2. Set the **Google API Key** property
3. Bind output fields to your data source
4. Users can search and select addresses

### With Country Restrictions
1. Set **countryRestriction** to "US,CA" (for US and Canada only)
2. Users can toggle between restricted and worldwide search
3. The footer shows current restriction status

### Advanced Configuration
```javascript
// Example configuration for a US-focused application
{
  "apiToken": "your-google-api-key",
  "countryRestriction": "US",
  "stateReturnShortName": true,
  "countryReturnShortName": false
}
```

## 🔧 Development

### Project Structure
```
PCF-FluentUi-AutoComplete-GooglePlaces/
├── PCFFluentUiAutoComplete/
│   ├── tsx/
│   │   ├── AutoComplete.tsx       # Main component
│   │   ├── EntityHoverCard.tsx    # Hover card with maps
│   │   └── Queries.tsx           # Google Places API integration
│   ├── types/
│   │   └── EntityDetailTypes.ts  # TypeScript definitions
│   ├── ControlManifest.Input.xml # PCF manifest
│   └── index.ts                  # Entry point
├── package.json
└── tsconfig.json
```

### Key Components

#### AutoComplete.tsx
- Main search component with FluentUI SearchBox
- Handles user input, debouncing, and suggestion display
- Manages hover states and coordinate-based positioning
- Implements invisible bridge for smooth UX

#### EntityHoverCard.tsx
- Interactive hover card with Google Maps integration
- Shows place details, address components, and ratings
- Smart arrow positioning using DOM coordinates
- Handles loading states and error conditions

#### Queries.tsx
- Google Places API integration layer
- Supports both new Place API and legacy PlacesService
- Handles API key validation and error handling
- Implements country restriction filtering

### Building and Testing

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests (if available)
npm test

# Clean build artifacts
npm run clean
```

## 🌐 Google Places API Setup

### 1. Enable APIs
In the Google Cloud Console, enable:
- Places API (New)
- Places API  
- Maps JavaScript API

### 2. Create API Key
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create a new API key
3. Restrict the key to your domains for security

### 3. API Key Restrictions (Recommended)
```
Application restrictions:
- HTTP referrers
- Add your Power Platform domains

API restrictions:
- Places API (New)
- Places API
- Maps JavaScript API
```

## 🔒 Security Considerations

- **API Key Protection**: Restrict API keys to specific domains
- **Rate Limiting**: Google Places API has usage limits and billing
- **Data Privacy**: Review Google's data usage policies
- **Environment Variables**: Store API keys securely in your environment

## 🐛 Troubleshooting

### Common Issues

#### "API Key not provided" Error
- Ensure the `apiToken` property is set with a valid Google Places API key
- Check that the API key has Places API enabled

#### "No results found"
- Verify the search query is at least 3 characters long
- Check if country restrictions are too narrow
- Ensure the Google Places API is enabled for your key

#### Hover cards not showing
- Verify Google Maps JavaScript API is enabled
- Check browser console for JavaScript errors
- Ensure the API key has Maps JavaScript API permissions

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clean and rebuild
npm run clean
npm run build
```

## 📊 Performance Optimization

- **Debounced Search**: 500ms delay reduces API calls
- **Minimum Query Length**: 3 characters prevents excessive requests
- **Smart Caching**: Browser caches API responses
- **Lazy Loading**: Maps load only when needed
- **Efficient Rendering**: React optimizations for smooth UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use FluentUI components when possible
- Add comprehensive error handling
- Include JSDoc comments for public methods
- Test across different screen sizes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft FluentUI**: UI component library
- **Google Places API**: Location search and details
- **React**: Component framework
- **Power Platform**: PCF framework
- **Community**: Contributors and feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/garethcheyne/PCF-FluentUi-AutoComplete-GooglePlaces/issues)
- **Discussions**: [GitHub Discussions](https://github.com/garethcheyne/PCF-FluentUi-AutoComplete-GooglePlaces/discussions)
- **Documentation**: This README and inline code comments

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Custom styling options
- [ ] Offline mode support
- [ ] Additional map providers
- [ ] Enhanced accessibility features
- [ ] Performance analytics dashboard

---

**Made with ❤️ for the Power Platform community**

*If this control helps your project, please consider giving it a ⭐ on GitHub!*

The following screenshots demonstrate the key features and functionality of the PCF FluentUI Google Address AutoComplete component:

### Main Interface

![Google Address AutoComplete Component](./screenshots/screenshot01.png)

*The main autocomplete interface showing address search functionality, dropdown results with place details, and interactive hover cards displaying comprehensive address information including coordinates, place types, and direct links to Google Maps.*

---

## Features

### Core Address Functionality

- **Google Places Integration**: Real-time address search using Google Places Autocomplete API
- **Structured Address Display**: Shows main text (street/building) and secondary text (city, state, country)
- **Place Types**: Displays location types (establishment, point_of_interest, etc.)
- **Debounced Search**: 500ms delay to optimize API calls while typing
- **Loading States**: Visual feedback during API requests with spinners
- **Keyboard Navigation**: Full keyboard support with FluentUI FocusZone

### Enhanced User Experience

- **Hover Cards**: Detailed place information displayed on hover with 300ms delay
- **Address Components**: Breakdown of street, city, state, postal code, and country
- **Coordinates Display**: Latitude and longitude information
- **External Links**: Quick access to Google Maps and address search
- **Clear Function**: Easy search reset with proper state management
- **Error Handling**: Graceful handling of API failures with user feedback

### Technical Features

- **TypeScript Support**: Fully typed with proper interfaces and type safety
- **React Hooks**: Modern React patterns with useState, useRef, and useEffect
- **FluentUI Components**: Consistent Microsoft design system integration
- **Accessibility**: ARIA compliant with proper focus management and tooltips
- **Google Places API**: Direct integration with Google Places Autocomplete and Details APIs

---

## How to Obtain a Google Places API Key

You will need to obtain an API key from Google Cloud Platform:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Places API (New)
   - Maps JavaScript API
4. Go to "Credentials" and create an API key
5. Restrict the API key to the APIs you enabled
6. Optionally restrict by HTTP referrers for security

**Important**: Keep your API key secure and restrict its usage to prevent unauthorized access and unexpected charges.

---

## Project Structure

- **AutoComplete.tsx** - Main autocomplete component with Google Places search functionality
- **EntityHoverCard.tsx** - Hover card component for displaying detailed place information
- **EntityDetailTypes.ts** - TypeScript type definitions for Google Places API responses
- **Queries.tsx** - Additional query utilities (legacy, can be removed)

---

## API Integration

This control uses the following Google Places APIs:

### Autocomplete API
```
https://maps.googleapis.com/maps/api/place/autocomplete/json?input={query}&key={apiKey}&types=address
```

### Place Details API  
```
https://maps.googleapis.com/maps/api/place/details/json?place_id={placeId}&key={apiKey}&fields=formatted_address,geometry,name,rating,user_ratings_total,website,formatted_phone_number,opening_hours,photos,address_components,types,url
```

---

## Configuration Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `value` | SingleLine.Text | The selected address value (bound field) | Yes |
| `apiToken` | SingleLine.Text | Google Places API Key | Yes |

---

## Address Data Structure

The control provides structured address data through utility functions:

- **Street Number**: `GooglePlacesUtils.getStreetNumber(place)`
- **Street Name**: `GooglePlacesUtils.getStreetName(place)`
- **City**: `GooglePlacesUtils.getCity(place)`
- **State/Region**: `GooglePlacesUtils.getState(place)`
- **Postal Code**: `GooglePlacesUtils.getPostalCode(place)`
- **Country**: `GooglePlacesUtils.getCountry(place)`
- **Coordinates**: `GooglePlacesUtils.getLatitude(place)`, `GooglePlacesUtils.getLongitude(place)`

---

## Architecture

The component is designed with separation of concerns:

1. **Main Component (AutoComplete.tsx)**: Handles search logic, Google Places API calls, and user interactions
2. **Hover Card Component (EntityHoverCard.tsx)**: Dedicated component for displaying detailed place information
3. **Type Definitions (EntityDetailTypes.ts)**: Comprehensive TypeScript interfaces ensuring type safety with Google Places API
4. **Utility Classes**: Helper functions for extracting address components and formatting data

---

## Installation and Setup

1. Clone or download this repository
2. Obtain a Google Places API key (see instructions above)
3. Build the PCF control:
   ```bash
   npm install
   npm run build
   ```
4. Test the control:
   ```bash
   npm start
   ```
5. Package for deployment:
   ```bash
   pac pcf push --publisher-prefix dev
   ```

---

## Usage in Power Platform

1. Add the control to your canvas app or model-driven app form
2. Bind the `value` property to a text field in your data source
3. Set the `apiToken` property to your Google Places API key
4. Configure any additional styling or validation as needed

---

## Development Notes

This project evolved from the [PCF-FluentUi-AutoComplete-Boilerplate](https://github.com/garethcheyne/PCF-FluentUi-AutoComplete-Boilerplate) to provide specific Google Address functionality. Key improvements include:

- **Google Places Integration**: Replaced NZBN API with Google Places API
- **Address-Specific UI**: Optimized interface for address selection
- **Enhanced Hover Cards**: Rich place details with maps integration
- **Improved Type Safety**: Comprehensive TypeScript definitions for Google Places
- **Better Error Handling**: Robust API error management
- **Modern React Patterns**: Updated to latest React hooks and patterns

---

## Troubleshooting

### Common Issues

1. **API Key Issues**: 
   - Ensure the API key has Places API enabled
   - Check API key restrictions and referrer settings
   - Verify billing is enabled on your Google Cloud project

2. **No Results**: 
   - Check that the search query is at least 3 characters
   - Verify internet connectivity
   - Check browser console for API errors

3. **Slow Performance**: 
   - The control uses debouncing (500ms) to limit API calls
   - Consider implementing caching for frequently searched addresses

---

## License and Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Credits

Based on the original boilerplate: [PCF-FluentUi-AutoComplete-Boilerplate](https://github.com/garethcheyne/PCF-FluentUi-AutoComplete-Boilerplate)

Powered by Google Places API and Microsoft FluentUI.