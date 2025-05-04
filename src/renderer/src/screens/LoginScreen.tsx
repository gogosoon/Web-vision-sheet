import { useState } from 'react'
import { useAppStore } from '../lib/store'
import { DESKTOP_LOGIN_URL } from '../lib/constants'
import BaseWrapper from '../components/BaseWrapper'

const LoginScreen = () => {
  const { auth, login } = useAppStore()
  const [manualToken, setManualToken] = useState('')
  
  // Function to handle manual token submission
  const handleManualLogin = async () => {
    if (manualToken.trim()) {
      await login(manualToken.trim())
    }
  }
  
  return (
    <BaseWrapper>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600">SpreadSheetFlow.com</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        
        {auth.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {auth.error}
          </div>
        )}
        
        <div className="space-y-4">
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
    </BaseWrapper>
  )
}

export default LoginScreen 