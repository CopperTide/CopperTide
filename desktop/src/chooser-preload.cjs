// The chooser page's only bridge to the app: report the choice; nothing else is exposed.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('coppertide', {
  defaultOrigin: process.env.COPPERTIDE_ACCOUNT_ORIGIN || '',
  choose: (mode, origin) => ipcRenderer.invoke('coppertide:choose', { mode, origin }),
});
