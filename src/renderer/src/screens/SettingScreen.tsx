import BaseWrapper from '@renderer/components/BaseWrapper'
import { Button } from '@renderer/components/button'
import { useAppStore } from '@renderer/lib/store'
import { getGoogleApiKey, setGoogleApiKey, removeGoogleApiKey } from '@renderer/lib/utils'
import { ArrowLeft, Key, Save, Eye, EyeOff } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export const SettingScreen = () => {
  const { setCurrentScreen } = useAppStore()
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = getGoogleApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid Google API key')
      return
    }

    setIsLoading(true)
    try {
      // Save to localStorage
      setGoogleApiKey(apiKey)
      toast.success('Google API key saved successfully!')
    } catch (error) {
      toast.error('Failed to save API key')
      console.error('Error saving API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearApiKey = () => {
    setApiKey('')
    removeGoogleApiKey()
    toast.success('Google API key cleared')
  }

  const goBack = () => {
    setCurrentScreen('home')
  }

  return (
    <BaseWrapper>
      <div className="w-full max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            onClick={goBack}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your API keys and preferences</p>
          </div>
        </div>

        {/* Google API Key Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Google API Key</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Enter your Google API key.
          </p>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google API key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleSaveApiKey}
                disabled={isLoading || !apiKey.trim()}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save API Key'}
              </Button>
              
              {apiKey && (
                <Button
                  variant="outline"
                  onClick={handleClearApiKey}
                  className="px-4"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-4 p-3 rounded-md border border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${apiKey ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-700">
                Status: {apiKey ? 'API key configured' : 'No API key configured'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseWrapper>
  )
}
