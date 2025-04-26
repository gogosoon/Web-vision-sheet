import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/button'
import { Terminal, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
// import { ExcelService } from '@/lib/excelService' // Removed: Logic moved to main process
import { toast } from 'react-hot-toast'
import type { ProcessingStats } from '@/lib/store'

// Removed the old processExcelFile function

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const progressPercentage = Math.max(0, Math.min(100, progress)); // Clamp between 0 and 100
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  )
}

const ProcessingScreen: React.FC = () => {
  const { 
    processingStats, 
    updateProcessingStats, 
    setCurrentScreen, 
    excelFile, // Keep excelFile to display info if needed
    resetState // Add resetState if needed
  } = useAppStore()
  
  const [showLogs, setShowLogs] = useState(false)
  
  // Calculate overall progress (simplified, relies on main process providing accurate numbers)
  const calculateProgress = () => {
    const { currentStep, currentRowIndex, totalRows } = processingStats
    
    if (currentStep === 'idle' || currentStep === 'starting') return 0
    if (currentStep === 'completed') return 100
    if (currentStep === 'error') return processingStats.totalRows > 0 ? Math.min(99, Math.round((currentRowIndex / totalRows) * 100)) : 0; // Show progress up to error point
    
    // Basic progress based on rows processed
    if (totalRows > 0) {
      // Add 1 because currentRowIndex is 0-based
      return Math.min(99, Math.round(((currentRowIndex + 1) / totalRows) * 100))
    } 
    
    return 5; // Small progress indication while starting
  }
  
  // Format step name for display
  const formatStepName = (step: ProcessingStats['currentStep']) => {
    switch (step) {
      case 'starting': return 'Starting Process'
      case 'taking-screenshots': return 'Taking Screenshots'
      case 'processing-screenshots': return 'AI Processing'
      case 'saving-results': return 'Saving Results'
      case 'completed': return 'Completed Successfully'
      case 'error': return 'Error Occurred'
      default: return 'Initializing'
    }
  }

  // --- IPC Listener Effect ---
  useEffect(() => {
    // Ensure we only run this once and if we are on the processing screen
    let isMounted = true;
    if (processingStats.currentStep !== 'idle') {
      // Avoid re-starting if already processing (e.g., due to HMR)
      // Consider resetting state if re-entering this screen is possible
      console.log('Processing screen mounted, but processing already in progress or completed.');
      // If state indicates completion or error, maybe navigate away or show final status?
      return;
    }

    console.log('ProcessingScreen mounted, setting up IPC listeners and starting process.');
    
    // Initial state update
    updateProcessingStats({ 
      currentStep: 'starting', 
      currentLogMessage: 'Initializing processing... Please wait.', 
      logs: ['Initializing...']
    });

    // Handlers for IPC events
    const handleProgress = (stats: { currentRowIndex: number, totalRows: number, currentLogMessage: string }) => {
      if (!isMounted) return;
      console.log('IPC Progress:', stats);
      // Use functional update to merge logs safely
      updateProcessingStats(prevStats => ({ 
        currentStep: 'taking-screenshots', // Assume progress means taking screenshots for now
        currentRowIndex: stats.currentRowIndex,
        totalRows: stats.totalRows,
        currentLogMessage: stats.currentLogMessage,
        logs: [...prevStats.logs, stats.currentLogMessage] // Append new log
      }));
    };

    const handleComplete = (payload: { outputPath: string }) => {
      if (!isMounted) return;
      console.log('IPC Complete:', payload);
      toast.success('Processing completed successfully!');
      updateProcessingStats(prevStats => ({ 
        currentStep: 'completed',
        enrichedFilePath: payload.outputPath,
        currentLogMessage: `Processing finished. Enriched file saved to: ${payload.outputPath}`,
        logs: [...prevStats.logs, `Success! Output: ${payload.outputPath}`] 
      }));
    };

    const handleError = (errorMessage: string) => {
      if (!isMounted) return;
      console.error('IPC Error:', errorMessage);
      toast.error(`Processing failed: ${errorMessage}`);
      updateProcessingStats(prevStats => ({ 
        currentStep: 'error',
        error: errorMessage,
        currentLogMessage: `Error: ${errorMessage}`,
        logs: [...prevStats.logs, `ERROR: ${errorMessage}`]
      }));
    };

    // Setup listeners
    const cleanupProgress = window.api.processing.onProgress(handleProgress);
    const cleanupComplete = window.api.processing.onComplete(handleComplete);
    const cleanupError = window.api.processing.onError(handleError);

    // Trigger the main process to start
    window.api.processing.start();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('ProcessingScreen unmounting, removing IPC listeners.');
      // It's generally safer to remove specific listeners
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      // Alternatively, if sure no other component uses these:
      // window.api.processing.removeAllListeners(); 
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Navigate to results or home based on state
  const handleFinish = () => {
    if (processingStats.currentStep === 'completed') {
      setCurrentScreen('results');
    } else {
      // Optionally reset state before going home on error/cancel
      // resetState(); 
      setCurrentScreen('home'); 
    }
  };

  // Function to open the output file directory
  const openOutputFolder = async () => {
      if (processingStats.enrichedFilePath) {
          try {
              const dirPath = await window.api.path.dirname(processingStats.enrichedFilePath);
              await window.api.shell.openFolder(dirPath);
          } catch (err) {
              console.error('Failed to open output folder:', err);
              toast.error('Could not open output folder.');
          }
      }
  };

  const progress = calculateProgress()
  const currentStatusText = formatStepName(processingStats.currentStep)

  return (
    <div className="flex flex-col min-h-screen p-8 bg-gray-50">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Processing Excel File</h1>
        {excelFile && (
          <p className="text-lg text-slate-600 truncate" title={excelFile.fileName}>
            Processing: {excelFile.fileName}
          </p>
        )}
      </header>

      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-full">
          {/* Status and Progress Bar */}
          <div className="text-center mb-6">
             <div className="flex items-center justify-center gap-2 mb-2">
                {processingStats.currentStep === 'completed' && <CheckCircle className="text-green-500" size={24} />}
                {processingStats.currentStep === 'error' && <XCircle className="text-red-500" size={24} />}
                {processingStats.currentStep !== 'completed' && processingStats.currentStep !== 'error' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                )}
                <p className="text-xl font-semibold text-gray-700">{currentStatusText}</p>
             </div>
             {processingStats.currentStep !== 'completed' && processingStats.currentStep !== 'error' && (
                <p className="text-sm text-slate-500 truncate" title={processingStats.currentLogMessage}>
                    {processingStats.currentLogMessage}
                </p>
             )}
             {processingStats.currentStep === 'completed' && (
                 <p className="text-sm text-green-600">Processing finished successfully!</p>
             )}
             {processingStats.currentStep === 'error' && (
                 <p className="text-sm text-red-600 truncate" title={processingStats.error || 'An unknown error occurred'}>
                    Error: {processingStats.error || 'An unknown error occurred'}
                 </p>
             )}
          </div>

          <ProgressBar progress={progress} />
          {processingStats.currentStep !== 'completed' && processingStats.currentStep !== 'error' && processingStats.totalRows > 0 && (
            <p className="text-center text-sm text-slate-500 mt-2">
              {`Row ${processingStats.currentRowIndex + 1} of ${processingStats.totalRows}`}
            </p>
          )}

          {/* Log Viewer */}
          <div className="mt-8">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 w-full py-2 border-t border-b"
            >
              <Terminal size={16} className="mr-2" />
              {showLogs ? 'Hide Logs' : 'Show Logs'}
              {showLogs ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>
            {showLogs && (
              <div className="mt-4 p-4 bg-gray-800 text-gray-200 rounded-md max-h-60 overflow-y-auto text-xs font-mono">
                {processingStats.logs.map((log, index) => (
                  <p key={index} className={log.startsWith('ERROR:') ? 'text-red-400' : log.startsWith('Success!') ? 'text-green-400' : ''}>
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(processingStats.currentStep === 'completed' || processingStats.currentStep === 'error') && (
              <div className="mt-8 flex justify-center gap-4">
                   <Button variant="outline" onClick={handleFinish}>
                       {processingStats.currentStep === 'completed' ? 'Go to Results' : 'Back to Home'}
                   </Button>
                   {processingStats.enrichedFilePath && (
                       <Button variant="default" onClick={openOutputFolder}>
                            Open Output Folder
                       </Button>
                   )}
              </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 mt-auto pt-4">
          Glintify v1.0 - Electron & React
      </footer>
    </div>
  )
}

export default ProcessingScreen 