import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const MySessions = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useSelector(state => state.auth)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/mentorship/my-sessions')
      setSessions(data.sessions)
    } catch (error) {
      toast.error('Failed to load sessions')
    }
    setLoading(false)
  }

  const handleComplete = async (id) => {
    try {
      await API.post(`/mentorship/complete/${id}`)
      toast.success('💰 Session completed and funds released to mentor!')
      fetchSessions()
    } catch (error) {
      toast.error('Failed to complete session')
    }
  }

  const startMeeting = (id) => {
    // Generate a unique room name for this specific session
    const roomName = `skillsphere_mentorship_${id}`
    window.open(`https://meet.jit.si/${roomName}`, '_blank')
    toast.success('🚀 Joining Mentorship Room...')
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div style={styles.container}>
      <header className="glass" style={styles.header}>
        <h1 style={styles.title}>📅 My Mentorship Sessions</h1>
        <p style={styles.subtitle}>Track your upcoming learning and coaching sessions.</p>
      </header>

      {loading ? (
        <div style={styles.loader}>Loading sessions...</div>
      ) : (
        <div style={styles.list}>
          {sessions.length === 0 ? (
            <div className="glass" style={styles.emptyState}>
              <h3>No sessions found</h3>
              <p>You haven't booked or hosted any mentorship sessions yet.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isMentor = session.mentor._id === user._id || session.mentor === user._id
              const otherUser = isMentor ? session.mentee : session.mentor

              return (
                <div key={session._id} className="glass" style={styles.sessionCard}>
                  <div style={styles.mainInfo}>
                    <div style={styles.userSection}>
                      <div style={styles.avatar}>
                        {otherUser?.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={styles.roleLabel}>{isMentor ? 'Mentee' : 'Mentor'}</p>
                        <h4 style={styles.userName}>{otherUser?.name}</h4>
                      </div>
                    </div>
                    
                    <div style={styles.topicSection}>
                      <p style={styles.topicLabel}>Topic</p>
                      <p style={styles.topicTitle}>{session.topic}</p>
                    </div>

                    <div style={styles.timeSection}>
                      <p style={styles.timeLabel}>Date & Time</p>
                      <p style={styles.timeValue}>
                        🗓️ {new Date(session.slot.date).toLocaleDateString()} at {session.slot.startTime}
                      </p>
                    </div>
                  </div>

                  <div style={styles.statusSection}>
                    <span style={{
                      ...styles.statusBadge,
                      background: session.status === 'confirmed' ? 'rgba(72,187,120,0.1)' : (session.status === 'completed' ? 'rgba(54,162,235,0.1)' : 'rgba(108,99,255,0.1)'),
                      color: session.status === 'confirmed' ? 'var(--success)' : (session.status === 'completed' ? 'var(--secondary)' : 'var(--primary)')
                    }}>
                      {session.status.toUpperCase()}
                    </span>
                    
                    {session.status === 'confirmed' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button 
                          className="btn-primary" 
                          style={styles.joinBtn}
                          onClick={() => startMeeting(session._id)}
                        >
                          📹 Join
                        </button>
                        {!isMentor && (
                          <button 
                            className="btn-primary" 
                            style={{ ...styles.joinBtn, background: 'var(--success)' }}
                            onClick={() => handleComplete(session._id)}
                          >
                            ✅ Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { padding: '30px', textAlign: 'center' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sessionCard: { 
    padding: '24px', display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', flexWrap: 'wrap', gap: '24px' 
  },
  mainInfo: { display: 'flex', gap: '40px', flex: 1, flexWrap: 'wrap' },
  userSection: { display: 'flex', gap: '12px', alignItems: 'center', minWidth: '180px' },
  avatar: { 
    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 
  },
  roleLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  userName: { fontSize: '16px', fontWeight: 600 },
  topicSection: { minWidth: '200px' },
  topicLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' },
  topicTitle: { fontSize: '15px', fontWeight: 500 },
  timeSection: { minWidth: '180px' },
  timeLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' },
  timeValue: { fontSize: '14px', fontWeight: 500 },
  statusSection: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 },
  joinBtn: { padding: '8px 16px', fontSize: '13px' },
  emptyState: { padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' },
  loader: { padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }
}

export default MySessions
