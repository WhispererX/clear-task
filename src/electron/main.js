process.on("uncaughtException", (err) => {
  require("fs").writeFileSync(
    "crash.log",
    err.stack || err.toString()
  );
});

const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

//#region Configuration
let settingsPath;
let currentWindow;
const MIN_WIDTH = 270;
const MIN_HEIGHT = 300;
//#endregion

//#region Window Management
function createWindow () {
  const win = new BrowserWindow({
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    resizable: true,
    fullscreenable: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  currentWindow = win;
  win.setResizable(true);
  win.loadFile(path.join(__dirname, '..', '..', 'index.html'));
  
  if (process.platform === 'win32') {
    win.once('ready-to-show', () => {
      win.setResizable(true);
    });
  }
}
//#endregion

//#region App Lifecycle
app.whenReady().then(() => {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
//#endregion

//#region IPC Handlers - File Operations
ipcMain.handle('save-file', async (event, content) => {
  const result = await dialog.showSaveDialog(currentWindow, {
    title: 'Save File',
    defaultPath: 'notes.json',
    filters: [
      { name: 'Clear Task Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
});

ipcMain.handle('open-file', async (event) => {
  const result = await dialog.showOpenDialog(currentWindow, {
    title: 'Open File',
    filters: [
      { name: 'Clear Task Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, content, filePath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
});
//#endregion

//#region IPC Handlers - Settings
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-settings', async (event) => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    return null;
  }
  return null;
});
//#endregion

//#region IPC Handlers - Custom Resize
let resizeState = null;

const stopResize = () => {
  if (resizeState && resizeState.interval) {
    clearInterval(resizeState.interval);
  }
  resizeState = null;
};

ipcMain.on('start-resize', (event, direction) => {
  if (!currentWindow) return;
  
  stopResize();
  
  const { screen } = require('electron');
  const startBounds = currentWindow.getBounds();
  const startPos = screen.getCursorScreenPoint();
  
  resizeState = {
    direction,
    startBounds,
    startPos,
    interval: null,
    active: true
  };
  
  resizeState.interval = setInterval(() => {
    if (!resizeState || !resizeState.active || !currentWindow) {
      stopResize();
      return;
    }
    
    try {
      const currentPos = screen.getCursorScreenPoint();
      const deltaX = currentPos.x - resizeState.startPos.x;
      const deltaY = currentPos.y - resizeState.startPos.y;
      
      const newBounds = { ...resizeState.startBounds };
      
      if (resizeState.direction === 'right' || resizeState.direction === 'bottom-right') {
        newBounds.width = Math.max(MIN_WIDTH, resizeState.startBounds.width + deltaX);
      }
      
      if (resizeState.direction === 'bottom' || resizeState.direction === 'bottom-right') {
        newBounds.height = Math.max(MIN_HEIGHT, resizeState.startBounds.height + deltaY);
      }
      
      currentWindow.setBounds(newBounds, false);
    } catch (e) {
      stopResize();
    }
  }, 16);
  
  setTimeout(() => {
    if (resizeState && resizeState.active) {
      stopResize();
    }
  }, 30000);
});

ipcMain.on('stop-resize', () => {
  if (resizeState) {
    resizeState.active = false;
  }
  stopResize();
});
//#endregion

//#region IPC Handlers - Pointer Events
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (!currentWindow) return;
  currentWindow.setIgnoreMouseEvents(!!ignore, { forward: true });
});
//#endregion