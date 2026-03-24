const { Notification, BrowserWindow } = require('electron');

const APP_NAME = 'AskElira';

function focusMainWindow() {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    const win = windows[0];
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}

function notifyDebateComplete(result) {
  if (!Notification.isSupported()) return;

  const decision = (result.decision || 'unknown').toUpperCase();
  const confidence = result.confidence || 0;
  const question = truncate(result.question || '', 60);
  const cost = (result.actualCost || 0).toFixed(4);

  const notification = new Notification({
    title: `Decision: ${decision} (${confidence}%)`,
    body: `${question}\nCost: $${cost}`,
    silent: false,
  });

  notification.on('click', focusMainWindow);
  notification.show();
}

function notifyError(message) {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: `${APP_NAME} — Error`,
    body: truncate(message || 'An unknown error occurred', 80),
    silent: false,
  });

  notification.on('click', focusMainWindow);
  notification.show();
}

function notifyGatewayStatus(status) {
  if (!Notification.isSupported()) return;

  const isOnline = status === 'online';
  const title = isOnline ? 'Gateway Online' : 'Gateway Offline';
  const body = isOnline
    ? 'OpenClaw gateway is running and ready for swarms.'
    : 'Gateway is not responding. Run "askelira start" to restart.';

  const notification = new Notification({
    title: `${APP_NAME} — ${title}`,
    body,
    silent: true,
  });

  notification.on('click', focusMainWindow);
  notification.show();
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

module.exports = { notifyDebateComplete, notifyError, notifyGatewayStatus };
