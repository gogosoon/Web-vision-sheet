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

  // Path helpers
  ipcMain.handle('path:join', (_, ...parts) => {
    return path.join(...parts)
  })
  
  ipcMain.handle('path:basename', (_, filepath) => {
    return path.basename(filepath)
  })
  
  ipcMain.handle('path:dirname', (_, filepath) => {
    return path.dirname(filepath)
  })

  // Create workspace directory
  ipcMain.handle('workspace:create', async (_, workspaceName) => {
    try {
      const baseWorkspacePath = getWorkspacePath()
      
      // Determine if the path should be treated as relative to the base workspace
      // or if it's an absolute path that should be created directly
      let projectWorkspacePath = workspaceName
      
      // If it doesn't look like an absolute path, treat it as relative
      if (!path.isAbsolute(workspaceName) && !workspaceName.includes('/') && !workspaceName.includes('\\')) {
        projectWorkspacePath = path.join(baseWorkspacePath, workspaceName)
      }
      
      // Create the workspace directory if it doesn't exist
      if (!fs.existsSync(projectWorkspacePath)) {
        fs.mkdirSync(projectWorkspacePath, { recursive: true })
      }
      
      return { success: true, path: projectWorkspacePath }
    } catch (error: unknown) {
      console.error('Failed to create workspace:', error)
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  })
  
  // Save file to workspace
  ipcMain.handle('workspace:saveFile', async (_, workspacePath, fileName, content) => {
    try {
      const filePath = path.join(workspacePath, fileName)
      
      if (typeof content === 'string') {
        // Save text content
        await fs.promises.writeFile(filePath, content, 'utf-8')
      } else if (content instanceof Uint8Array || Buffer.isBuffer(content)) {
        // Save binary content (Uint8Array from renderer or Buffer)
        await fs.promises.writeFile(filePath, content)
      } else if (ArrayBuffer.isView(content)) {
        // Handle TypedArray views
        await fs.promises.writeFile(filePath, Buffer.from(content.buffer))
      } else {
        // Handle other objects by converting to JSON
        await fs.promises.writeFile(filePath, JSON.stringify(content), 'utf-8')
      }
      
      return { success: true, path: filePath }
    } catch (error: unknown) {
      console.error('Failed to save file:', error)
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  })
  
  // Launch browser
  ipcMain.handle('browser:launch', async () => {
    try {
      const { exec } = require('child_process')
      const userDataDir = path.join(app.getPath('userData'), 'puppeteer_profile')
      
      // Create user data directory if it doesn't exist
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      
      // Determine the command to launch Chrome with the profile
      let command
      if (process.platform === 'win32') {
        command = `start chrome --user-data-dir="${userDataDir}"`
      } else if (process.platform === 'darwin') {
        command = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --user-data-dir="${userDataDir}"`
      } else {
        command = `google-chrome --user-data-dir="${userDataDir}"`
      }
      
      exec(command, (error) => {
        if (error) {
          console.error('Failed to launch browser:', error)
          return { success: false, error: error.message }
        }
      })
      
      return { success: true, profilePath: userDataDir }
    } catch (error: unknown) {
      console.error('Failed to launch browser:', error)
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
