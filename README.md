# Clear Task

A minimalist, transparent note-taking app that stays on top of all windows. Perfect for quick notes, reminders, and task tracking without cluttering your workspace.

## Features

### 🎨 Customizable Appearance
- **Transparent Background**: Adjustable opacity for seamless desktop integration
- **Custom Colors**: Choose your preferred text and background colors
- **Flexible Text Size**: Adjust font size from 10px to 30px
- **Theme Support**: Switch between Snow and Bubble editor themes

### ✍️ Rich Text Editing
- **Quill Editor**: Powerful rich text editing with formatting options
- **Markdown Shortcuts**:
  - `#` + space → Heading 1
  - `##` + space → Heading 2
  - (up to 6 levels)
  - ``` + backtick → Code block
  - `>` + space → Blockquote
- **Formatting Tools**: Bold, italic, code, lists (ordered, bullet, checkbox)
- **Read-Only Mode**: Toggle edit mode with the eye icon

### 💾 File Operations
- **Save/Load**: Preserve your notes with full formatting
- **Keyboard Shortcuts**:
  - `Ctrl+S` → Save file
  - `Ctrl+O` or `Ctrl+L` → Open file
- **Delta Format**: Uses Quill Delta JSON for accurate content preservation

### 🪟 Window Features
- **Always On Top**: Stays visible over all other windows
- **Frameless Design**: Clean, minimal interface
- **Custom Resize**: Drag edges and corners to resize
- **Draggable**: Move the window via the top bar

## Installation

### From Release
1. Download the latest `.exe` installer from the [Releases](https://github.com/WhispererX/clear-task/releases) page
2. Run the installer
3. Launch Clear Task

### From Source
```powershell
# Clone the repository
git clone https://github.com/WhispererX/clear-task.git
cd clear-task

# Install dependencies
npm install

# Run the app
npm start

# Build the installer
npm run build
```

## Usage

### Getting Started
1. Launch the app - it will appear as a transparent window on your desktop
2. Click anywhere in the editor area to start typing
3. Use the toolbar (visible on hover) for text formatting

### Settings
Click the gear icon (⚙️) to access settings:
- **File Operations**: Save or open note files
- **Appearance**:
  - Text Color
  - Background Color
  - Background Opacity (0-100%)
  - Text Size (10-30px)
  - Editor Theme (Snow/Bubble)

### Keyboard Shortcuts
- **Ctrl+S**: Save current note
- **Ctrl+O** or **Ctrl+L**: Open saved note

### Read-Only Mode
Click the eye icon to toggle between edit and read-only mode. Useful for preventing accidental edits while viewing your notes.

## Technical Details

### Built With
- **Electron** v39.2.6 - Desktop application framework
- **Quill** v2.0.3 - Rich text editor
- **electron-builder** - Application packaging

### File Format
Notes are saved as JSON files containing Quill Delta format, preserving all formatting, styles, and structure.

### System Requirements
- Windows 10 or later
- ~100MB disk space

## Development

### Project Structure
```
clear-task/
├── index.html          # Main HTML interface
├── src/
│   ├── electron/
│   │   ├── main.js     # Electron main process
│   │   └── preload.js  # Preload script (IPC bridge)
│   └── ui/
│       ├── app.js      # Application logic
│       └── index.css   # Styles
├── assets/
│   └── icon.png        # Application icon
└── package.json        # Project configuration
```

### Key Features Implementation
- **Transparency**: Uses Electron's `transparent: true` and `frame: false` options
- **Always On Top**: `alwaysOnTop: true` window property
- **Custom Resize**: Manual resize handles with IPC communication (native resize disabled for transparent windows)
- **Hover Detection**: Mouse position polling for topbar hover state
- **Settings Persistence**: Saved to `userData/settings.json`

## License

ISC License - See LICENSE file for details

## Author

**WhispererX**
- GitHub: [@WhispererX](https://github.com/WhispererX)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Quill](https://quilljs.com/) - Amazing rich text editor
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps with web technologies
