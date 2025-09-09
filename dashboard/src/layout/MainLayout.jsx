import { useState } from 'react';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Traffic Management System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a 
              href="#dashboard" 
              className="border-b-2 border-blue-500 px-1 py-4 text-sm font-medium text-blue-600"
            >
              Dashboard
            </a>
            <a 
              href="#analytics" 
              className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Analytics
            </a>
            <a 
              href="#settings" 
              className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Settings
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Smart Traffic Management System - Real-time Intersection Control
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;