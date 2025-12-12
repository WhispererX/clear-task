const { app, BrowserWindow, ipcMain, dialog } = require('electron/main');
const path = require('node:path');
const fs = require('fs');

//#region Configuration
let settingsPath;
let currentWindow;
const MIN_WIDTH = 270;
const MIN_HEIGHT = 300;
const crashLogPath = path.join(app.getPath('userData'), 'crash.log');
//#endregion

//#region Helpers
const writeCrashLog = (message) => {
  try {
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(crashLogPath, entry, 'utf-8');
  } catch (err) {
  }
};

writeCrashLog(`app start | packaged=${app.isPackaged} | appPath=${app.getAppPath()} | exe=${process.execPath} | resources=${process.resourcesPath} | userData=${app.getPath('userData')}`);

process.on("uncaughtException", (err) => {
  writeCrashLog(err && err.stack ? err.stack : String(err));
});

process.on('unhandledRejection', (reason) => {
  writeCrashLog(`UnhandledRejection: ${reason && reason.stack ? reason.stack : String(reason)}`);
});
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
    backgroundColor: '#00000000',
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

  win.webContents.on('render-process-gone', (_event, details) => {
    writeCrashLog(`Renderer gone: reason=${details.reason}, exitCode=${details.exitCode}`);
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    writeCrashLog(`did-fail-load code=${errorCode} description=${errorDescription} url=${validatedURL}`);
  });

  app.on('gpu-process-crashed', (_event, killed) => {
    writeCrashLog(`GPU process crashed. killed=${killed}`);
  });

  win.webContents.on('context-lost', () => {
    writeCrashLog('WebGL context lost');
  });
  
  if (process.platform === 'win32') {
    win.once('ready-to-show', () => {
      win.setResizable(true);
    });
  }
}
//#endregion

//#region App Lifecycle
app.whenReady().then(() => {
  if (process.platform === 'win32' && process.env.CLEAR_TASK_DISABLE_GPU === '1') {
    app.commandLine.appendSwitch('disable-gpu');
    writeCrashLog('disable-gpu enabled via CLEAR_TASK_DISABLE_GPU=1');
  }
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    createWindow()
  } catch (e) {
    writeCrashLog(`createWindow error: ${e && e.stack ? e.stack : String(e)}`);
    throw e;
  }

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
  try {
    currentWindow.setIgnoreMouseEvents(!!ignore, { forward: true });
  } catch (e) {
    writeCrashLog(`setIgnoreMouseEvents error: ${e && e.stack ? e.stack : String(e)}`);
  }
});
//#endregion