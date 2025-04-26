import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/button'
import { Upload, FileSpreadsheet, Info, PlusCircle, X, Chrome } from 'lucide-react'
import * as Excel from 'exceljs'
import { toast } from 'react-hot-toast'

const HomeScreen: React.FC = () => {
  const { setExcelFile, setCurrentScreen, updateExcelFile, addAiPrompt } = useAppStore()
  const [uploadStep, setUploadStep] = useState<'initial' | 'column-selection' | 'ai-prompts'>('initial')
  const [error, setError] = useState<string | null>(null)
  const [newPrompt, setNewPrompt] = useState({ columnName: '', prompt: '' })
  const [loading, setLoading] = useState<boolean>(false)
  const excelFile = useAppStore((state) => state.excelFile)

  const createWorkspace = async (file: File): Promise<string> => {
    try {
      // Create a timestamped workspace name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const workspaceName = `workspace-${timestamp}`
      
      // Create the workspace directory
      const result = await window.api.workspace.create(workspaceName)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create workspace directory')
      }
      
      // Read the file as an array buffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Convert ArrayBuffer to Uint8Array which can be safely passed through IPC
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Save the original file to the workspace
      const saveResult = await window.api.workspace.saveFile(
        result.path!,
        'input.xlsx',
        uint8Array
      )
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save file to workspace')
      }
      
      // Save initial metadata
      const metadata = {
        originalFileName: file.name,
        uploadTime: new Date().toISOString(),
        workspacePath: result.path
      }
      
      // Save metadata as JSON
      await window.api.workspace.saveFile(
        result.path!,
        'data.json',
        JSON.stringify(metadata, null, 2)
      )
      
      return saveResult.path!
    } catch (error: unknown) {
      console.error('Error creating workspace:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to create workspace: ${errorMessage}`)
      throw error
    }
  }

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
      
      // Create workspace and save file
      const workspaceFilePath = await createWorkspace(file)
      
      // Read the file using ExcelJS
      const workbook = new Excel.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)

      const sheetNames = workbook.worksheets.map(sheet => sheet.name)
      const firstSheet = workbook.worksheets[0]
      const columns: string[] = []

      // Get column names from the first row
      firstSheet.getRow(1).eachCell(cell => {
        if (cell.value) {
          columns.push(cell.value.toString())
        }
      })

      // Count total rows (excluding header)
      const totalRows = firstSheet.rowCount - 1

      // Set the Excel file with the workspace file path
      setExcelFile({
        fileName: file.name,
        filePath: workspaceFilePath,
        sheetNames,
        selectedSheet: sheetNames[0],
        websiteColumn: null,
        columns,
        totalRows,
        aiPrompts: []
      })

      setUploadStep('column-selection')
      setError(null)
      toast.success('File uploaded and workspace created')
    } catch (err: unknown) {
      console.error(err)
      let errorMessage = 'Failed to read Excel file. Please make sure it is a valid .xlsx file.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [setExcelFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: loading
  })

  const handleWebsiteColumnSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateExcelFile({ websiteColumn: e.target.value })
  }

  const handleAddPrompt = () => {
    if (newPrompt.columnName.trim() && newPrompt.prompt.trim()) {
      addAiPrompt(newPrompt)
      setNewPrompt({ columnName: '', prompt: '' })
    }
  }

  const startProcessing = () => {
    if (excelFile?.websiteColumn) {
      setCurrentScreen('processing')
    } else {
      setError('Please select a website column before proceeding.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-8 gap-6">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Glintify AI Workspace</h1>
        <p className="text-xl text-slate-500">Enrich your Excel data with AI and website insights.</p>
        
        {/* Browser launch button */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={handleLaunchBrowser}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Chrome size={18} />
            Open Browser
          </Button>
        </div>
      </header>

      {uploadStep === 'initial' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-lg p-12 w-full max-w-2xl mx-auto
              flex flex-col items-center justify-center space-y-4 cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet size={64} className="text-slate-400" />
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                {isDragActive 
                  ? 'Drop the Excel file here' 
                  : loading 
                    ? 'Processing...' 
                    : 'Drag & drop an Excel file here, or click to browse'
                }
              </p>
              <p className="text-sm text-slate-500">Supports .xlsx and .xls files</p>
            </div>
            <Button variant="default" className="mt-4" onClick={(e) => e.stopPropagation()} disabled={loading}>
              <Upload size={18} className="mr-2" /> Upload Excel File
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <Info size={18} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {uploadStep === 'column-selection' && excelFile && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">File Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Filename</p>
                <p className="font-medium">{excelFile.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sheet</p>
                <p className="font-medium">{excelFile.selectedSheet}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="font-medium">{excelFile.totalRows}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Columns</p>
                <p className="font-medium">{excelFile.columns.length}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Select the website column
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={excelFile.websiteColumn || ''}
                onChange={handleWebsiteColumnSelect}
              >
                <option value="">Select column</option>
                {excelFile.columns.map((column, index) => (
                  <option key={index} value={column}>{column}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose the column that contains website URLs or names
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setUploadStep('initial')}>
                Back
              </Button>
              <Button 
                onClick={() => setUploadStep('ai-prompts')}
                disabled={!excelFile.websiteColumn}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {uploadStep === 'ai-prompts' && excelFile && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Configure AI Prompts</h2>
            
            <p className="mb-4 text-sm text-gray-600">
              Add columns and AI prompts to extract specific information from websites.
            </p>

            {/* AI prompts table */}
            <div className="mb-6">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="font-medium">AI Prompts</h3>
              </div>

              {excelFile.aiPrompts.length > 0 ? (
                <div className="border rounded-md overflow-hidden mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Prompt</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {excelFile.aiPrompts.map((prompt, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{prompt.columnName}</td>
                          <td className="px-4 py-3 text-sm">{prompt.prompt}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => useAppStore.getState().removeAiPrompt(index)}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-md mb-4">
                  <p className="text-gray-500">No AI prompts added yet. Add at least one prompt below.</p>
                </div>
              )}

              {/* Add new prompt form */}
              <div className="grid grid-cols-12 gap-4 mb-2">
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="New Column Name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPrompt.columnName}
                    onChange={(e) => setNewPrompt({ ...newPrompt, columnName: e.target.value })}
                  />
                </div>
                <div className="col-span-7">
                  <input
                    type="text"
                    placeholder="AI Prompt for this column"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    className="w-full"
                    size="icon"
                    onClick={handleAddPrompt}
                    disabled={!newPrompt.columnName || !newPrompt.prompt}
                  >
                    <PlusCircle size={18} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Example: Column Name "Product Description", Prompt "Generate a detailed product description based on the website content"</p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setUploadStep('column-selection')}>
                Back
              </Button>
              <Button 
                onClick={startProcessing}
                disabled={excelFile.aiPrompts.length === 0}
              >
                Start Enrichment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeScreen 