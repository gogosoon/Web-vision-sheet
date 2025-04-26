import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { VALIDATE_TOKEN_ENDPOINT } from './constants'

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
  currentStep: 'idle' | 'starting' | 'taking-screenshots' | 'processing-screenshots' | 'saving-results' | 'completed' | 'error'
  currentRowIndex: number
  totalRows: number
  currentLogMessage: string
  logs: string[]
  error: string | null
  enrichedFilePath: string | null
}

export interface AuthState {
  authenticated: boolean
  token: string | null
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  error: string | null
  isLoading: boolean
}

interface AppState {
  // App state
  currentScreen: 'home' | 'processing' | 'results' | 'login'
  
  // Auth state
  auth: AuthState
  
  // File state
  excelFile: ExcelFile | null
  processingStats: ProcessingStats
  
  // Actions
  setCurrentScreen: (screen: 'home' | 'processing' | 'results' | 'login') => void
  setExcelFile: (file: ExcelFile | null) => void
  updateExcelFile: (partialFile: Partial<ExcelFile>) => void
  updateProcessingStats: (stats: Partial<ProcessingStats> | ((prevStats: ProcessingStats) => Partial<ProcessingStats>)) => void
  addAiPrompt: (prompt: AiPrompt) => void
  removeAiPrompt: (columnName: string) => void
  updateAiPrompt: (columnName: string, prompt: Partial<AiPrompt>) => void
  resetState: () => void
  
  // Auth actions
  setAuth: (auth: Partial<AuthState>) => void
  login: (token: string) => Promise<void>
  logout: () => void
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
    (set, get) => ({
      // Initial state
      currentScreen: 'login',
      excelFile: null,
      processingStats: defaultProcessingStats,
      auth: defaultAuthState,
      
      // Actions
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      
      setExcelFile: (file) => set({ 
          excelFile: file, 
          processingStats: defaultProcessingStats 
      }),
      
      updateExcelFile: (partialFile) => 
        set((state) => ({
          excelFile: state.excelFile ? { ...state.excelFile, ...partialFile } : null
        })),
      
      updateProcessingStats: (statsUpdate) => 
        set((state) => ({
          processingStats: typeof statsUpdate === 'function' 
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
      
      resetState: () => set({
        currentScreen: 'home',
        excelFile: null,
        processingStats: defaultProcessingStats
      }),
      
      // Auth actions
      setAuth: (auth) => 
        set((state) => ({
          auth: { ...state.auth, ...auth }
        })),
        
      login: async (token) => {
        try {
          set((state) => ({ 
            auth: { ...state.auth, isLoading: true, error: null } 
          }))
          
          // Use IPC for network requests to avoid CSP issues
          const response = await window.api.auth.validateToken(token)
          
          if (!response.success) {
            throw new Error(response.error || 'Failed to validate token')
          }
          
          const userData = response.data.user
          
          set({
            auth: {
              authenticated: true,
              token,
              user: userData,
              error: null,
              isLoading: false
            },
            currentScreen: 'home'
          })
        } catch (error) {
          set((state) => ({
            auth: {
              ...state.auth,
              authenticated: false,
              token: null,
              user: null,
              error: error instanceof Error ? error.message : 'An unknown error occurred',
              isLoading: false
            }
          }))
        }
      },
      
      logout: () => {
        set({
          auth: defaultAuthState,
          currentScreen: 'login'
        })
      }
    }),
    {
      name: 'glintify-storage',
      partialize: (state) => ({ 
        auth: { token: state.auth.token }
      })
    }
  )
) 