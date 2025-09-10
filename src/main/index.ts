import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, session, shell } from 'electron'
import fs from 'fs'
import { homedir } from 'os'
import path, { join } from 'path'
import 'reflect-metadata'
import icon from '../../resources/icon.png?asset'

// Import our main process services
import { AiPrompt, AiService } from './aiService'
import { ExcelHandler } from './excelService'
import { WebService } from './webService'

// Import node-fetch
import { CONST_ELECTON_APP } from './const'

let mainWindow: BrowserWindow | null = null // Keep track of the main window
let webServiceInstance: WebService | null = null // Keep track of WebService instance

// Define the structure for the config file
interface AppConfig {
  originalFilePath: string
  workspacePath: string
  websiteColumnName: string
  aiPrompts: AiPrompt[]
  outputFileName?: string // Optional: specify output name
  apiKey?: string
}

// Create the workspace directory if it doesn't exist
function getWorkspacePath() {
  const documentsPath = path.join(homedir(), 'Documents')
  const workspacePath = path.join(documentsPath, 'webvisionsheet Workspace')

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
  const newWindow = new BrowserWindow({
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

  mainWindow = newWindow // Assign once created

  // Set Content Security Policy to allow connections to the API server
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self' ${CONST_ELECTON_APP.WEB_APP_URL} ${CONST_ELECTON_APP.API_URL};` +
            `connect-src 'self' ${CONST_ELECTON_APP.WEB_APP_URL} ${CONST_ELECTON_APP.API_URL};` +
            `script-src 'self' 'unsafe-inline' 'unsafe-eval';` +
            `style-src 'self' 'unsafe-inline';` +
            `img-src 'self' data: ${CONST_ELECTON_APP.WEB_APP_URL} ${CONST_ELECTON_APP.API_URL};` +
            `font-src 'self' data:;`
        ]
      }
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null // Clear reference on close
    // Ensure Puppeteer browser is closed if the window is closed
    webServiceInstance
      ?.closeBrowser()
      .catch((err) => console.error('Failed to close browser on window close:', err))
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
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
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create the singleton WebService instance
  webServiceInstance = new WebService()

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
  // Ensure Puppeteer browser is closed on quit
  webServiceInstance
    ?.closeBrowser()
    .catch((err) => console.error('Failed to close browser on app quit:', err))
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
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
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
      // Updated check: Use path.isAbsolute and check common relative path starts
      if (
        !path.isAbsolute(workspaceName) &&
        !workspaceName.startsWith('.') &&
        !workspaceName.startsWith('/') &&
        !workspaceName.includes(':\\')
      ) {
        projectWorkspacePath = path.join(baseWorkspacePath, workspaceName)
      } else if (workspaceName === '.') {
        // Handle case where it's just the base path itself
        projectWorkspacePath = baseWorkspacePath
      }

      console.log(`Attempting to create/ensure directory: ${projectWorkspacePath}`)

      // Create the workspace directory if it doesn't exist
      await fs.promises.mkdir(projectWorkspacePath, { recursive: true })
      console.log(`Directory should now exist: ${projectWorkspacePath}`)

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

  ipcMain.handle('workspace:saveFile', async (_, workspacePath, fileName, content) => {
    // Check if workspacePath is valid
    if (!workspacePath || typeof workspacePath !== 'string') {
      return { success: false, error: 'Invalid workspace path provided.' }
    }
    try {
      // Ensure the target directory exists
      await fs.promises.mkdir(workspacePath, { recursive: true })

      const filePath = path.join(workspacePath, fileName)
      console.log(`Saving file to: ${filePath}`)

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

  // Read Excel file info (using moved service)
  ipcMain.handle('excel:getFileInfo', async (_, filePath) => {
    console.log(`IPC excel:getFileInfo called for path: ${filePath}`)
    if (!filePath || typeof filePath !== 'string' || !fs.existsSync(filePath)) {
      console.error('excel:getFileInfo - Invalid or non-existent file path provided:', filePath)
      return { success: false, error: 'Invalid or non-existent file path provided.' }
    }
    try {
      const info = await ExcelHandler.getFileInfo(filePath)
      console.log('excel:getFileInfo - Info retrieved:', info)
      return { success: true, data: info }
    } catch (error: unknown) {
      console.error('Error getting Excel file info:', error)
      const message =
        error instanceof Error ? error.message : 'Unknown error reading Excel file info'
      return { success: false, error: message }
    }
  })

  // Save configuration data
  ipcMain.handle('config:save', async (_, configData: AppConfig) => {
    if (!configData || !configData.workspacePath) {
      return { success: false, error: 'Invalid configuration data or missing workspace path.' }
    }
    const configFilePath = path.join(configData.workspacePath, 'config.json')
    console.log(`Saving configuration to: ${configFilePath}`)
    try {
      await fs.promises.writeFile(configFilePath, JSON.stringify(configData, null, 2), 'utf-8')
      return { success: true, path: configFilePath }
    } catch (error: unknown) {
      console.error('Error saving config file:', error)
      const message = error instanceof Error ? error.message : 'Unknown error saving config file'
      return { success: false, error: message }
    }
  })

  // Start the main processing job
  ipcMain.on('processing:start', async () => {
    console.log('IPC processing:start received')
    const currentMainWindow = mainWindow
    if (!currentMainWindow) {
      console.error('Processing start request received but mainWindow is not available.')
      // Optionally send an error back to renderer if needed
      return
    }

    // Find the most recent workspace directory
    let latestWorkspacePath: string | null = null
    try {
      const baseWorkspace = getWorkspacePath()
      const directories = await fs.promises.readdir(baseWorkspace, { withFileTypes: true })
      const workspaceDirs = directories
        .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('workspace-'))
        .map((dirent) => path.join(baseWorkspace, dirent.name))

      if (workspaceDirs.length > 0) {
        // Find the most recently modified workspace
        let latestTime = 0
        for (const dirPath of workspaceDirs) {
          const stats = await fs.promises.stat(dirPath)
          if (stats.mtimeMs > latestTime) {
            latestTime = stats.mtimeMs
            latestWorkspacePath = dirPath
          }
        }
      }
    } catch (err) {
      console.error('Error finding latest workspace:', err)
      currentMainWindow.webContents.send('processingError', 'Error finding workspace directory.')
      return
    }

    if (!latestWorkspacePath) {
      console.error('No workspace found to process.')
      currentMainWindow.webContents.send(
        'processingError',
        'Could not find a workspace directory to process.'
      )
      return
    }

    const configFilePath = path.join(latestWorkspacePath, 'config.json')
    console.log(`Attempting to read config from: ${configFilePath}`)

    try {
      const configDataStr = await fs.promises.readFile(configFilePath, 'utf-8')
      const config: AppConfig = JSON.parse(configDataStr)

      // Get stored token

      // Create instances of services
      const excelHandler = new ExcelHandler(currentMainWindow) // Pass window for progress updates
      const aiService = new AiService() // Use stored token with null check
      // webServiceInstance is already created and managed globally
      if (!webServiceInstance) {
        throw new Error('WebService instance not available')
      }

      // Define paths
      const screenshotsDir = path.join(config.workspacePath, 'screenshots')
      await fs.promises.mkdir(screenshotsDir, { recursive: true }) // Ensure screenshot dir exists

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const inputFileName = path.basename(config.originalFilePath)
      const outputFileName = config.outputFileName || `enriched-${timestamp}-${inputFileName}`
      const outputFilePath = path.join(config.workspacePath, outputFileName)

      console.log(`Starting file processing:`)
      console.log(`  Input: ${config.originalFilePath}`)
      console.log(`  Output: ${outputFilePath}`)
      console.log(`  Screenshots: ${screenshotsDir}`)
      console.log(`  Website Column: ${config.websiteColumnName}`)

      // Start processing
      await excelHandler.processFile(
        config.originalFilePath,
        config.websiteColumnName,
        config.aiPrompts,
        outputFilePath,
        screenshotsDir,
        webServiceInstance, // Use shared instance
        aiService,
        config.apiKey
      )

      console.log('Processing finished successfully.')
      // Send completion message
      currentMainWindow.webContents.send('processingComplete', { outputPath: outputFilePath })
    } catch (error: unknown) {
      console.error('Error during processing:', error)
      const message = error instanceof Error ? error.message : 'Unknown processing error'
      // Send error message to renderer
      currentMainWindow.webContents.send('processingError', message)
    } finally {
      // Optional: Close browser after processing is fully complete?
      await webServiceInstance?.closeBrowser()
    }
  })

  // Launch browser
  ipcMain.handle('browser:launch', async () => {
    console.log('IPC browser:launch received')
    if (!webServiceInstance) {
      console.error('Cannot launch browser: WebService instance is not available.')
      return { success: false, error: 'WebService not initialized' }
    }

    try {
      // Call the WebService method to launch/ensure the headed browser
      await webServiceInstance.launchHeadedBrowser()
      console.log('Headed browser launched/focused successfully via WebService.')
      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to launch headed browser via WebService:', error)
      let errorMessage = 'Unknown error during browser launch'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
