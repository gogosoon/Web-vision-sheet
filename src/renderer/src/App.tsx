import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './lib/store'
import HomeScreen from './screens/HomeScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import ResultsScreen from './screens/ResultsScreen'
import { SettingScreen } from './screens/SettingScreen'

function App(): React.JSX.Element {
  const { currentScreen } = useAppStore()

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top bar with user profile */}
      {/* Main content */}
      <div className={`flex-1 overflow-auto`}>
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
