import { BarChart2, Upload, GraduationCap } from 'lucide-react'
import './Header.css'

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="brand-icon">
            <GraduationCap size={22} strokeWidth={2} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Student Performance</span>
            <span className="brand-sub">ANALYZER</span>
          </div>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} />
            <span>Upload / Add</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
