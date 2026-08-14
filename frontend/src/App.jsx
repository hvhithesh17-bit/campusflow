import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import Attendance from './pages/Attendance'
import Assignments from './pages/Assignments'
import Sgpa from './pages/Sgpa'
import StudyPlanner from './pages/StudyPlanner'

const Placeholder = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p>This page is under construction.</p>
  </div>
)

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'subjects':
        return <Subjects />
      case 'attendance':
        return <Attendance />
      case 'assignments':
        return <Assignments />
      case 'studyPlanner':
        return <StudyPlanner />
      case 'sgpa':
        return <Sgpa />
      case 'profile':
        return <Placeholder title="Profile" />
      default:
        return <Placeholder title="Not Found" />
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="main-content">
        <Header
          pageTitle={currentPage}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App