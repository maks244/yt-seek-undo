# YouTube Seek Undo

A browser extension for Chrome and Firefox that allows you to undo accidental seek bar clicks on YouTube videos.

## Features

- Automatically tracks your last 3 seek operations on YouTube
- Press Ctrl+Z (or Cmd+Z on Mac) to undo accidental seeks
- Customizable keyboard shortcut
- Works independently across multiple YouTube tabs
- Cross-browser compatible (Chrome 88+ and Firefox 78+)

## Installation

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the extension directory

### Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the extension directory

## Usage

1. Watch any YouTube video
2. If you accidentally click the seek bar, press Ctrl+Z (Cmd+Z on Mac) to return to your previous position
3. The extension tracks your last 3 seek operations per tab

## Customization

Click the extension options to customize the undo keyboard shortcut.

## Development

This extension uses the WebExtensions API for cross-browser compatibility.

### Project Structure

```
youtube-seek-undo/
├── manifest.json          # Extension manifest
├── content.js            # Content script for YouTube pages
├── background.js         # Background script for command handling
├── storage.js            # Storage manager module
├── options.html          # Options page UI
├── options.css           # Options page styles
├── options.js            # Options page functionality
└── icons/                # Extension icons
```

## Requirements

- Chrome 88+ or Firefox 78+
- Active internet connection to access YouTube

## License

MIT
