const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('romlekDesktop', {
  platform: process.platform,
});
