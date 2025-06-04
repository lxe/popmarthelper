# POP MART Helper

A powerful bookmarklet for tracking and analyzing POP MART sets with automated navigation and range analysis.

## ✨ Features

### 🎯 **Set Management**
- **Set Tracking**: Automatically discovers and tracks sets with box states
- **Clickable Sets**: Click any discovered set to open it in a new tab
- **Visual Highlighting**: Middle numbers highlighted in set IDs for easy identification
- **Local Storage**: Saves set records per product page for persistence

### 📊 **Advanced Analysis**
- **Range Analysis**: Automatically finds missing items in discovered ranges
- **Smart Pattern Recognition**: Extracts and analyzes 5-digit middle numbers from set IDs
- **Clickable Missing Links**: Direct links to all missing items in range
- **Real-time Updates**: Analysis updates as new sets are discovered

### 🤖 **Automation**
- **Smart Navigation**: Automated clicking and set progression
- **Stock Monitoring**: Wait for out-of-stock items to become available
- **Auto Box Selection**: Handles box image clicking and navigation
- **Delay Controls**: Configurable timing with jitter for human-like behavior

### 🛠️ **Developer Features**
- **Version Display**: Shows current version in UI title
- **Cache Busting**: Always loads latest version from CDN
- **JSON Inspection**: View raw API responses for debugging
- **Console Logging**: Detailed logging for troubleshooting

## 🚀 Quick Start

### Installation
1. Visit **[https://lxe.github.io/popmarthelper/](https://lxe.github.io/popmarthelper/)** for the online installer
2. Drag the **"POP MART Helper"** button to your bookmarks toolbar
3. Navigate to any POP MART product page (ending with `/pop-now/set/{id}`)
4. Click the bookmarklet to activate

### Usage
1. **Start Automation**: Click "Start" on a product page to begin set discovery
2. **Stock Waiting**: Use "Wait Until In Stock" for out-of-stock items
3. **View Analysis**: Check the blue-bordered range analysis above sets
4. **Click Sets**: Click any discovered set to open it in a new tab
5. **Missing Items**: Click links in range analysis to jump to missing sets

## 🎮 Interface

### Control Panel
All buttons are conveniently inline:
- **Start/Stop**: Begin or halt automation
- **Reset**: Clear all discovered sets
- **Wait Until In Stock**: Monitor for stock availability  
- **Hide/Show Sets**: Toggle set visualizer visibility
- **Toggle JSON**: View raw API responses

### Set Display
- **Yellow Highlighting**: Middle numbers highlighted in set IDs
- **Color Coding**: Recent discoveries highlighted in yellow
- **Box States**: Visual representation of each box state
- **Click to Open**: Click any set to open in new tab
- **Hover Effects**: Sets scale and show shadow on hover

### Range Analysis
- **Blue Border**: Always visible above sets
- **Missing Count**: Shows discovered vs missing items
- **Direct Links**: Click middle numbers to open missing sets
- **Real-time**: Updates automatically as sets are found

## 🛠️ Development

### Architecture
- **CDN Distribution**: Published to npm, served via jsDelivr
- **Cache Busting**: Unique URLs prevent caching issues
- **Version Injection**: Automatic version headers in published scripts
- **No Build Complexity**: Simple copy and publish workflow

### Publishing New Versions
```bash
# Increment version and publish to npm
npm run deploy

# CDN automatically updates at:
# https://cdn.jsdelivr.net/npm/popmarthelper@latest/dist/script.js
```

### Local Development
1. Edit `script.js` directly
2. Test by loading local file or via bookmarklet
3. Run `npm run deploy` when ready to publish
4. Users automatically get updates via CDN

### File Structure
```
├── script.js           # Main script (source)
├── publish.js          # Version increment and npm publish
├── bookmarklet.html    # Static installation page
├── package.json        # npm package configuration
└── dist/
    └── script.js       # Published version with headers
```

## 📋 Technical Details

### Pattern Recognition
- Extracts 5-digit middle numbers from set IDs
- Pattern: `1000[XXXXX]...` (positions 4-8)
- Example: `10008782500350` → `87825`

### Range Analysis
- Finds lowest and highest discovered middle numbers
- Generates all possible IDs in range
- Identifies missing items with direct links
- Handles URL postfix removal for clean navigation

### Stock Monitoring
- Clicks header logo to navigate away
- Uses browser back button to return
- Polls for visible next arrow (indicates stock)
- Seamlessly transitions to automation when available

### Version Management
- `window.POP_MART_HELPER_VERSION` set in published versions
- Displays in UI title: "POP MART Helper v1.0.8 - Set Tracker"
- Timestamp and CDN URL in script headers
- Cache busting via query parameters

## ⚠️ Important Notes

- **Page Requirement**: Only works on POP MART product pages
- **Responsible Use**: Follow POP MART's terms of service
- **Browser Compatibility**: Modern browsers with ES6+ support
- **Local Storage**: Data saved per product page URL
- **CDN Delays**: New versions available within minutes of publishing

## 🔧 Advanced Configuration

### Timing Controls
- **Base Delay**: Minimum time between actions (default: 500ms)
- **Jitter**: Random variation to seem more human (default: 100ms)
- **Combined**: Actual delay = base ± random(jitter)

### Storage Management
- **Reset Button**: Clears all stored set data
- **URL-Specific**: Each product page has independent storage
- **Persistent**: Data survives browser restarts

### Debug Features
- **JSON Toggle**: View raw API responses
- **Console Logging**: Detailed operation logs
- **Version Display**: Always visible in UI
- **Error Handling**: Graceful fallbacks and retries

## 📈 Recent Updates

- ✅ Clickable sets opening in new tabs
- ✅ Inline button layout with flex-wrap
- ✅ Highlighted middle numbers (no more parentheses)
- ✅ CDN-based distribution with cache busting
- ✅ Automatic version injection and display
- ✅ Simplified publish workflow
- ✅ Enhanced range analysis with direct links
- ✅ Improved hover effects and visual feedback

---

**Built for POP MART collectors by automation enthusiasts** 🎁 