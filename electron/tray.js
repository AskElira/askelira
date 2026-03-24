const { Tray, Menu, nativeImage, Notification, BrowserWindow } = require('electron');
const path = require('path');

const APP_NAME = 'AskElira';

// 16x16 tray icon (indigo circle)
const ICON_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkoBAwUqifYdQABpIDANXE' +
  'QHIA0E0MJAcA3cRAcgAwDDcQHQCjBgweAwBz6QQR0gMKmgAAAABJRU5ErkJggg==';

class AppTray {
  constructor({ onShow, onNewDebate, onQuit, getRecentDebates } = {}) {
    this.tray = null;
    this.onShow = onShow || (() => {});
    this.onNewDebate = onNewDebate || (() => {});
    this.onQuit = onQuit || (() => {});
    this.getRecentDebates = getRecentDebates || (() => []);
    this.status = 'Idle';
  }

  create() {
    const icon = nativeImage.createFromDataURL(ICON_DATA);
    this.tray = new Tray(icon);
    this.tray.setToolTip(`${APP_NAME} — ${this.status}`);

    this.tray.on('click', () => {
      this.onShow();
    });

    this.refreshMenu();
    return this.tray;
  }

  refreshMenu() {
    if (!this.tray) return;

    const recentDebates = this.getRecentDebates();
    const recentItems = recentDebates.slice(0, 5).map((d) => ({
      label: truncate(d.question || 'Unknown', 40),
      sublabel: `${d.decision || '?'} — ${d.confidence || 0}%`,
      click: () => this.onNewDebate(d.question),
    }));

    const template = [
      {
        label: 'Show Window',
        click: () => this.onShow(),
      },
      { type: 'separator' },
      {
        label: 'New Debate...',
        accelerator: 'CmdOrCtrl+N',
        click: () => this.onNewDebate(),
      },
      { type: 'separator' },
      {
        label: 'Recent Debates',
        enabled: recentItems.length > 0,
        submenu: recentItems.length > 0
          ? recentItems
          : [{ label: 'No recent debates', enabled: false }],
      },
      { type: 'separator' },
      {
        label: `Status: ${this.status}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.onQuit(),
      },
    ];

    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }

  setStatus(status) {
    this.status = status;
    if (this.tray) {
      this.tray.setToolTip(`${APP_NAME} — ${status}`);
      this.refreshMenu();
    }
  }

  notifyDebateComplete(result) {
    if (!Notification.isSupported()) return;

    const decision = (result.decision || 'unknown').toUpperCase();
    const confidence = result.confidence || 0;

    const notification = new Notification({
      title: `${APP_NAME} — Debate Complete`,
      body: `Decision: ${decision} (${confidence}% confidence)\n${truncate(result.question || '', 60)}`,
      silent: false,
    });

    notification.on('click', () => {
      this.onShow();
    });

    notification.show();
  }

  notifyError(message) {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title: `${APP_NAME} — Error`,
      body: message,
      silent: false,
    });

    notification.show();
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

module.exports = { AppTray };
