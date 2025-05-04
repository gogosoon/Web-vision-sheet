import type { ElectronAPI } from '@electron-toolkit/preload'
import { IpcRendererEvent } from 'electron'

// Define types matching those in preload.ts
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
  path?: string; // Common return field for file/workspace ops
}

// Define the custom API structure matching preload.ts
interface CustomAPI {
  dialog: {
    openFile: () => Promise<string | null>;
    saveFile: (options: { defaultPath: string, filters: any[] }) => Promise<string | null>;
  };
  file: {
    copyFile: (source: string, destination: string) => Promise<IpcResponse>;
  };
  shell: {
    openFolder: (folderPath: string) => Promise<void>;
  };
  app: {
    getWorkspacePath: () => Promise<string>;
  };
  path: {
    join: (...args: string[]) => Promise<string>;
    basename: (filePath: string) => Promise<string>;
    dirname: (filePath: string) => Promise<string>;
  };
  workspace: {
    create: (workspaceName: string) => Promise<IpcResponse>;
    saveFile: (workspacePath: string, fileName: string, content: string | Uint8Array | ArrayBufferView) => Promise<IpcResponse>;
  };
  browser: {
    launch: () => Promise<IpcResponse>;
  };
  excel: {
    getFileInfo: (filePath: string) => Promise<IpcResponse<ExcelFileInfo>>;
  };
  config: {
    // Define AppConfig structure here or import if shared
    save: (configData: any) => Promise<IpcResponse>; 
  };
  processing: {
    start: () => void;
    onProgress: (callback: (stats: ProgressStats) => void) => () => void; // Returns cleanup function
    onComplete: (callback: (payload: ProcessingCompletePayload) => void) => () => void; // Returns cleanup function
    onError: (callback: (errorMessage: string) => void) => () => void; // Returns cleanup function
    removeAllListeners: () => void;
  };
  auth: {
    checkProtocolRegistration: () => Promise<boolean>;
    validateToken: (token: string) => Promise<IpcResponse<{user: any}>>;
    getUserProfile: (token: string) => Promise<IpcResponse<{user: any}>>;
  };
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI // Replace original 'api' with the fully typed CustomAPI
  }
}
