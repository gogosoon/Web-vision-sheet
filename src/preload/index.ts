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
  },
  path: {
    join: (...args) => ipcRenderer.invoke('path:join', ...args),
    basename: (filePath) => ipcRenderer.invoke('path:basename', filePath),
    dirname: (filePath) => ipcRenderer.invoke('path:dirname', filePath)
  },
  workspace: {
    create: (workspaceName) => ipcRenderer.invoke('workspace:create', workspaceName),
    saveFile: (workspacePath, fileName, content) => {
      // Handle different content types
      if (typeof content === 'string') {
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, content)
      } else if (content instanceof Uint8Array) {
        // Uint8Array can be passed directly through IPC
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, content)
      } else if (ArrayBuffer.isView(content)) {
        // Convert other typed arrays to Uint8Array
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, new Uint8Array(content.buffer))
      } else {
        // For objects, stringify them
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, JSON.stringify(content))
      }
    }
  },
  browser: {
    launch: () => ipcRenderer.invoke('browser:launch')
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
