import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSocket } from '../../context/useSocket'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'

const Topbar = ({ onMenuClick }) => {
  const { user } = useSelector((state) => state.auth)
  const { theme, toggleTheme } = useTheme()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    const loadNotifications = async () => {
      await fetchNotifications()
    }
    loadNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })
    return () => socket.off('newNotification')
  }, [socket])

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  const handleMarkRead = async (notif) => {
    if (notif.isRead) return
    try {
      await API.put(`/notifications/${notif._id}/read`)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => 
        n._id === notif._id ? { ...n, isRead: true } : n
      ))
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const typeIcon = {
    new_proposal: '📋',
    proposal_accepted: '🎉',
    proposal_rejected: '❌',
    new_message: '💬',
    review_added: '⭐',
    payment_received: '💰',
    gig_hired: '💼'
  }

  return (
    <div style={styles.topbar}>
      <button onClick={onMenuClick} style={styles.menuBtn}>☰</button>
      <h2 style={styles.title}>
        {user?.role === 'admin'
          ? '⚙️ Admin Dashboard'
          : user?.role === 'client'
          ? 'Client Dashboard'
          : 'Freelancer Dashboard'}
      </h2>

      <div style={styles.right}>
        {/* Theme Toggle */}
        <div className="theme-toggle-container" onClick={toggleTheme}>
          <span className="theme-toggle-icon">🌙</span>
          <span className="theme-toggle-icon">☀️</span>
          <div className="theme-toggle-ball" />
        </div>

        {/* Notification Bell */}
        <div style={styles.bellWrapper}>
          <button
            style={styles.iconBtn}
            onClick={() => {
              setShowDropdown(!showDropdown)
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropHeader}>
                <span style={styles.dropTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
                    Mark all read
                  </button>
                )}
              </div>

              <div style={styles.notifList}>
                {notifications.length === 0 ? (
                  <p style={styles.noNotif}>No notifications yet</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif._id}
                      style={{
                        ...styles.notifItem,
                        background: notif.isRead
                          ? 'transparent'
                          : 'rgba(108,99,255,0.08)'
                      }}
                      onClick={() => {
                        handleMarkRead(notif)
                        if (notif.link) navigate(notif.link)
                        setShowDropdown(false)
                      }}
                    >
                      <span style={styles.notifIcon}>
                        {typeIcon[notif.type] || '🔔'}
                      </span>
                      <div style={styles.notifContent}>
                        <p style={styles.notifTitle}>{notif.title}</p>
                        <p style={styles.notifMsg}>{notif.message}</p>
                        <p style={styles.notifTime}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.isRead && <div style={styles.unreadDot} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

const styles = {
  topbar: {
    height: '64px', background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center',
    padding: '0 24px', gap: '16px',
    position: 'sticky', top: 0, zIndex: 99
  },
  menuBtn: {
    background: 'none', border: 'none',
    color: 'var(--text-primary)', fontSize: '22px',
    cursor: 'pointer', padding: '4px 8px', borderRadius: '6px'
  },
  title: { fontSize: '18px', fontWeight: 600, flex: 1 },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  bellWrapper: { position: 'relative' },
  iconBtn: {
    background: 'none', border: 'none',
    fontSize: '20px', cursor: 'pointer', position: 'relative'
  },
  badge: {
    position: 'absolute', top: '-6px', right: '-6px',
    background: 'var(--error)', color: 'white',
    borderRadius: '50%', width: '18px', height: '18px',
    fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dropdown: {
    position: 'absolute', top: '40px', right: '0',
    width: '320px', background: 'var(--bg-card)',
    border: '1px solid var(--border)', borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 999,
    overflow: 'hidden'
  },
  dropHeader: {
    padding: '14px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  dropTitle: { fontSize: '14px', fontWeight: 600 },
  markAllBtn: {
    background: 'none', border: 'none',
    color: 'var(--primary)', fontSize: '12px',
    cursor: 'pointer', fontWeight: 500
  },
  notifList: { maxHeight: '360px', overflowY: 'auto' },
  noNotif: {
    padding: '24px', textAlign: 'center',
    color: 'var(--text-secondary)', fontSize: '13px'
  },
  notifItem: {
    display: 'flex', gap: '12px', padding: '14px 16px',
    cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.2s', alignItems: 'flex-start'
  },
  notifIcon: { fontSize: '20px', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '2px' },
  notifMsg: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' },
  notifTime: { fontSize: '11px', color: 'var(--text-secondary)' },
  unreadDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--primary)', flexShrink: 0, marginTop: '4px'
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700
  }
}

export default Topbar