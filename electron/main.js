const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { start: startUI } = require('../src/ui/server');
const { Gateway } = require('../src/gateway');
const { Swarm } = require('../src/agents/swarm');
const { searchMemory, getRecentDebates, saveToMemory } = require('../src/memory');

const APP_NAME = 'AskElira';
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const UI_PORT = process.env.UI_PORT || 3000;
const SETTINGS_PATH = path.join(app.getPath('userData'), 'window-state.json');

let mainWindow = null;
let tray = null;
let gateway = null;
let uiServer = null;

// --- Window state persistence ---
function loadWindowState() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch {
    // ignore corrupt state
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

function saveWindowState() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const state = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: mainWindow.isMaximized(),
  };
  try {
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(state), 'utf-8');
  } catch {
    // ignore write errors
  }
}

// --- Window creation ---
function createWindow() {
  const state = loadWindowState();

  const windowOptions = {
    width: state.width,
    height: state.height,
    minWidth: 800,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#0f1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  };

  if (state.x !== undefined && state.y !== undefined) {
    windowOptions.x = state.x;
    windowOptions.y = state.y;
  }

  mainWindow = new BrowserWindow(windowOptions);

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadURL(`http://localhost:${UI_PORT}`);

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Menu ---
function buildMenu() {
  const template = [
    {
      label: APP_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'New Debate',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('focus-input');
            }
          },
        },
        {
          label: 'History',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-history');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-settings');
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- System tray ---
function createTray() {
  // 16x16 simple icon (1px white circle on transparent)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkoBAwUqifYdQABpIDANXE' +
    'QHIA0E0MJAcA3cRAcgAwDDcQHQCjBgweAwBz6QQR0gMKmgAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Gateway Status',
      enabled: false,
      label: gateway ? 'Gateway: Running' : 'Gateway: Stopped',
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// --- IPC handlers ---
function setupIPC() {
  // Swarm
  ipcMain.handle('start-swarm', async (_event, { question, agents }) => {
    const swarm = new Swarm({ agents: parseInt(agents) || 10000 });

    // Send phase progress to renderer
    const phases = ['alba', 'david', 'vex', 'elira'];
    phases.forEach((phase, i) => {
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('swarm-progress', { phase, index: i });
        }
      }, i * 800);
    });

    const result = await swarm.debate(question);
    await saveToMemory(result);
    return result;
  });

  // History
  ipcMain.handle('get-history', (_event, options = {}) => {
    const days = options.days || 30;
    return getRecentDebates(days);
  });

  ipcMain.handle('search-history', async (_event, { query, limit }) => {
    return searchMemory(query, limit || 5);
  });

  // Status
  ipcMain.handle('get-status', async () => {
    const gatewayRunning = gateway ? await gateway.isRunning() : false;
    return {
      gateway: gatewayRunning ? 'online' : 'offline',
      ui: 'online',
      port: UI_PORT,
    };
  });

  // Config
  ipcMain.handle('get-config', () => {
    const configPath = path.join(require('os').homedir(), '.askelira', '.env');
    try {
      return fs.readFileSync(configPath, 'utf-8');
    } catch {
      return '';
    }
  });

  // Gateway
  ipcMain.handle('restart-gateway', async () => {
    if (gateway && gateway.process) {
      gateway.process.kill();
    }
    gateway = new Gateway();
    await gateway.start();
    return { status: 'restarted' };
  });

  // Open memory folder
  ipcMain.handle('open-memory-folder', () => {
    const memoryDir = path.join(require('os').homedir(), '.askelira', 'memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    require('electron').shell.openPath(memoryDir);
  });
}

// --- Startup ---
async function startServices() {
  // Start UI server
  const ui = startUI();
  uiServer = ui.server;

  // Start gateway
  gateway = new Gateway();
  try {
    await gateway.start();
  } catch (err) {
    console.error('Gateway failed to start:', err.message);
  }
}

// --- App lifecycle ---
app.whenReady().then(async () => {
  await startServices();
  buildMenu();
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep running in tray on macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  saveWindowState();

  if (uiServer) {
    uiServer.close();
  }

  if (gateway && gateway.process) {
    gateway.process.kill();
  }
});
