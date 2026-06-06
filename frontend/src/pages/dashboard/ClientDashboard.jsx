import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ClientDashboard = () => {
  const { user } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMyGigs = async () => {
    try {
      const { data } = await API.get('/gigs/my/gigs')
      setGigs(data.gigs)
    } catch {
      toast.error('Failed to load gigs')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      fetchMyGigs()
    }
  }, [user])

  const handleDelete = async (gigId) => {
    if (!window.confirm('Delete this gig?')) return
    try {
      await API.delete(`/gigs/${gigId}`)
      setGigs(gigs.filter(g => g._id !== gigId))
      toast.success('Gig deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const statusColor = {
    open: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    in_progress: { bg: 'rgba(0,212,255,0.15)', color: '#00d4ff' },
    completed: { bg: 'rgba(108,99,255,0.15)', color: '#6c63ff' },
    cancelled: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181' }
  }

  const stats = [
    { icon: '📋', label: 'Total Gigs', value: gigs.length },
    { icon: '🟢', label: 'Open Gigs', value: gigs.filter(g => g.status === 'open').length },
    { icon: '⚡', label: 'In Progress', value: gigs.filter(g => g.status === 'in_progress').length },
    { icon: '✅', label: 'Completed', value: gigs.filter(g => g.status === 'completed').length },
  ]

  return (
    <div style={styles.container}>

      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h1 style={styles.welcomeText}>Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={styles.welcomeSub}>Manage your projects and find the best freelancers</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/create-gig')}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          + Post New Gig
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} className="glass" style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quick AI Matches */}
      <div style={{ marginTop: '24px' }}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🤖 Top AI Matches</h3>
          <button 
            onClick={() => navigate('/dashboard/aimatch')} 
            style={styles.postBtn}
          >
            View All
          </button>
        </div>
        <div className="glass" style={styles.aiBanner}>
          <div style={styles.aiInfo}>
            <p style={styles.aiTitle}>Find the perfect freelancer with SkillSphere AI</p>
            <p style={styles.aiSub}>Our algorithm analyzes skills, experience, and location to find the best talent.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/dashboard/aimatch')}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            🚀 Match Now
          </button>
        </div>
      </div>

      {/* My Gigs */}
      <div>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>My Posted Gigs</h3>
          <button
            onClick={() => navigate('/dashboard/create-gig')}
            style={styles.postBtn}
          >
            + Post Gig
          </button>
        </div>

        {loading ? (
          <div style={styles.center}>Loading...</div>
        ) : gigs.length === 0 ? (
          <div className="glass" style={styles.empty}>
            <p style={{ fontSize: '48px' }}>📭</p>
            <p style={{ fontSize: '18px', fontWeight: 600 }}>No gigs posted yet</p>
            <p style={{ color: 'var(--text-secondary)' }}>Post your first gig to find freelancers!</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/dashboard/create-gig')}
              style={{ width: 'auto', padding: '12px 24px', marginTop: '8px' }}
            >
              + Post New Gig
            </button>
          </div>
        ) : (
          <div style={styles.gigList}>
            {gigs.map(gig => (
              <div key={gig._id} className="glass" style={styles.gigCard}>
                <div style={styles.gigLeft}>
                  <div style={styles.gigHeader}>
                    <h4 style={styles.gigTitle}>{gig.title}</h4>
                    <span style={{
                      ...styles.statusBadge,
                      background: statusColor[gig.status]?.bg,
                      color: statusColor[gig.status]?.color
                    }}>
                      {gig.status}
                    </span>
                  </div>
                  <p style={styles.gigDesc}>
                    {gig.description.slice(0, 100)}...
                  </p>
                  <div style={styles.gigMeta}>
                    <span>💰 ₹{gig.budgetMin.toLocaleString()} – ₹{gig.budgetMax.toLocaleString()}</span>
                    <span>📋 {gig.proposalCount} proposals</span>
                    <span>👁 {gig.views} views</span>
                    <span>📅 {new Date(gig.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={styles.gigActions}>
                  <button
                    onClick={() => navigate(`/dashboard/gigs/${gig._id}`)}
                    style={styles.viewBtn}
                  >
                    👁 View
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/gigs/${gig._id}/proposals`)}
                    style={styles.proposalsBtn}
                  >
                    📋 Proposals ({gig.proposalCount})
                  </button>
                  <button
                    onClick={() => handleDelete(gig._id)}
                    style={styles.deleteBtn}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  banner: {
    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(108,99,255,0.1))',
    border: '1px solid rgba(0,212,255,0.3)', borderRadius: '16px',
    padding: '28px 32px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
  },
  welcomeText: { fontSize: '26px', fontWeight: 700, marginBottom: '8px' },
  welcomeSub: { color: 'var(--text-secondary)', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  statCard: {
    padding: '20px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '8px', textAlign: 'center'
  },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '32px', fontWeight: 700 },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600 },
  postBtn: {
    padding: '8px 16px', background: 'rgba(108,99,255,0.15)',
    border: '1px solid var(--primary)', borderRadius: '8px',
    color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  },
  center: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
  empty: {
    padding: '60px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
  },
  aiBanner: {
    padding: '24px 32px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,255,0.05))',
    border: '1px solid rgba(108,99,255,0.2)', marginBottom: '16px'
  },
  aiInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  aiTitle: { fontSize: '18px', fontWeight: 700, color: 'var(--primary)' },
  aiSub: { fontSize: '14px', color: 'var(--text-secondary)' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  gigCard: {
    padding: '20px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', gap: '20px'
  },
  gigLeft: { flex: 1 },
  gigHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  gigTitle: { fontSize: '16px', fontWeight: 600, flex: 1 },
  statusBadge: {
    padding: '4px 12px', borderRadius: '12px',
    fontSize: '12px', fontWeight: 600, textTransform: 'capitalize'
  },
  gigDesc: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' },
  gigMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' },
  gigActions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  viewBtn: {
    padding: '8px 16px', background: 'rgba(108,99,255,0.1)',
    border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px',
    color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  },
  proposalsBtn: {
    padding: '8px 16px', background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px',
    color: 'var(--secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  },
  deleteBtn: {
    padding: '8px 16px', background: 'rgba(252,129,129,0.1)',
    border: '1px solid rgba(252,129,129,0.3)', borderRadius: '8px',
    color: 'var(--error)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  }
}

export default ClientDashboard