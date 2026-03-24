const { autoUpdater } = require('electron-updater');
const { Notification, BrowserWindow } = require('electron');

const APP_NAME = 'AskElira';
let updateReady = false;
let silentMode = true;

function initAutoUpdater({ silent = true } = {}) {
  silentMode = silent;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log(`Update available: v${info.version}`);
    if (!silentMode) {
      notify('Update Available', `Version ${info.version} is downloading...`);
    }
  });

  autoUpdater.on('update-not-available', () => {
    log('No updates available');
    if (!silentMode) {
      notify('Up to Date', `${APP_NAME} is running the latest version.`);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    log(`Downloading: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateReady = true;
    log(`Update downloaded: v${info.version}`);
    notify(
      'Update Ready',
      `Version ${info.version} will be installed when you quit ${APP_NAME}.`
    );
  });

  autoUpdater.on('error', (err) => {
    log(`Update error: ${err.message}`);
    if (!silentMode) {
      notify('Update Error', err.message);
    }
  });
}

function checkForUpdates() {
  if (process.env.NODE_ENV === 'development') {
    log('Skipping update check in development');
    return;
  }
  silentMode = true;
  autoUpdater.checkForUpdates();
}

function checkForUpdatesManual() {
  silentMode = false;
  autoUpdater.checkForUpdates();
}

function installUpdate() {
  if (updateReady) {
    autoUpdater.quitAndInstall(false, true);
  }
}

function isUpdateReady() {
  return updateReady;
}

function notify(title, body) {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: `${APP_NAME} — ${title}`,
    body,
    silent: true,
  });

  notification.on('click', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].show();
      windows[0].focus();
    }
  });

  notification.show();
}

function log(message) {
  console.log(`[updater] ${message}`);
}

module.exports = {
  initAutoUpdater,
  checkForUpdates,
  checkForUpdatesManual,
  installUpdate,
  isUpdateReady,
};
