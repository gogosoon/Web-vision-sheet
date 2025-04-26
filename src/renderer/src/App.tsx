import { useEffect } from 'react'
import { useAppStore } from './lib/store'
import HomeScreen from './screens/HomeScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import ResultsScreen from './screens/ResultsScreen'
import LoginScreen from './screens/LoginScreen'
import { Toaster } from 'react-hot-toast'

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
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'processing' && <ProcessingScreen />}
      {currentScreen === 'results' && <ResultsScreen />}
      
      <Toaster position="top-right" />
    </div>
  )
}

export default App
