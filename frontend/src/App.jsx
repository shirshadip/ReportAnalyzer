import { useState, useCallback } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import UploadForm from './components/UploadForm.jsx'
import './styles/app.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDataUploaded = useCallback(() => {
    setRefreshKey(k => k + 1)
    setActiveTab('dashboard')
  }, [])

  return (
    <div className="app-shell">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard key={refreshKey} />
        )}
        {activeTab === 'upload' && (
          <UploadForm onSuccess={handleDataUploaded} />
        )}
      </main>

      <footer className="app-footer">
        <span>Student Performance Analyzer</span>
        <span className="footer-dot">·</span>
        <span>Powered by FastAPI + Supabase + React</span>
      </footer>
    </div>
  )
}
