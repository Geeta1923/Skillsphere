import { useState } from 'react'
import Sidebar from '../components/common/Sidebar'
import Topbar from '../components/common/Topbar'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Area */}
      <div style={{
        ...styles.main,
        marginLeft: sidebarOpen ? '260px' : '0px',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-dark)',
    backgroundImage: `radial-gradient(at 0% 0%, rgba(108, 99, 255, 0.05) 0, transparent 50%), 
                      radial-gradient(at 50% 0%, rgba(0, 212, 255, 0.05) 0, transparent 50%)`,
    backgroundAttachment: 'fixed'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  content: {
    padding: '24px',
    flex: 1
  }
}

export default DashboardLayout