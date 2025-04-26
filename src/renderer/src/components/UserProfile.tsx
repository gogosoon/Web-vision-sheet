import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { LogOut, RefreshCw, User } from 'lucide-react'
import toast from 'react-hot-toast'

export function UserProfile() {
  const { auth, logout, refreshUserProfile } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  if (!auth.authenticated || !auth.user) return null
  
  const fetchUserProfile = async () => {
    await refreshUserProfile()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchUserProfile()
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  },[])
  
  return (
    <div className="relative">
      {/* Profile button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
          {auth.user.name?.charAt(0)?.toUpperCase() || 
           auth.user.email?.charAt(0)?.toUpperCase() || 
           <User size={16} />}
        </div>
        <span className="text-sm font-medium">{auth.user.email}</span>
        <div className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {auth.user.credits} credits
        </div>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium">{auth.user.name || 'User'}</p>
            <p className="text-xs text-gray-500">{auth.user.email}</p>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Profile
          </button>
          
          <button 
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
} 