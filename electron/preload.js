const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('win98Native', {
  capture: () => ipcRenderer.invoke('win98:capture'),
  pendingUpdate: () => ipcRenderer.invoke('win98:pending-update'),
  openLauncher: () => ipcRenderer.invoke('win98:open-launcher')
});
