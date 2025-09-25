# Google AutoComplete JS

A vanilla JavaScript Google Places Autocomplete component that can be easily included via CDN. This component provides the same functionality as the Vue.js InputGoogleAutoComplete component but in pure JavaScript.

## Features

- 🌍 Google Places API integration
- 📡 Remote service support (new!)
- 📱 Responsive design
- 🎨 Customizable styling
- 🔧 Programmatic control
- 🌏 Region restriction support
- 📦 CDN ready
- 🎯 Event callbacks
- 🔄 Session token management
- 📍 Full address components or simple formatted address

## Installation

### Via CDN

```html
<!-- Include the component (Google Maps API Loader is included) -->
<script src="https://your-cdn.com/google-autocomplete.min.js"></script>
```

### Via NPM

```bash
npm install google-autocomplete-js
```

## Quick Start

### HTML

```html
<div id="my-autocomplete"></div>
```

### JavaScript

```javascript
// Initialize the component
const autocomplete = googleAutoComplete(document.getElementById('my-autocomplete'), {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
    placeholder: 'Enter your address...',
    onSelect: function(result, place) {
        console.log('Selected:', result);
    }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | Required | Your Google Maps API key |
| `placeholder` | string | "please enter a address" | Input placeholder text |
| `iso2` | string | "" | ISO 2-letter country code to restrict results |
| `language` | string | "en" | Language for results |
| `isDisabled` | boolean | false | Whether the input is disabled |
| `remote` | boolean | false | Whether to use remote service instead of Google Maps API |
| `remoteUrl` | string | "http://localhost:3000/places/" | Base URL for remote service |
| `fields` | array | ['displayName', 'formattedAddress', 'location', 'addressComponents'] | Fields to fetch from Google Places API |
| `onSelect` | function | () => {} | Callback when a place is selected (receives full place object) |
| `onInput` | function | () => {} | Callback when input value changes |
| `onChange` | function | () => {} | Callback when input changes |
| `onFocus` | function | () => {} | Callback when input receives focus |
| `onBlur` | function | () => {} | Callback when input loses focus |
| `inputClass` | string | "cuteid-input-auto-complete" | Custom CSS class for input element |
| `inputStyle` | object | {} | Custom inline styles for input element |
| `resultsClass` | string | "cuteid-results-container" | Custom CSS class for results container |
| `resultsStyle` | object | {} | Custom inline styles for results container |
| `wrapperClass` | string | "cuteid-auto-complete-wrapper" | Custom CSS class for wrapper element |

## Examples

### Basic Usage

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    placeholder: 'Search locations...',
    onSelect: function(place) {
        console.log('Selected place:', place);
        console.log('Address:', place.formattedAddress);
        console.log('Name:', place.displayName);
    }
});
```

### Region Restriction

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    iso2: 'US', // Restrict to United States
    placeholder: 'Search US locations...'
});
```

### Custom Fields

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    fields: ['displayName', 'formattedAddress', 'location'], // Only fetch specific fields
    onSelect: function(place) {
        console.log('Place with custom fields:', place);
        // Only the specified fields will be available
    }
});
```

### Full Place Data

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    fields: [
        'displayName', 
        'formattedAddress', 
        'location', 
        'addressComponents',
        'types',
        'placeId',
        'rating',
        'website',
        'phoneNumber'
    ],
    onSelect: function(place) {
        // Handle the complete place object yourself
        console.log('Complete place data:', place);
        
        // Example: Extract specific data
        const locationData = {
            name: place.displayName,
            address: place.formattedAddress,
            coordinates: place.location ? {
                lat: place.location.lat,
                lng: place.location.lng
            } : null,
            placeId: place.placeId,
            types: place.types
        };
        
        console.log('Processed data:', locationData);
    }
});
```

### Remote Service Usage

```javascript
// Use your own remote service instead of Google Maps API
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY', // Still required but only used in non-remote mode
    placeholder: 'Search locations...',
    remote: true, // Enable remote service
    remoteUrl: 'http://localhost:3000/places/', // Your service URL
    onSelect: function(place) {
        console.log('Selected from remote service:', place);
        // place object contains:
        // - formattedAddress: formatted address
        // - displayName: display name
        // - location: coordinates
        // - placeId: place ID
    }
});
```

### Remote Service with Custom URL

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    remote: true,
    remoteUrl: 'https://your-api.com/places/', // Custom service URL
    language: 'zh-CN',
    iso2: 'CN',
    onSelect: function(place) {
        console.log('Remote service result:', place);
    }
});
```

