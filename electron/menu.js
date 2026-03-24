const { Menu, shell, app } = require('electron');

const APP_NAME = 'AskElira';
const DOCS_URL = 'https://github.com/askelira/askelira#readme';

function createMenu({ onNewDebate, onShowHistory, onShowSettings } = {}) {
  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (macOS only)
    ...(isMac
      ? [{
          label: APP_NAME,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            {
              label: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              click: () => onShowSettings && onShowSettings(),
            },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),

    // File
    {
      label: 'File',
      submenu: [
        {
          label: 'New Debate',
          accelerator: 'CmdOrCtrl+N',
          click: () => onNewDebate && onNewDebate(),
        },
        { type: 'separator' },
        {
          label: 'History',
          accelerator: 'CmdOrCtrl+H',
          click: () => onShowHistory && onShowHistory(),
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+,',
                click: () => onShowSettings && onShowSettings(),
              },
              { type: 'separator' },
            ]
          : []),
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },

    // View
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

    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },

    // Help
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal(DOCS_URL),
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal(DOCS_URL.replace('#readme', '/issues')),
        },
        { type: 'separator' },
        {
          label: `About ${APP_NAME}`,
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: `About ${APP_NAME}`,
              message: APP_NAME,
              detail: `Version ${app.getVersion()}\n\nVisual swarm intelligence for developers.\n\n${app.getVersion()} Alvin Kerremans`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = { createMenu };
