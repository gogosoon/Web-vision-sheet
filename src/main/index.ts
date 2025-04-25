import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { homedir } from 'os'

// Create the workspace directory if it doesn't exist
function getWorkspacePath() {
  const documentsPath = path.join(homedir(), 'Documents')
  const workspacePath = path.join(documentsPath, 'Glintify Workspace')
  
  if (!fs.existsSync(workspacePath)) {
    try {
      fs.mkdirSync(workspacePath, { recursive: true })
    } catch (error) {
      console.error('Failed to create workspace directory:', error)
    }
  }
  
  return workspacePath
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Set up IPC handlers
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers setup
function setupIpcHandlers() {
  // Open file dialog
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ]
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async (_, options) => {
    const { defaultPath, filters } = options
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters
    })
    if (canceled) {
      return null
    }
    return filePath
  })

  // Read Excel file info
  ipcMain.handle('file:readExcelInfo', async (_, filePath) => {
    return { filePath }
  })

  // Copy file
  ipcMain.handle('file:copy', async (_, source, destination) => {
    try {
      await fs.promises.copyFile(source, destination)
      return { success: true, destination }
    } catch (error: unknown) {
      console.error('File copy error:', error)
      let errorMessage = 'Unknown error occurred'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      return { success: false, error: errorMessage }
    }
  })

  // Open folder in explorer/finder
  ipcMain.handle('shell:openFolder', (_, folderPath) => {
    shell.openPath(folderPath)
  })

  // Get workspace path
  ipcMain.handle('app:getWorkspacePath', () => {
    return getWorkspacePath()
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
