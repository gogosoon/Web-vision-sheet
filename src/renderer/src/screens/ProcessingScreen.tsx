import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/button'
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { ExcelService } from '@/lib/excelService'
import { WebService } from '@/lib/webService'
import { AiService } from '@/lib/aiService'
import path from 'path'
import * as fs from 'fs'

// The actual processing function that combines all our services
const processExcelFile = async (
  updateStats: (stats: any) => void, 
  excelFilePath: string,
  websiteColumnName: string,
  aiPrompts: Array<{ columnName: string, prompt: string }>,
  workspacePath: string
) => {
  try {
    // Create directories for screenshots and output
    const screenshotsDir = path.join(workspacePath, 'screenshots')
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = path.basename(excelFilePath)
    const outputFilePath = path.join(workspacePath, `enriched-${timestamp}-${fileName}`)
    
    // Step 1: Initialize processing
    updateStats({ 
      currentStep: 'taking-screenshots',
      currentLogMessage: 'Starting to process Excel file...',
      logs: ['Starting to process Excel file...']
    })
    
    // In a real app, this would use ExcelService to process the file
    // But for now, we'll just simulate the steps
    
    // Step 2: Take screenshots for each row
    // (Mocked - would use WebService in a real app)
    updateStats({ 
      currentStep: 'taking-screenshots',
      currentLogMessage: 'Taking screenshots of websites...'
    })
    
    // Simulate processing rows
    for (let i = 0; i < 10; i++) {
      updateStats({ 
        currentRowIndex: i,
        currentLogMessage: `Taking screenshot for row ${i+1}...`
      })
      
      // Add log entry
      updateStats((prevStats) => ({
        logs: [...prevStats.logs, `Taking screenshot for row ${i+1}...`]
      }))
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Step 3: Process screenshots with AI
    updateStats({ 
      currentStep: 'processing-screenshots',
      currentRowIndex: 0,
      currentLogMessage: 'Processing screenshots with AI...',
    })
    
    updateStats((prevStats) => ({
      logs: [...prevStats.logs, 'Processing screenshots with AI...']
    }))
    
    for (let i = 0; i < 10; i++) {
      updateStats({ 
        currentRowIndex: i,
        currentLogMessage: `Processing AI analysis for row ${i+1}...`
      })
      
      // Add log entry for each prompt
      aiPrompts.forEach(prompt => {
        updateStats((prevStats) => ({
          logs: [...prevStats.logs, `Applying prompt "${prompt.prompt}" to row ${i+1}...`]
        }))
      })
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    // Step 4: Save results
    updateStats({ 
      currentStep: 'saving-results',
      currentLogMessage: 'Saving enriched Excel file...'
    })
    
    // Add log entry for saving
    updateStats((prevStats) => ({
      logs: [...prevStats.logs, 'Saving enriched Excel file...']
    }))
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Step 5: Completed
    updateStats({ 
      currentStep: 'completed',
      currentLogMessage: 'Enrichment completed successfully!',
      enrichedFilePath: outputFilePath
    })
    
    // Add final log entry
    updateStats((prevStats) => ({
      logs: [...prevStats.logs, 'Enrichment completed successfully!']
    }))
    
    return outputFilePath
  } catch (error: unknown) {
    console.error('Processing error:', error)
    
    // Update state with error
    updateStats({ 
      currentStep: 'error',
      currentLogMessage: 'An error occurred during processing'
    })
    
    // Extract error message based on type
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Update error message
    updateStats({ error: errorMessage })
    
    // Add error to logs
    updateStats((prevStats) => ({
      logs: [...prevStats.logs, `ERROR: ${errorMessage}`]
    }))
    
    return null
  }
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

const ProcessingScreen: React.FC = () => {
  const { processingStats, updateProcessingStats, setCurrentScreen, excelFile } = useAppStore()
  const [showLogs, setShowLogs] = useState(false)
  
  // Calculate overall progress
  const calculateProgress = () => {
    const { currentStep, currentRowIndex, totalRows } = processingStats
    
    if (currentStep === 'idle') return 0
    if (currentStep === 'completed') return 100
    
    const stepsWeight = {
      'taking-screenshots': 0.4,
      'processing-screenshots': 0.5,
      'saving-results': 0.1
    }
    
    let progress = 0
    
    if (currentStep === 'taking-screenshots') {
      // Progress within screenshot taking step
      const stepProgress = (currentRowIndex / totalRows) * 100
      progress = stepProgress * stepsWeight['taking-screenshots']
    } else if (currentStep === 'processing-screenshots') {
      // Screenshot taking completed + progress within AI processing
      const stepProgress = (currentRowIndex / totalRows) * 100
      progress = 
        100 * stepsWeight['taking-screenshots'] + 
        stepProgress * stepsWeight['processing-screenshots']
    } else if (currentStep === 'saving-results') {
      // Screenshot taking and AI processing completed + 50% of saving
      progress = 
        100 * stepsWeight['taking-screenshots'] + 
        100 * stepsWeight['processing-screenshots'] + 
        50 * stepsWeight['saving-results']
    }
    
    return Math.min(Math.round(progress), 99) // Cap at 99% until fully complete
  }
  
  // Format step name for display
  const formatStepName = (step: string) => {
    switch (step) {
      case 'taking-screenshots': return 'Taking Screenshots'
      case 'processing-screenshots': return 'AI Processing'
      case 'saving-results': return 'Saving Results'
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      default: return 'Preparing'
    }
  }
  
  // Start processing on component mount
  useEffect(() => {
    const startProcessing = async () => {
      if (excelFile && processingStats.currentStep === 'idle') {
        // Get workspace path
        const workspacePath = await window.api.app.getWorkspacePath()
        
        // Start processing
        await processExcelFile(
          (stats) => {
            if (typeof stats === 'function') {
              updateProcessingStats((prevStats) => stats(prevStats))
            } else {
              updateProcessingStats(stats)
            }
          },
          excelFile.filePath,
          excelFile.websiteColumn!,
          excelFile.aiPrompts,
          workspacePath
        )
      }
    }
    
    startProcessing()
  }, [])
  
  const handleComplete = () => {
    setCurrentScreen('results')
  }
  
  return (
    <div className="flex flex-col min-h-screen p-8">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Processing</h1>
        <p className="text-xl text-gray-500">Enriching data with AI and web insights</p>
      </header>
      
      <div className="max-w-3xl mx-auto w-full bg-white p-8 rounded-lg shadow-sm border">
        {/* Progress info */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-xl font-semibold">
                {formatStepName(processingStats.currentStep)}
              </h2>
              <p className="text-gray-500">
                {processingStats.currentStep !== 'completed' && processingStats.currentStep !== 'error' && 
                  `Row ${processingStats.currentRowIndex + 1} of ${processingStats.totalRows}`
                }
              </p>
            </div>
            <div className="text-3xl font-bold">
              {calculateProgress()}%
            </div>
          </div>
          
          <ProgressBar progress={calculateProgress()} />
          
          <p className="mt-4 text-gray-600">
            {processingStats.currentLogMessage}
          </p>
        </div>
        
        {/* Logs panel */}
        <div className="border rounded-lg overflow-hidden">
          <button 
            className="w-full p-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200 text-left"
            onClick={() => setShowLogs(!showLogs)}
          >
            <div className="flex items-center">
              <Terminal size={18} className="mr-2" />
              <span className="font-medium">Logs</span>
            </div>
            {showLogs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showLogs && (
            <div className="p-4 max-h-72 overflow-y-auto bg-black text-green-400 font-mono text-sm">
              {processingStats.logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        {processingStats.currentStep === 'completed' && (
          <div className="mt-8 flex justify-end">
            <Button onClick={handleComplete}>
              View Results
            </Button>
          </div>
        )}
        
        {processingStats.currentStep === 'error' && (
          <div className="mt-8">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Error</h3>
              <p>{processingStats.error}</p>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={() => setCurrentScreen('home')}
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcessingScreen 