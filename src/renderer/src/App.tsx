import { useAppStore } from './lib/store'
import HomeScreen from './screens/HomeScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import ResultsScreen from './screens/ResultsScreen'
import { Toaster } from 'react-hot-toast'

function App(): React.JSX.Element {
  const currentScreen = useAppStore((state) => state.currentScreen)

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'processing' && <ProcessingScreen />}
      {currentScreen === 'results' && <ResultsScreen />}
      
      <Toaster position="top-right" />
    </div>
  )
}

export default App
