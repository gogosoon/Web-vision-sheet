import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Define types for callbacks and expected data
interface ExcelFileInfo {
  sheetNames: string[];
  columns: string[];
  totalRows: number;
}

interface ProgressStats {
  currentRowIndex: number;
  totalRows: number;
  currentLogMessage: string;
}

interface ProcessingCompletePayload {
  outputPath: string;
}

interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  path?: string; // Used by some handlers like saveFile, createWorkspace
}

// Custom APIs for renderer
const api = {
  dialog: {
    openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (options: { defaultPath: string, filters: any[] }): Promise<string | null> => ipcRenderer.invoke('dialog:saveFile', options)
  },
  file: {
    copyFile: (source: string, destination: string): Promise<IpcResponse> => ipcRenderer.invoke('file:copy', source, destination)
  },
  shell: {
    openFolder: (folderPath: string): Promise<void> => ipcRenderer.invoke('shell:openFolder', folderPath)
  },
  app: {
    getWorkspacePath: (): Promise<string> => ipcRenderer.invoke('app:getWorkspacePath')
  },
  path: {
    join: (...args: string[]): Promise<string> => ipcRenderer.invoke('path:join', ...args),
    basename: (filePath: string): Promise<string> => ipcRenderer.invoke('path:basename', filePath),
    dirname: (filePath: string): Promise<string> => ipcRenderer.invoke('path:dirname', filePath)
  },
  workspace: {
    create: (workspaceName: string): Promise<IpcResponse> => ipcRenderer.invoke('workspace:create', workspaceName),
    saveFile: (workspacePath: string, fileName: string, content: string | Uint8Array | ArrayBufferView): Promise<IpcResponse> => {
      // Keep existing logic to handle content types
      if (typeof content === 'string' || content instanceof Uint8Array) {
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, content)
      } else if (ArrayBuffer.isView(content)) {
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, new Uint8Array(content.buffer))
      } else {
         // Should not happen based on type hint, but stringify as fallback
        return ipcRenderer.invoke('workspace:saveFile', workspacePath, fileName, JSON.stringify(content))
      } 
    }
  },
  browser: {
    launch: (): Promise<IpcResponse> => ipcRenderer.invoke('browser:launch')
  },

  // --- NEW APIs ---
  excel: {
    getFileInfo: (filePath: string): Promise<IpcResponse<ExcelFileInfo>> => ipcRenderer.invoke('excel:getFileInfo', filePath)
  },
  config: {
    // Assuming AppConfig structure is defined/imported in renderer too
    save: (configData: any): Promise<IpcResponse> => ipcRenderer.invoke('config:save', configData)
  },
  processing: {
    start: (): void => ipcRenderer.send('processing:start'),
    // Listener for progress updates
    onProgress: (callback: (stats: ProgressStats) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, stats: ProgressStats) => callback(stats);
      ipcRenderer.on('processingProgress', handler);
      // Return a cleanup function
      return () => ipcRenderer.removeListener('processingProgress', handler);
    },
    // Listener for completion
    onComplete: (callback: (payload: ProcessingCompletePayload) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, payload: ProcessingCompletePayload) => callback(payload);
      ipcRenderer.on('processingComplete', handler);
      // Return a cleanup function
      return () => ipcRenderer.removeListener('processingComplete', handler);
    },
    // Listener for errors
    onError: (callback: (errorMessage: string) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, errorMessage: string) => callback(errorMessage);
      ipcRenderer.on('processingError', handler);
      // Return a cleanup function
      return () => ipcRenderer.removeListener('processingError', handler);
    },
    // Function to remove all listeners at once (e.g., on component unmount)
    removeAllListeners: (): void => {
        ipcRenderer.removeAllListeners('processingProgress');
        ipcRenderer.removeAllListeners('processingComplete');
        ipcRenderer.removeAllListeners('processingError');
    }
  },

  // Auth related methods
  auth: {
    // Receive token from main process after browser redirect
    onAuthCallback: (callback: (token: string) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, token: string) => callback(token);
      ipcRenderer.on('auth-callback', handler);
      return () => ipcRenderer.removeListener('auth-callback', handler);
    },
    // Open browser for login
    openBrowserLogin: (url: string): void => {
      ipcRenderer.send('open-browser-login', url);
    },
    // Check if the auth protocol is registered
    checkProtocolRegistration: (): Promise<boolean> => {
      return ipcRenderer.invoke('auth:check-protocol-registration');
    },
    // Validate token with the backend
    validateToken: (token: string): Promise<IpcResponse<{user: any}>> => {
      return ipcRenderer.invoke('auth:validate-token', token);
    }
  },

  // IPC sender
  ipcRenderer: {
    send: (channel: string, ...args: any[]): void => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void => {
      ipcRenderer.on(channel, listener);
    },
    removeAllListeners: (channel: string): void => {
      ipcRenderer.removeAllListeners(channel);
    }
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
