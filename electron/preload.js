const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Swarm ---
  startSwarm: (question, agents) =>
    ipcRenderer.invoke('start-swarm', { question, agents }),

  // --- History ---
  getHistory: (options) =>
    ipcRenderer.invoke('get-history', options),

  searchHistory: (query, limit) =>
    ipcRenderer.invoke('search-history', { query, limit }),

  // --- Status ---
  getStatus: () =>
    ipcRenderer.invoke('get-status'),

  getConfig: () =>
    ipcRenderer.invoke('get-config'),

  restartGateway: () =>
    ipcRenderer.invoke('restart-gateway'),

  // --- External links ---
  openExternal: (url) => {
    // Only allow http/https URLs for security
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
  },

  openMemoryFolder: () =>
    ipcRenderer.invoke('open-memory-folder'),

  // --- Main process events → renderer ---
  onFocusInput: (callback) => {
    ipcRenderer.on('focus-input', (_event) => callback());
  },

  onShowHistory: (callback) => {
    ipcRenderer.on('show-history', (_event) => callback());
  },

  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', (_event) => callback());
  },

  onSwarmProgress: (callback) => {
    ipcRenderer.on('swarm-progress', (_event, data) => callback(data));
  },

  // --- Cleanup ---
  removeAllListeners: (channel) => {
    const allowed = ['focus-input', 'show-history', 'show-settings', 'swarm-progress'];
    if (allowed.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
