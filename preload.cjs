const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('twintickerSettings', {
  status: () => ipcRenderer.invoke('settings:status'),
  save: (clientId, clientSecret) => ipcRenderer.invoke('settings:save', { clientId, clientSecret }),
  clear: () => ipcRenderer.invoke('settings:clear')
});
