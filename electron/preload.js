const { contextBridge, ipcRenderer } = require('electron');

// Renderer 프로세스에 안전하게 노출할 API
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // 향후 필요 시 추가 기능
  // 예: 파일 시스템 접근, 시스템 알림 등

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('Preload script loaded');
