import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      dialog: {
        openFile: () => Promise<string | null>
        saveFile: (options: { defaultPath: string, filters: { name: string, extensions: string[] }[] }) => Promise<string | null>
      }
      file: {
        readExcelInfo: (filePath: string) => Promise<any>
        copyFile: (source: string, destination: string) => Promise<{ success: boolean, destination?: string, error?: string }>
      }
      shell: {
        openFolder: (folderPath: string) => Promise<void>
      }
      app: {
        getWorkspacePath: () => Promise<string>
      }
      path: {
        join: (...parts: string[]) => Promise<string>
        basename: (filepath: string) => Promise<string>
        dirname: (filepath: string) => Promise<string>
      }
      workspace: {
        create: (workspaceName: string) => Promise<{ success: boolean, path?: string, error?: string }>
        saveFile: (workspacePath: string, fileName: string, content: string | Uint8Array | ArrayBufferView | object) => 
          Promise<{ success: boolean, path?: string, error?: string }>
      }
      browser: {
        launch: () => Promise<{ success: boolean, profilePath?: string, error?: string }>
      }
    }
  }
}
