import React from 'react';
import { UserProfile } from './UserProfile';
import { useAppStore } from '@renderer/lib/store';

interface BaseWrapperProps {
  children: React.ReactNode;
}

const BaseWrapper: React.FC<BaseWrapperProps> = ({ children }) => {
    const { currentScreen, auth } = useAppStore()
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-400">Glintify.io</h1>
        {auth.authenticated && (
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-4 flex-shrink-0">
          <UserProfile />
        </div>
      )}
        {/* Potentially add user profile/logout button here if needed */}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 flex flex-col items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-400 border-t border-gray-700">
        © {new Date().getFullYear()} Glintify.io. All rights reserved.
      </footer>
    </div>
  );
};

export default BaseWrapper; 