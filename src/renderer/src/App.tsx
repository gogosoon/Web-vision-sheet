import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './lib/store'
import HomeScreen from './screens/HomeScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import ResultsScreen from './screens/ResultsScreen'
import { SettingScreen } from './screens/SettingScreen'

function App(): React.JSX.Element {
  const { currentScreen, auth } = useAppStore()
  
  // Check for existing token on startup
  useEffect(() => {
    const checkAuth = async () => {
      if (auth.token && !auth.authenticated) {
        // Attempt to validate the saved token
        try {
          // This will set authenticated = true if valid token
          await useAppStore.getState().login(auth.token)
        } catch (error) {
          // Token is invalid, the login function will handle errors
        }
      }
    }
    
    checkAuth()
  }, [auth.token])

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top bar with user profile */}
      {/* Main content */}
      <div className={`flex-1 overflow-auto ${auth.authenticated ? '' : ''}`}>
        {currentScreen === 'settings' && <SettingScreen />}
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'processing' && <ProcessingScreen />}
        {currentScreen === 'results' && <ResultsScreen />}
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
}

export default App
