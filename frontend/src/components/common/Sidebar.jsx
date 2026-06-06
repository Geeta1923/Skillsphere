import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { useTheme } from '../../context/ThemeContext'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const freelancerNav = [
  { path: '/dashboard', icon: '🏠', label: 'Overview' },
  { path: '/dashboard/profile', icon: '👤', label: 'My Profile' },
  { path: '/dashboard/gigs', icon: '🔍', label: 'Browse Gigs' },
  { path: '/dashboard/proposals', icon: '📋', label: 'My Proposals' },
  { path: '/dashboard/messages', icon: '💬', label: 'Messages' },
  { path: '/dashboard/earnings', icon: '💰', label: 'Earnings' },
  { path: '/dashboard/analytics', icon: '📊', label: 'Analytics' }, // ← add
  { path: '/dashboard/progress', icon: '📈', label: 'Progress Tracker' },
  { path: '/dashboard/reviews', icon: '⭐', label: 'Reviews' },
  { path: '/dashboard/disputes', icon: '⚖️', label: 'Disputes' },
  { path: '/dashboard/availability', icon: '📅', label: 'Availability' },
  { path: '/dashboard/skill-gap', icon: '🚀', label: 'Skill Gap Analysis' },
  { path: '/dashboard/interview', icon: '🎙️', label: 'AI Interview' },
  { path: '/dashboard/portfolio-architect', icon: '🏗️', label: 'Portfolio Architect' },
  { path: '/dashboard/mentors', icon: '🎓', label: 'Mentors' },
  { path: '/dashboard/mentorship-sessions', icon: '📅', label: 'My Sessions' },
]

const clientNav = [
  { path: '/dashboard', icon: '🏠', label: 'Overview' },
  { path: '/dashboard/create-gig', icon: '➕', label: 'Post a Gig' },
  { path: '/dashboard/gigs', icon: '📋', label: 'My Gigs' },
  { path: '/dashboard/payments', icon: '💳', label: 'Payments' }, // ← add
  { path: '/dashboard/messages', icon: '💬', label: 'Messages' },
  { path: '/dashboard/reviews', icon: '⭐', label: 'Reviews' },
  { path: '/dashboard/aimatch', icon: '🤖', label: 'AI Match' },
  { path: '/dashboard/progress', icon: '📊', label: 'Progress Tracker' },
  { path: '/dashboard/disputes', icon: '⚖️', label: 'Disputes' },
  { path: '/dashboard/mentors', icon: '🎓', label: 'Find a Mentor' },
  { path: '/dashboard/mentorship-sessions', icon: '📅', label: 'My Sessions' },
]
const adminNav = [
  { path: '/admin', icon: '📊', label: 'Overview' },
  { path: '/admin/users', icon: '👥', label: 'Manage Users' },
  { path: '/admin/gigs', icon: '📋', label: 'Manage Gigs' },
  { path: '/admin/payments', icon: '💰', label: 'Payments' },
  { path: '/admin/disputes', icon: '⚖️', label: 'Disputes' },
]

const Sidebar = ({ isOpen }) => {
  const { user } = useSelector((state) => state.auth)
  const { theme, toggleTheme } = useTheme()
  
  const navItems = user?.role === 'admin'
  ? adminNav
  : user?.role === 'freelancer'
  ? freelancerNav
  : clientNav // default to client if not freelancer/admin

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout')
      dispatch(logout())
      toast.success('Logged out!')
      navigate('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <div style={{
      ...styles.sidebar,
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    }}>
      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoIcon}>⚡</span>
        <span style={styles.logoText}>SkillSphere</span>
      </div>

      {/* User Info */}
      <div className="glass" style={styles.userCard}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={styles.userName}>{user?.name}</p>
         <p style={styles.userRole}>
  {user?.role === 'admin'
    ? '🛡️ Admin'
    : user?.role === 'freelancer'
    ? '🚀 Freelancer'
    : '💼 Client'}
</p>

        </div>
      </div>

      {/* Nav Links */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {})
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} style={styles.logoutBtn}>
        🚪 Logout
      </button>
    </div>
  )
}

const styles = {
  sidebar: {
    position: 'fixed',
    left: 0, top: 0, bottom: 0,
    width: '260px',
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    transition: 'transform 0.3s ease',
    zIndex: 100,
    overflowY: 'auto'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    paddingLeft: '8px'
  },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: 700, color: 'var(--primary)' },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    marginBottom: '24px'
  },
  avatar: {
    width: '42px', height: '42px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: 700, flexShrink: 0
  },
  userName: { fontWeight: 600, fontSize: '14px', marginBottom: '2px' },
  userRole: { fontSize: '12px', color: 'var(--text-secondary)' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px', borderRadius: '10px',
    color: 'var(--text-secondary)', textDecoration: 'none',
    fontSize: '14px', fontWeight: 500, transition: 'all 0.2s'
  },
  navItemActive: {
    background: 'rgba(108, 99, 255, 0.15)',
    color: 'var(--primary)',
    borderLeft: '3px solid var(--primary)'
  },
  navIcon: { fontSize: '18px' },
  logoutBtn: {
    marginTop: '16px', padding: '12px 16px',
    background: 'rgba(252, 129, 129, 0.1)',
    border: '1px solid rgba(252, 129, 129, 0.3)',
    borderRadius: '10px', color: 'var(--error)',
    cursor: 'pointer', fontSize: '14px',
    fontWeight: 500, textAlign: 'left',
    transition: 'all 0.2s'
  },
  themeBtn: {
    marginTop: 'auto', padding: '12px 16px',
    background: 'var(--bg-item)',
    border: '1px solid var(--border)',
    borderRadius: '10px', color: 'var(--text-primary)',
    cursor: 'pointer', fontSize: '14px',
    fontWeight: 500, textAlign: 'left',
    transition: 'all 0.2s'
  }
}

export default Sidebar