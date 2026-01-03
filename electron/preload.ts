import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  // Specific API for File System operations
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanEagleLibrary: (path: string) => ipcRenderer.invoke('eagle:scanLibrary', path),
  
  // System Automation
  // modelId can be 'vision', 'thinking', 'aesthetic', or 'backend_deps'
  installModel: (modelId: string, basePath: string) => ipcRenderer.invoke('system:installModel', modelId, basePath),
  onInstallLog: (callback: (event: any, message: string) => void) => ipcRenderer.on('install-log', callback),
  removeInstallLogListener: () => ipcRenderer.removeAllListeners('install-log')
})