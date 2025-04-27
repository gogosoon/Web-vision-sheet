import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/button'
import { Upload, FileSpreadsheet, Info, PlusCircle, X, Chrome } from 'lucide-react'
import { toast } from 'react-hot-toast'
import BaseWrapper from '@/components/BaseWrapper'

// Import the AiPrompt type if it's defined centrally, or define it here
// Assuming it might be available via store or a types file
import type { AiPrompt } from '@/lib/store'; 

const HomeScreen: React.FC = () => {
  const { setExcelFile, setCurrentScreen, updateExcelFile, addAiPrompt, removeAiPrompt } = useAppStore()
  const [uploadStep, setUploadStep] = useState<'initial' | 'column-selection' | 'ai-prompts'>('initial')
  const [error, setError] = useState<string | null>(null)
  const [newPrompt, setNewPrompt] = useState({ columnName: '', prompt: '' })
  const [loading, setLoading] = useState<boolean>(false)
  const excelFile = useAppStore((state) => state.excelFile)

  const handleLaunchBrowser = async () => {
    try {
      setLoading(true)
      const result = await window.api.browser.launch()
      
      if (result.success) {
        toast.success('Browser launched successfully')
      } else {
        toast.error(`Failed to launch browser: ${result.error}`)
      }
    } catch (error: unknown) {
      console.error('Error launching browser:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to launch browser: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      toast.loading('Creating workspace and analyzing file...', { id: 'upload-toast' })

      // 1. Create workspace and save the original file via IPC
      const workspaceDirPath = await window.api.path.dirname(file.path || file.name) // Might need adjustment based on File object
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const workspaceName = `workspace-${timestamp}`
      
      // Create the main workspace directory
      const createWorkspaceResult = await window.api.workspace.create(workspaceName)
      if (!createWorkspaceResult.success || !createWorkspaceResult.path) {
          throw new Error(createWorkspaceResult.error || 'Failed to create workspace directory')
      }
      const workspacePath = createWorkspaceResult.path;
      
      // Convert File to Uint8Array to pass through IPC
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Save the original file to the workspace
      const inputFileName = 'input.xlsx' // Standardized name
      const saveFileResult = await window.api.workspace.saveFile(
          workspacePath,
          inputFileName,
          uint8Array
      )
      
      if (!saveFileResult.success || !saveFileResult.path) {
        throw new Error(saveFileResult.error || 'Failed to save file to workspace')
      }
      const savedFilePath = saveFileResult.path;
      
      // Save initial metadata (optional, but good practice)
      const metadata = {
        originalFileName: file.name,
        uploadTime: new Date().toISOString(),
        workspacePath: workspacePath,
        savedInputPath: savedFilePath
      }
      await window.api.workspace.saveFile(
        workspacePath,
        'data.json',
        JSON.stringify(metadata, null, 2)
      )

      // 2. Get Excel file info via IPC
      // Ensure the path passed to getFileInfo is the *actual saved path* in the workspace
      const excelInfoResult = await window.api.excel.getFileInfo(savedFilePath);

      if (!excelInfoResult.success || !excelInfoResult.data) {
        throw new Error(excelInfoResult.error || 'Failed to read Excel file information.')
      }
      
      const { sheetNames, columns, totalRows } = excelInfoResult.data;

      // 3. Update application state (Zustand store)
      setExcelFile({
        fileName: file.name,         // Original file name for display
        filePath: savedFilePath,     // Path *inside the workspace* for processing
        workspacePath: workspacePath, // Store workspace path
        sheetNames,
        selectedSheet: sheetNames[0], // Default to first sheet
        websiteColumn: null,         // Reset selection
        columns,
        totalRows,
        aiPrompts: []                // Reset prompts
      })

      setUploadStep('column-selection')
      toast.success('File uploaded and analyzed', { id: 'upload-toast' })
    } catch (err: unknown) {
      console.error('Error during file upload:', err)
      let errorMessage = 'File upload failed. Please ensure it is a valid .xlsx file and try again.'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      toast.error(errorMessage, { id: 'upload-toast' })
      // Reset state if needed
      setExcelFile(null);
      setUploadStep('initial');
    } finally {
      setLoading(false)
    }
  }, [setExcelFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
      // 'application/vnd.ms-excel': ['.xls'] // Consider if .xls is truly supported by backend
    },
    maxFiles: 1,
    disabled: loading
  })

  const handleWebsiteColumnSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateExcelFile({ websiteColumn: e.target.value || null })
  }

  const handleAddPrompt = () => {
    if (newPrompt.columnName.trim() && newPrompt.prompt.trim()) {
      // Basic validation: Check if column name already exists
      if (excelFile?.aiPrompts.some(p => p.columnName === newPrompt.columnName.trim())) {
          toast.error('Column name already exists. Please use a unique name.');
          return;
      }
      addAiPrompt({ 
        columnName: newPrompt.columnName.trim(),
        prompt: newPrompt.prompt.trim()
      });
      setNewPrompt({ columnName: '', prompt: '' });
    }
  }

  const handleRemovePrompt = (columnName: string) => {
      removeAiPrompt(columnName);
  }

  const startProcessing = async () => {
    if (!excelFile || !excelFile.filePath || !excelFile.websiteColumn || !excelFile.workspacePath) {
      setError('Missing required information. Please select a file and website column.')
      toast.error('Missing required information.')
      return
    }
    if (excelFile.aiPrompts.length === 0) {
       setError('Please add at least one AI prompt before starting.');
       toast.error('Please add at least one AI prompt.');
       return;
    }

    setError(null); // Clear previous errors
    setLoading(true);
    toast.loading('Saving configuration...', { id: 'config-toast' });

    try {
      // Prepare config data
      const configData = {
        originalFilePath: excelFile.filePath, // Use the path within the workspace
        workspacePath: excelFile.workspacePath,
        websiteColumnName: excelFile.websiteColumn,
        aiPrompts: excelFile.aiPrompts
      };

      // Save config via IPC
      const saveResult = await window.api.config.save(configData);

      if (saveResult.success) {
        toast.success('Configuration saved. Starting processing...', { id: 'config-toast' });
        // Trigger the main process to start
        window.api.processing.start();

        setCurrentScreen('processing');
      } else {
        throw new Error(saveResult.error || 'Failed to save configuration.');
      }

    } catch (err: unknown) {
        console.error('Error saving configuration:', err);
        let errorMessage = 'Failed to save configuration.'
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast.error(errorMessage, { id: 'config-toast' });
    } finally {
        setLoading(false);
    }
  }

  return (
    <BaseWrapper>
      <div className="w-full max-w-4xl mx-auto">
        {/* Browser launch button - Kept here as it seems specific to this screen */}
        <div className="mb-6 text-center">
          <Button
            variant="outline"
            onClick={handleLaunchBrowser}
            disabled={loading}
            className="flex items-center gap-2 mx-auto bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm cursor-pointer"
          >
            <Chrome size={18} />
            Open Browser for Login (if needed)
          </Button>
           <p className="text-xs text-slate-500 mt-1">Some websites might require you to be logged in. Open the browser to log in first.</p>
        </div>

        {/* Line separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-500">Excel File Import</span>
          </div>
        </div>

        {/* --- Initial Upload Step --- */}
        {uploadStep === 'initial' && (
          <div className="flex flex-col items-center justify-center">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 w-full max-w-2xl mx-auto bg-white
                flex flex-col items-center justify-center space-y-4 cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload size={64} className="text-slate-400 mb-4" />
              <div className="text-center">
                <p className="text-lg font-medium mb-2 text-gray-700">
                  {isDragActive
                    ? 'Drop the Excel file here'
                    : loading
                    ? 'Processing...'
                    : 'Drag & drop Excel file here, or click to select'}
                </p>
                <p className="text-sm text-slate-500">Supports .xlsx files</p>
              </div>
              {/* Button removed, click area is the button now */}
            </div>

            {error && (
              <div className="mt-6 p-3 bg-red-100 text-red-700 rounded-md flex items-center max-w-2xl mx-auto">
                <Info size={18} className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* --- Configuration Steps (Column Selection & AI Prompts) --- */}
        {(uploadStep === 'column-selection' || uploadStep === 'ai-prompts') && excelFile && (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full gap-6">
            {/* File Details & Column Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">1. Select Website Column</h2>
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Filename</p>
                  <p className="font-medium truncate" title={excelFile.fileName}>{excelFile.fileName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sheet</p>
                  <p className="font-medium">{excelFile.selectedSheet}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Rows</p>
                  <p className="font-medium">{excelFile.totalRows}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <label htmlFor="websiteColumn" className="block text-sm font-medium text-gray-700">
                  Column containing website URLs:
                </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUploadStep('initial')}
                  className="text-xs flex items-center gap-1"
                >
                  <FileSpreadsheet size={14} />
                  Select Different File
                </Button>
              </div>
              <select
                id="websiteColumn"
                value={excelFile.websiteColumn || ''}
                onChange={handleWebsiteColumnSelect}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="" disabled>-- Select Column --</option>
                {excelFile.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* AI Prompts Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">2. Configure AI Prompts</h2>
              <p className="text-sm text-slate-600 mb-4">
                Add columns to your Excel file based on AI analysis of each website's screenshot.
              </p>

              {/* List Existing Prompts */}
              <div className="space-y-2 mb-4">
                {excelFile.aiPrompts.length > 0 ? (
                  excelFile.aiPrompts.map((prompt) => (
                    <div key={prompt.columnName} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">{prompt.columnName}:</span>
                        <span className="text-gray-600 ml-2 truncate" title={prompt.prompt}>{prompt.prompt}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePrompt(prompt.columnName)} disabled={loading}>
                        <X size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No AI prompts added yet.</p>
                )}
              </div>

              {/* Add New Prompt Form */}
              <div className="flex flex-col sm:flex-row gap-4 border-t pt-4">
                <input
                  type="text"
                  placeholder="New Column Name (e.g., Summary)"
                  value={newPrompt.columnName}
                  onChange={(e) => setNewPrompt({ ...newPrompt, columnName: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="AI Prompt (e.g., Summarize the website)"
                  value={newPrompt.prompt}
                  onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <Button 
                  onClick={handleAddPrompt} 
                  disabled={loading || !newPrompt.columnName || !newPrompt.prompt}
                  className="whitespace-nowrap"
                >
                  <PlusCircle size={18} className="mr-2" /> Add Prompt
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                <Info size={18} className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Continue Button */}
            <div className="mt-auto pt-6 text-center">
               <Button 
                  onClick={startProcessing} 
                  disabled={loading || !excelFile.websiteColumn || excelFile.aiPrompts.length === 0}
                  size="lg"
                >
                  Start Processing
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseWrapper>
  )
}

export default HomeScreen 