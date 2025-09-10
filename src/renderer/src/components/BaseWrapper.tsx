import React from 'react';
import { UserProfile } from './UserProfile';
import { useAppStore } from '@renderer/lib/store';

interface BaseWrapperProps {
  children: React.ReactNode;
}

const BaseWrapper: React.FC<BaseWrapperProps> = ({ children }) => {
    const { currentScreen, auth } = useAppStore()
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-3 px-6 bg-white shadow-sm flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-indigo-600">webvisionsheet.com</h1>
          {/* <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">Desktop</span> */}
        </div>
        {auth.authenticated && (
          <UserProfile />
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-6 py-8 flex flex-col items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-2 px-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} webvisionsheet.com
      </footer>
    </div>
  );
};

export default BaseWrapper; 