import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/button'
import { Download, FolderOpen, RotateCcw, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ResultsScreen: React.FC = () => {
  const { processingStats, excelFile, resetState, setCurrentScreen } = useAppStore()
  const [loading, setLoading] = useState(false)
  
  const handleDownload = async () => {
    if (!processingStats.enrichedFilePath) {
      toast.error("No enriched file available")
      return
    }
    
    try {
      setLoading(true)
      // Get the workspace path and enriched file name
      const workspacePath = await window.api.path.dirname(processingStats.enrichedFilePath)
      const fileName = await window.api.path.basename(processingStats.enrichedFilePath)
      
      // Set up save dialog default path
      const documentsPath = await window.api.app.getWorkspacePath()
      const defaultPath = await window.api.path.join(documentsPath, fileName)
      
      // Show the save dialog
      const savePath = await window.api.dialog.saveFile({
        defaultPath,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      })
      
      if (savePath) {
        // Copy the file
        const result = await window.api.file.copyFile(processingStats.enrichedFilePath, savePath)
        
        if (result.success) {
          toast.success('File saved successfully')
        } else {
          toast.error(`Failed to save file: ${result.error}`)
        }
      }
    } catch (error: unknown) {
      console.error('Error saving file:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to save file: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenFolder = async () => {
    try {
      setLoading(true)
      if (processingStats.enrichedFilePath) {
        // Open the folder containing the enriched file
        const workspacePath = await window.api.path.dirname(processingStats.enrichedFilePath)
        await window.api.shell.openFolder(workspacePath)
        toast.success('Opening workspace folder')
      } else {
        // Fallback to the general workspace folder
        const workspacePath = await window.api.app.getWorkspacePath()
        await window.api.shell.openFolder(workspacePath)
        toast.success('Opening general workspace folder')
      }
    } catch (error: unknown) {
      console.error('Error opening folder:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to open folder: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleStartNew = () => {
    resetState()
    setCurrentScreen('home')
    toast.success('Ready for new enrichment')
  }
  
  return (
    <div className="flex flex-col min-h-screen p-8">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Enrichment Complete!</h1>
        <p className="text-xl text-gray-500">Your data has been successfully processed</p>
      </header>
      
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={40} />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center mb-6">
            Successfully enriched {excelFile?.fileName}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Original Rows</p>
              <p className="font-medium">{excelFile?.totalRows || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">AI Prompts Applied</p>
              <p className="font-medium">{excelFile?.aiPrompts?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enriched Columns</p>
              <p className="font-medium">{excelFile?.aiPrompts?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Taken</p>
              <p className="font-medium">-</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="flex items-center justify-center gap-2"
              onClick={handleDownload}
              disabled={loading || !processingStats.enrichedFilePath}
            >
              <Download size={18} />
              Download Excel
            </Button>
            
            <Button 
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={handleOpenFolder}
              disabled={loading}
            >
              <FolderOpen size={18} />
              Open Workspace
            </Button>
            
            <Button
              variant="secondary"
              className="flex items-center justify-center gap-2"
              onClick={handleStartNew}
              disabled={loading}
            >
              <RotateCcw size={18} />
              New Enrichment
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4">AI Prompts Applied</h3>
          
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Prompt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excelFile?.aiPrompts?.map((prompt, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {prompt.columnName}
                    </td>
                    <td className="px-4 py-3 text-sm">{prompt.prompt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsScreen 