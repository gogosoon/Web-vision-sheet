import { useState, useEffect } from 'react'
import { useAppStore } from '../lib/store'
import { DESKTOP_LOGIN_URL } from '../lib/constants'

const LoginScreen = () => {
  const { auth, login } = useAppStore()
  const [manualToken, setManualToken] = useState('')
  
  // Function to open browser for login
  const handleBrowserLogin = async () => {
    window.api.auth.openBrowserLogin(DESKTOP_LOGIN_URL)
  }
  
  // Function to handle manual token submission
  const handleManualLogin = async () => {
    if (manualToken.trim()) {
      await login(manualToken.trim())
    }
  }
  
  // Listen for auth callback from main process
  useEffect(() => {
    // Set up callback handler
    const unsubscribe = window.api.auth.onAuthCallback((token) => {
      if (token) {
        login(token)
      }
    })
    
    // Clean up the event listener on unmount
    return () => {
      unsubscribe()
    }
  }, [login])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Glintify</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        
        {auth.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {auth.error}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleBrowserLogin}
            disabled={auth.isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {auth.isLoading ? 'Logging in...' : 'Login / Register'}
          </button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or enter token manually
              </span>
            </div>
          </div>
          
          <div>
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste your authentication token here"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={auth.isLoading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Please visit <a href="#" onClick={() => window.open(DESKTOP_LOGIN_URL, '_blank')} className="text-blue-500 underline cursor-pointer">
                {DESKTOP_LOGIN_URL.replace(/^https?:\/\//, '')}
              </a> to get your app token
            </p>
          </div>
          
          <button
            onClick={handleManualLogin}
            disabled={auth.isLoading || !manualToken.trim()}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {auth.isLoading ? 'Logging in...' : 'Login with Token'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen 