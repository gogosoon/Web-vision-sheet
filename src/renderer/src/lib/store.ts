import { create } from 'zustand'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface AiPrompt {
  columnName: string
  prompt: string
}

interface ExcelFile {
  fileName: string
  filePath: string
  sheetNames: string[]
  selectedSheet: string
  websiteColumn: string | null
  columns: string[]
  totalRows: number
  aiPrompts: AiPrompt[]
}

export interface ProcessingStats {
  currentStep: 'idle' | 'taking-screenshots' | 'processing-screenshots' | 'saving-results' | 'completed' | 'error'
  currentRowIndex: number
  totalRows: number
  currentLogMessage: string
  logs: string[]
  error: string | null
  enrichedFilePath: string | null
}

interface AppState {
  // App state
  currentScreen: 'home' | 'processing' | 'results'
  
  // File state
  excelFile: ExcelFile | null
  processingStats: ProcessingStats
  
  // Actions
  setCurrentScreen: (screen: 'home' | 'processing' | 'results') => void
  setExcelFile: (file: ExcelFile | null) => void
  updateExcelFile: (partialFile: Partial<ExcelFile>) => void
  updateProcessingStats: (stats: Partial<ProcessingStats>) => void
  addAiPrompt: (prompt: AiPrompt) => void
  removeAiPrompt: (index: number) => void
  updateAiPrompt: (index: number, prompt: Partial<AiPrompt>) => void
  resetState: () => void
  getWorkspacePath: () => string
}

// Default processing stats
const defaultProcessingStats: ProcessingStats = {
  currentStep: 'idle',
  currentRowIndex: 0,
  totalRows: 0,
  currentLogMessage: '',
  logs: [],
  error: null,
  enrichedFilePath: null
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentScreen: 'home',
  excelFile: null,
  processingStats: defaultProcessingStats,
  
  // Actions
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  
  setExcelFile: (file) => set({ excelFile: file }),
  
  updateExcelFile: (partialFile) => 
    set((state) => ({
      excelFile: state.excelFile ? { ...state.excelFile, ...partialFile } : null
    })),
  
  updateProcessingStats: (stats) => 
    set((state) => ({
      processingStats: { ...state.processingStats, ...stats }
    })),
  
  addAiPrompt: (prompt) => 
    set((state) => ({
      excelFile: state.excelFile 
        ? { 
            ...state.excelFile, 
            aiPrompts: [...state.excelFile.aiPrompts, prompt] 
          } 
        : null
    })),
  
  removeAiPrompt: (index) => 
    set((state) => ({
      excelFile: state.excelFile 
        ? { 
            ...state.excelFile, 
            aiPrompts: state.excelFile.aiPrompts.filter((_, i) => i !== index) 
          } 
        : null
    })),
  
  updateAiPrompt: (index, prompt) => 
    set((state) => ({
      excelFile: state.excelFile 
        ? { 
            ...state.excelFile, 
            aiPrompts: state.excelFile.aiPrompts.map((p, i) => 
              i === index ? { ...p, ...prompt } : p
            ) 
          } 
        : null
    })),
  
  resetState: () => set({
    currentScreen: 'home',
    excelFile: null,
    processingStats: defaultProcessingStats
  }),
  
  getWorkspacePath: () => {
    const documentsPath = path.join(os.homedir(), 'Documents')
    const workspacePath = path.join(documentsPath, 'Glintify Workspace')
    
    // Ensure the workspace directory exists
    if (!fs.existsSync(workspacePath)) {
      try {
        fs.mkdirSync(workspacePath, { recursive: true })
      } catch (error) {
        console.error('Failed to create workspace directory:', error)
      }
    }
    
    return workspacePath
  }
})) 