import { useState } from 'react'
import MainLayout from './layout/MainLayout'
import Dashboard from './pages/Dashboard'
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

  return renderPage()
}

export default App
