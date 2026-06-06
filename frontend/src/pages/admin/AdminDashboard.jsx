import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentGigs, setRecentGigs] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/admin/stats')
      setStats(data.stats)
      setRecentUsers(data.recentUsers)
      setRecentGigs(data.recentGigs)
      setCategoryStats(data.categoryStats)
    } catch (error) {
      toast.error('Failed to load stats')
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
      Loading dashboard...
    </div>
  )

  const statCards = [
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers, color: 'rgba(108,99,255,0.15)' },
    { icon: '🚀', label: 'Freelancers', value: stats?.totalFreelancers, color: 'rgba(0,212,255,0.15)' },
    { icon: '💼', label: 'Clients', value: stats?.totalClients, color: 'rgba(72,187,120,0.15)' },
    { icon: '📋', label: 'Total Gigs', value: stats?.totalGigs, color: 'rgba(255,193,7,0.15)' },
    { icon: '🟢', label: 'Open Gigs', value: stats?.openGigs, color: 'rgba(72,187,120,0.15)' },
    { icon: '✅', label: 'Completed', value: stats?.completedGigs, color: 'rgba(108,99,255,0.15)' },
    { icon: '💰', label: 'Revenue', value: `₹${stats?.platformRevenue?.toLocaleString()}`, color: 'rgba(72,187,120,0.15)' },
    { icon: '📈', label: 'Success Rate', value: `${stats?.successRate}%`, color: 'rgba(0,212,255,0.15)' },
    { icon: '🚩', label: 'Suspicious Gigs', value: stats?.suspiciousGigs || 0, color: 'rgba(252,129,129,0.15)' },
    { icon: '🚨', label: 'Fraud Reviews', value: stats?.suspiciousReviews || 0, color: 'rgba(252,129,129,0.15)' },
  ]

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚙️ Admin Dashboard</h2>
          <p style={styles.subtitle}>Platform overview and management</p>
        </div>
        <div style={styles.adminBadge}>🛡️ Admin Panel</div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <div key={i} className="glass" style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: card.color }}>
              {card.icon}
            </div>
            <p style={styles.statValue}>{card.value}</p>
            <p style={styles.statLabel}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.bottomGrid}>

        {/* Recent Users */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>👥 Recent Users</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user._id} style={styles.tr}>
                    <td style={styles.td}>{user.name}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        background: user.role === 'freelancer'
                          ? 'rgba(0,212,255,0.15)'
                          : user.role === 'admin'
                          ? 'rgba(252,129,129,0.15)'
                          : 'rgba(72,187,120,0.15)',
                        color: user.role === 'freelancer'
                          ? 'var(--secondary)'
                          : user.role === 'admin'
                          ? 'var(--error)'
                          : 'var(--success)'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusDot,
                        background: user.isActive
                          ? 'var(--success)' : 'var(--error)'
                      }} />
                      {user.isActive ? 'Active' : 'Suspended'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Revenue Trend</h3>
          <div style={styles.chartArea}>
            {stats?.revenueTrend?.length > 0 ? (
              <div style={styles.barChart}>
                {stats.revenueTrend.map((data, i) => {
                  const maxAmt = Math.max(...stats.revenueTrend.map(d => d.amount), 1);
                  return (
                    <div key={i} style={styles.barGroup}>
                      <div style={styles.barWrapper}>
                        <div style={{
                          ...styles.barFill,
                          height: `${(data.amount / maxAmt) * 100}%`
                        }}>
                          <span style={{ ...styles.barTooltip, opacity: 1 }}>₹{data.amount?.toLocaleString()}</span>
                        </div>
                      </div>
                      <span style={styles.barLabel}>{data._id}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={styles.empty}>No revenue data yet</p>
            )}
          </div>

          <h3 style={{ ...styles.sectionTitle, marginTop: '32px' }}>📈 Platform Success Rate</h3>
          <div style={styles.successTracker}>
            <div style={styles.progressCircle}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle 
                  cx="60" cy="60" r="54" fill="none" 
                  stroke="var(--primary)" strokeWidth="12" 
                  strokeDasharray={`${(stats?.successRate || 0) * 3.39}, 339`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="65" textAnchor="middle" style={styles.progressText}>
                  {stats?.successRate}%
                </text>
              </svg>
            </div>
            <div style={styles.successMeta}>
              <p style={styles.successHeading}>Work Success Ratio</p>
              <p style={styles.successSub}>{stats?.completedGigs || 0} Gigs successfully completed out of {stats?.totalGigs || 0} total gigs.</p>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>📊 Top Categories</h3>
          <div style={styles.catList}>
            {categoryStats.map((cat, i) => {
              const maxCount = categoryStats[0]?.count || 1
              return (
                <div key={i} style={styles.catItem}>
                  <span style={styles.catName}>{cat._id}</span>
                  <div style={styles.catBar}>
                    <div style={{
                      ...styles.catFill,
                      width: `${(cat.count / maxCount) * 100}%`
                    }} />
                  </div>
                  <span style={styles.catCount}>{cat.count}</span>
                </div>
              )
            })}
          </div>

          {/* Recent Gigs */}
          <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>
            📋 Recent Gigs
          </h3>
          <div style={styles.gigList}>
            {recentGigs.map(gig => (
              <div key={gig._id} style={styles.gigItem}>
                <div style={styles.gigInfo}>
                  <p style={styles.gigTitle}>
                    {gig.title}
                    {gig.isSuspicious && (
                      <span style={{ color: 'var(--error)', marginLeft: '8px', fontSize: '16px' }} title="Flagged as Suspicious">🚩</span>
                    )}
                  </p>
                  <p style={styles.gigMeta}>
                    by {gig.client?.name} ·{' '}
                    ₹{gig.budgetMax?.toLocaleString()}
                  </p>
                </div>
                <span style={{
                  ...styles.gigStatus,
                  background: gig.status === 'open'
                    ? 'rgba(72,187,120,0.15)' : 'rgba(108,99,255,0.15)',
                  color: gig.status === 'open'
                    ? 'var(--success)' : 'var(--primary)'
                }}>
                  {gig.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  adminBadge: { padding: '8px 16px', background: 'rgba(252,129,129,0.15)', border: '1px solid rgba(252,129,129,0.3)', borderRadius: '20px', color: 'var(--error)', fontSize: '13px', fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' },
  statCard: { padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
  statValue: { fontSize: '26px', fontWeight: 700 },
  statLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  section: { padding: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '16px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '12px', fontSize: '13px' },
  roleBadge: { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
  statusDot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px' },
  catList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  catItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  catName: { fontSize: '13px', width: '140px', flexShrink: 0 },
  catBar: { flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  catFill: { height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '3px' },
  catCount: { fontSize: '13px', fontWeight: 600, width: '24px', textAlign: 'right' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  gigItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' },
  gigInfo: {},
  gigTitle: { fontSize: '13px', fontWeight: 500, marginBottom: '2px' },
  gigMeta: { fontSize: '11px', color: 'var(--text-secondary)' },
  gigStatus: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', textTransform: 'capitalize', flexShrink: 0 },
  chartArea: { height: '180px', display: 'flex', alignItems: 'flex-end', padding: '10px 0' },
  barChart: { display: 'flex', gap: '20px', height: '100%', alignItems: 'flex-end', flex: 1, paddingBottom: '20px', borderBottom: '1px solid var(--border)' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' },
  barWrapper: { width: '30px', flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '4px 4px 0 0', position: 'relative', display: 'flex', alignItems: 'flex-end' },
  barFill: { width: '100%', background: 'linear-gradient(to top, var(--primary), var(--secondary))', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 1s ease-out' },
  barTooltip: { position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', padding: '2px 6px', whiteSpace: 'nowrap', transition: 'opacity 0.2s', pointerEvents: 'none' },
  barLabel: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' },
  successTracker: { display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' },
  progressCircle: { flexShrink: 0 },
  progressText: { fontSize: '20px', fontWeight: 700, fill: 'var(--text-primary)' },
  successMeta: { display: 'flex', flexDirection: 'column', gap: '4px' },
  successHeading: { fontSize: '16px', fontWeight: 600 },
  successSub: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }
}

export default AdminDashboard