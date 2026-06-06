import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import StatCard from '../../components/common/StatCard'
import API from '../../utils/axios'

const FreelancerDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [trending, setTrending] = useState([])
  const [loadingAI, setLoadingAI] = useState(true)
  const [stats, setStats] = useState([
    { icon: '💼', label: 'Active Gigs', value: '0', color: 'rgba(108,99,255,0.15)' },
    { icon: '📋', label: 'Proposals Sent', value: '0', color: 'rgba(0,212,255,0.15)' },
    { icon: '💰', label: 'Total Earnings', value: '₹0', color: 'rgba(72,187,120,0.15)' },
    { icon: '⭐', label: 'Avg Rating', value: '0.0', color: 'rgba(255,193,7,0.15)' },
  ])

  const fetchAIData = async () => {
    try {
      const [recRes, trendRes, analyticsRes] = await Promise.all([
        API.get('/ai/recommendations'),
        API.get('/ai/trending'),
        API.get('/profile/analytics')
      ])
      setRecommendations(recRes.data.recommendations)
      setTrending(trendRes.data.trending)
      
      const anal = analyticsRes.data.analytics
      setStats([
        { icon: '💼', label: 'Active Gigs', value: anal.activeGigs || 0, color: 'rgba(108,99,255,0.15)' },
        { icon: '📋', label: 'Proposals Sent', value: anal.proposalStats?.total || 0, color: 'rgba(0,212,255,0.15)' },
        { icon: '💰', label: 'Total Earnings', value: `₹${(anal.totalEarnings || 0).toLocaleString()}`, color: 'rgba(72,187,120,0.15)' },
        { icon: '⭐', label: 'Avg Rating', value: anal.avgRating || '0.0', color: 'rgba(255,193,7,0.15)' },
      ])
    } catch (error) {
      console.error('AI fetch error:', error)
    }
    setLoadingAI(false)
  }

  useEffect(() => {
    if (user) {
      fetchAIData()
    }
  }, [user])

  return (
    <div style={styles.container}>

      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h1 style={styles.welcomeText}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={styles.welcomeSub}>
            Here's what's happening with your freelance work today.
          </p>
        </div>
        <div style={styles.bannerBadge}>🚀 Pro Freelancer</div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* AI Recommendations */}
      <div className="glass" style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>
              🤖 AI-Recommended Gigs
            </h3>
            <p style={styles.sectionSub}>
              Personalized matches based on your skills
            </p>
          </div>
          <span style={styles.aiBadge}>⚡ Powered by AI</span>
        </div>

        {loadingAI ? (
          <p style={styles.loading}>Finding best matches...</p>
        ) : recommendations.length === 0 ? (
          <p style={styles.empty}>
            Add skills to your profile to get AI recommendations!
          </p>
        ) : (
          <div style={styles.recGrid}>
            {recommendations.map((gig) => (
              <div
                key={gig._id}
                style={styles.recCard}
                onClick={() => navigate(`/dashboard/gigs/${gig._id}`)}
              >
                {/* Match Score Badge */}
                {gig.matchScore > 0 && (
                  <div style={styles.matchBadge}>
                    <span style={{
                      color: gig.matchScore >= 70
                        ? 'var(--success)'
                        : gig.matchScore >= 40
                        ? '#ffc107' : 'var(--text-secondary)'
                    }}>
                      {gig.matchScore}% match
                    </span>
                  </div>
                )}

                <p style={styles.recCategory}>{gig.category}</p>
                <p style={styles.recTitle}>{gig.title}</p>

                <div style={styles.recSkills}>
                  {gig.skillsRequired?.slice(0, 3).map((s, j) => (
                    <span key={j} style={styles.recSkillTag}>{s}</span>
                  ))}
                </div>

                <p style={styles.recBudget}>
                  ₹{gig.budgetMin?.toLocaleString()}
                  {' – '}
                  ₹{gig.budgetMax?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Skills */}
      <div style={styles.bottomGrid}>
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>🔥 Trending Skills</h3>
          <p style={styles.sectionSub}>Most in-demand skills right now</p>
          <div style={styles.trendingList}>
            {trending.map((item, i) => (
              <div key={i} style={styles.trendItem}>
                <span style={styles.trendRank}>#{i + 1}</span>
                <span style={styles.trendSkill}>{item.skill}</span>
                <div style={styles.trendBar}>
                  <div style={{
                    ...styles.trendFill,
                    width: `${(item.count / (trending[0]?.count || 1)) * 100}%`
                  }} />
                </div>
                <span style={styles.trendCount}>{item.count} gigs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>Profile Completion</h3>
          <div style={styles.completionList}>
            {[
              { label: 'Basic Info', done: true },
              { label: 'Skills Added', done: true },
              { label: 'Portfolio Upload', done: false },
              { label: 'Resume Upload', done: false },
              { label: 'Verify Email', done: false },
            ].map((item, i) => (
              <div key={i} style={styles.completionItem}>
                <span style={{
                  ...styles.completionDot,
                  background: item.done ? 'var(--success)' : 'var(--border)'
                }} />
                <span style={{
                  ...styles.completionLabel,
                  color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: item.done ? 'line-through' : 'none'
                }}>
                  {item.label}
                </span>
                {item.done
                  ? <span style={styles.doneTag}>✓</span>
                  : <span style={styles.pendingTag}>Pending</span>
                }
              </div>
            ))}
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
          <p style={styles.progressText}>40% Complete</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  banner: {
    background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))',
    border: '1px solid rgba(108,99,255,0.3)',
    borderRadius: '16px', padding: '28px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  welcomeText: { fontSize: '26px', fontWeight: 700, marginBottom: '8px' },
  welcomeSub: { color: 'var(--text-secondary)', fontSize: '14px' },
  bannerBadge: { background: 'rgba(108,99,255,0.2)', border: '1px solid var(--primary)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  section: { padding: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  sectionSub: { fontSize: '13px', color: 'var(--text-secondary)' },
  aiBadge: { padding: '4px 12px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 },
  loading: { color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' },
  empty: { color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' },
  recGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' },
  recCard: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  matchBadge: { position: 'absolute', top: '12px', right: '12px', fontSize: '12px', fontWeight: 600 },
  recCategory: { fontSize: '11px', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' },
  recTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.4, paddingRight: '60px' },
  recSkills: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' },
  recSkillTag: { fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(108,99,255,0.1)', color: 'var(--primary)' },
  recBudget: { fontSize: '13px', fontWeight: 600, color: 'var(--success)' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  trendingList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
  trendItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  trendRank: { fontSize: '12px', color: 'var(--text-secondary)', width: '24px', flexShrink: 0 },
  trendSkill: { fontSize: '13px', fontWeight: 500, width: '100px', flexShrink: 0 },
  trendBar: { flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  trendFill: { height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '3px' },
  trendCount: { fontSize: '12px', color: 'var(--text-secondary)', width: '50px', textAlign: 'right' },
  completionList: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' },
  completionItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  completionDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  completionLabel: { flex: 1, fontSize: '13px' },
  doneTag: { fontSize: '12px', color: 'var(--success)', fontWeight: 600 },
  pendingTag: { fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px' },
  progressBar: { height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { width: '40%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '3px' },
  progressText: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }
}

export default FreelancerDashboard