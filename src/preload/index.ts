import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  },
  file: {
    readExcelInfo: (filePath) => ipcRenderer.invoke('file:readExcelInfo', filePath),
    copyFile: (source, destination) => ipcRenderer.invoke('file:copy', source, destination)
  },
  shell: {
    openFolder: (folderPath) => ipcRenderer.invoke('shell:openFolder', folderPath)
  },
  app: {
    getWorkspacePath: () => ipcRenderer.invoke('app:getWorkspacePath')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
