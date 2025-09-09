import { useState } from 'react'
import MainLayout from './layout/MainLayout'
import Dashboard from './pages/Dashboard'
import LiveIntersection from './pages/LiveIntersection'
import About from './pages/About'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )
      case 'live-intersection':
        return <LiveIntersection />
      case 'about':
        return <About />
      default:
        return (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Mumbai STMS</h1>
            </div>
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-3 py-2 text-sm font-medium ${
                  currentPage === 'dashboard' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('live-intersection')}
                className={`px-3 py-2 text-sm font-medium ${
                  currentPage === 'live-intersection' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Live View
              </button>
              <button
                onClick={() => setCurrentPage('about')}
                className={`px-3 py-2 text-sm font-medium ${
                  currentPage === 'about' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                About
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {renderPage()}
    </div>
  )
}

export default App
