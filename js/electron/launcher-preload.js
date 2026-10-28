const { contextBridge, ipcRenderer } = require('electron');

const call = channel => (...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('win98Launcher', {
  init: call('launcher:init'),
  ready: call('launcher:ready'),
  check: call('launcher:check'),
  download: call('launcher:download'),
  pause: call('launcher:pause'),
  cancel: call('launcher:cancel'),
  apply: call('launcher:apply'),
  rollback: call('launcher:rollback'),
  settings: call('launcher:settings'),
  read: call('launcher:read'),
  start: call('launcher:start'),
  minimize: call('launcher:minimize'),
  close: call('launcher:close'),
  openFolder: call('launcher:open-folder'),
  openUrl: call('launcher:open-url'),
  onProgress: fn => ipcRenderer.on('launcher:progress', (event, data) => fn(data))
});
