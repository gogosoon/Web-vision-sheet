import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AiPrompt {
  columnName: string
  prompt: string
}

interface ExcelFile {
  fileName: string
  filePath: string
  workspacePath: string | null
  sheetNames: string[]
  selectedSheet: string
  websiteColumn: string | null
  columns: string[]
  totalRows: number
  aiPrompts: AiPrompt[]
}

export interface ProcessingStats {
  currentStep:
    | 'idle'
    | 'starting'
    | 'taking-screenshots'
    | 'processing-screenshots'
    | 'saving-results'
    | 'completed'
    | 'error'
  currentRowIndex: number
  totalRows: number
  currentLogMessage: string
  logs: string[]
  error: string | null
  enrichedFilePath: string | null
}

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  credits: number
}

export interface AuthState {
  authenticated: boolean
  token: string | null
  user: User | null
  error: string | null
  isLoading: boolean
}

interface AppState {
  // App state
  currentScreen: 'home' | 'processing' | 'results' | 'login' | 'settings'

  // File state
  excelFile: ExcelFile | null
  processingStats: ProcessingStats

  // Actions
  setCurrentScreen: (screen: 'home' | 'processing' | 'results' | 'login' | 'settings') => void
  setExcelFile: (file: ExcelFile | null) => void
  updateExcelFile: (partialFile: Partial<ExcelFile>) => void
  updateProcessingStats: (
    stats: Partial<ProcessingStats> | ((prevStats: ProcessingStats) => Partial<ProcessingStats>)
  ) => void
  addAiPrompt: (prompt: AiPrompt) => void
  removeAiPrompt: (columnName: string) => void
  updateAiPrompt: (columnName: string, prompt: Partial<AiPrompt>) => void
  resetState: () => void
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

// Default auth state
const defaultAuthState: AuthState = {
  authenticated: false,
  token: null,
  user: null,
  error: null,
  isLoading: false
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentScreen: 'home',
      excelFile: null,
      processingStats: defaultProcessingStats,

      // Actions
      setCurrentScreen: (screen) => set({ currentScreen: screen }),

      setExcelFile: (file) =>
        set({
          excelFile: file,
          processingStats: defaultProcessingStats
        }),

      updateExcelFile: (partialFile) =>
        set((state) => ({
          excelFile: state.excelFile ? { ...state.excelFile, ...partialFile } : null
        })),

      updateProcessingStats: (statsUpdate) =>
        set((state) => ({
          processingStats:
            typeof statsUpdate === 'function'
              ? { ...state.processingStats, ...statsUpdate(state.processingStats) }
              : { ...state.processingStats, ...statsUpdate }
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

      removeAiPrompt: (columnName) =>
        set((state) => ({
          excelFile: state.excelFile
            ? {
                ...state.excelFile,
                aiPrompts: state.excelFile.aiPrompts.filter((p) => p.columnName !== columnName)
              }
            : null
        })),

      updateAiPrompt: (columnName, promptUpdate) =>
        set((state) => ({
          excelFile: state.excelFile
            ? {
                ...state.excelFile,
                aiPrompts: state.excelFile.aiPrompts.map((p) =>
                  p.columnName === columnName ? { ...p, ...promptUpdate } : p
                )
              }
            : null
        })),

      resetState: () =>
        set({
          currentScreen: 'home',
          excelFile: null,
          processingStats: defaultProcessingStats
        })
    }),
    {
      name: 'webvisionsheet-storage'
    }
  )
)