### Event Handling

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    onSelect: function(place) {
        console.log('Place selected:', place);
    },
    onInput: function(value) {
        console.log('User typing:', value);
    },
    onFocus: function(event) {
        console.log('Input focused');
    },
    onBlur: function(event) {
        console.log('Input blurred');
    }
});
```

### Custom Styling

```javascript
const autocomplete = googleAutoComplete(document.getElementById('autocomplete'), {
    apiKey: 'YOUR_API_KEY',
    placeholder: 'Search for a location...',
    
    // 自定义样式配置
    inputClass: 'custom-input',
    inputStyle: {
        'font-family': 'Arial, sans-serif',
        'font-size': '16px'
    },
    
    resultsClass: 'custom-results',
    resultsStyle: {
        'z-index': '1000',
        'max-height': '400px'
    },
    
    wrapperClass: 'custom-wrapper',
    
    onSelect: function(place) {
        console.log('Selected:', place.formattedAddress);
    }
});
```

对应的 CSS：

```css
.custom-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
}

.custom-results {
    background: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-wrapper {
    position: relative;
    width: 100%;
    max-width: 500px;
}
```

## Public Methods

### setValue(value)
Set the input value programmatically.

```javascript
autocomplete.setValue('New York, NY');
```

### getValue()
Get the current input value.

```javascript
const currentValue = autocomplete.getValue();
```

### setPlaceholder(placeholder)
Change the placeholder text.

```javascript
autocomplete.setPlaceholder('Enter new address...');
```

### setDisabled(disabled)
Enable or disable the input.

```javascript
autocomplete.setDisabled(true); // Disable
autocomplete.setDisabled(false); // Enable
```

### updateInputStyle(style)
Update input element inline styles.

```javascript
autocomplete.updateInputStyle({
    'border-color': '#28a745',
    'background-color': '#f8fff9'
});
```

### updateResultsStyle(style)
Update results container inline styles.

```javascript
autocomplete.updateResultsStyle({
    'border-color': '#28a745',
    'box-shadow': '0 4px 12px rgba(40, 167, 69, 0.15)'
});
```

### updateInputClass(className)
Update input element CSS class.

```javascript
autocomplete.updateInputClass('custom-input custom-input-success');
```

### updateResultsClass(className)
Update results container CSS class.

```javascript
autocomplete.updateResultsClass('custom-results custom-results-success');
```

### updateRegion(iso2)
Update the region restriction.

```javascript
autocomplete.updateRegion('CA'); // Restrict to Canada
```

### destroy()
Clean up and remove the component.

```javascript
autocomplete.destroy();
```

## Styling

The component comes with built-in styles that match the original Vue component. You can customize the appearance by overriding CSS classes:

```css
/* Main wrapper */
.autoCompleteWrapper {
    /* Your custom styles */
}

/* Input field */
.autoCompleteWrapper .inputAutoComplete {
    /* Your custom styles */
}

/* Results dropdown */
.autoCompleteWrapper .results-container {
    /* Your custom styles */
}

/* Suggestion items */
.suggestion-item {
    /* Your custom styles */
}

/* Main text in suggestions */
.suggestion-main-text {
    /* Your custom styles */
}

/* Secondary text in suggestions */
.suggestion-secondary-text {
    /* Your custom styles */
}
```

## Google Maps API Setup

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Places API for your project
3. Add your API key to the component configuration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm run dev

# Run demo
npm run demo
```

### File Structure

```
google-autocomplete-js/
├── src/
│   ├── google-autocomplete.js    # Main component
│   └── google-autocomplete.css   # Styles
├── demo/
│   └── index.html                # Demo page
├── dist/
│   └── google-autocomplete.min.js # Built component
├── webpack.config.js
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on the Vue.js InputGoogleAutoComplete component
- Uses Google Maps Places API
- Built with Webpack for CDN distribution

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-repo/google-autocomplete-js/issues) on GitHub. 