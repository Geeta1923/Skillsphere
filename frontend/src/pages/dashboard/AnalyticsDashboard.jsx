import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const StarRating = ({ value }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{
        color: s <= value ? '#ffc107' : 'var(--border)',
        fontSize: '14px'
      }}>★</span>
    ))}
  </div>
)

const AnalyticsDashboard = () => {
  const { user } = useSelector(state => state.auth)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get('/profile/analytics')
        setAnalytics(data.analytics)
      } catch (error) {
        toast.error('Failed to load analytics')
      }
      setLoading(false)
    }

    if (user) {
      load()
    }
  }, [user])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
      Loading analytics...
    </div>
  )

  const maxMonthly = Math.max(
    ...(analytics?.monthlyChart?.map(m => m.amount) || [1]), 1
  )

  const proposalTotal = analytics?.proposalStats?.total || 1
  const successRate = analytics?.proposalStats?.total > 0
    ? Math.round((analytics?.proposalStats?.accepted || 0) / proposalTotal * 100)
    : 0

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📊 Analytics Dashboard</h2>
          <p style={styles.subtitle}>
            Your performance overview, {user?.name?.split(' ')[0]}
          </p>
        </div>
        <span style={styles.badge}>📈 Live Data</span>
      </div>

      {/* Key Stats */}
      <div style={styles.statsGrid}>
        {[
          {
            icon: '💰', label: 'Total Earnings',
            value: `₹${(analytics?.totalEarnings || 0).toLocaleString()}`,
            color: 'rgba(72,187,120,0.15)', textColor: 'var(--success)'
          },
          {
            icon: '✅', label: 'Completed Gigs',
            value: analytics?.completedGigs || 0,
            color: 'rgba(108,99,255,0.15)', textColor: 'var(--primary)'
          },
          {
            icon: '⭐', label: 'Avg Rating',
            value: analytics?.avgRating || '0.0',
            color: 'rgba(255,193,7,0.15)', textColor: '#ffc107'
          },
          {
            icon: '🎯', label: 'Success Rate',
            value: `${successRate}%`,
            color: 'rgba(0,212,255,0.15)', textColor: 'var(--secondary)'
          },
          {
            icon: '📋', label: 'Total Proposals',
            value: analytics?.proposalStats?.total || 0,
            color: 'rgba(108,99,255,0.15)', textColor: 'var(--primary)'
          },
          {
            icon: '🏆', label: 'Reputation Score',
            value: analytics?.reputationScore || 0,
            color: 'rgba(255,193,7,0.15)', textColor: '#ffc107'
          }
        ].map((stat, i) => (
          <div key={i} className="glass" style={styles.statCard}>
            <div style={{
              ...styles.statIconBox,
              background: stat.color
            }}>
              {stat.icon}
            </div>
            <p style={{ ...styles.statValue, color: stat.textColor }}>
              {stat.value}
            </p>
            <p style={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.gridTwo}>

        {/* Monthly Revenue Chart */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Monthly Revenue</h3>
          {analytics?.monthlyChart?.length === 0 ? (
            <div style={styles.emptyChart}>
              <p>📊</p>
              <p>No earnings data yet</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Complete gigs to see revenue chart
              </p>
            </div>
          ) : (
            <div style={styles.chart}>
              {analytics?.monthlyChart?.map((m, i) => (
                <div key={i} style={styles.barWrapper}>
                  <span style={styles.barAmount}>
                    ₹{(m.amount / 1000).toFixed(1)}k
                  </span>
                  <div style={styles.barTrack}>
                    <div style={{
                      ...styles.barFill,
                      height: `${(m.amount / maxMonthly) * 100}%`
                    }} />
                  </div>
                  <span style={styles.barLabel}>{m.month}</span>
                  <span style={styles.barProjects}>
                    {m.projects} project{m.projects !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposal Analytics */}
        <div className="glass" style={styles.section}>
          <h3 style={styles.sectionTitle}>📋 Proposal Analytics</h3>

          {/* Donut-style stats */}
          <div style={styles.proposalStats}>
            {[
              { label: 'Total Sent', value: analytics?.proposalStats?.total || 0, color: 'var(--primary)' },
              { label: 'Accepted', value: analytics?.proposalStats?.accepted || 0, color: 'var(--success)' },
              { label: 'Pending', value: analytics?.proposalStats?.pending || 0, color: '#ffc107' },
              { label: 'Rejected', value: analytics?.proposalStats?.rejected || 0, color: 'var(--error)' }
            ].map((item, i) => (
              <div key={i} style={styles.proposalItem}>
                <div style={{
                  ...styles.proposalCircle,
                  borderColor: item.color
                }}>
                  <span style={{ color: item.color, fontSize: '20px', fontWeight: 700 }}>
                    {item.value}
                  </span>
                </div>
                <p style={styles.proposalLabel}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Success rate bar */}
          <div style={styles.successSection}>
            <div style={styles.successHeader}>
              <span style={styles.successLabel}>Success Rate</span>
              <span style={styles.successValue}>{successRate}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${successRate}%`,
                background: successRate >= 50
                  ? 'var(--success)'
                  : successRate >= 25
                  ? '#ffc107' : 'var(--error)'
              }} />
            </div>
          </div>

          {/* Top Skills */}
          {analytics?.skills?.length > 0 && (
            <div style={styles.skillsSection}>
              <p style={styles.skillsTitle}>🛠️ Your Top Skills</p>
              <div style={styles.skillTags}>
                {analytics.skills.slice(0, 6).map((skill, i) => (
                  <span key={i} style={{
                    ...styles.skillTag,
                    background: skill.level === 'expert'
                      ? 'rgba(72,187,120,0.15)'
                      : skill.level === 'intermediate'
                      ? 'rgba(0,212,255,0.15)'
                      : 'rgba(255,193,7,0.15)',
                    color: skill.level === 'expert'
                      ? 'var(--success)'
                      : skill.level === 'intermediate'
                      ? 'var(--secondary)'
                      : '#ffc107'
                  }}>
                    {skill.name}
                    <span style={styles.skillLevel}>{skill.level}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Client Feedback */}
      <div className="glass" style={styles.section}>
        <h3 style={styles.sectionTitle}>⭐ Recent Client Feedback</h3>

        {analytics?.recentReviews?.length === 0 ? (
          <div style={styles.emptyReviews}>
            <p>⭐</p>
            <p>No reviews yet — complete gigs to get feedback!</p>
          </div>
        ) : (
          <div style={styles.reviewsGrid}>
            {analytics?.recentReviews?.map((review, i) => (
              <div key={i} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewerAvatar}>
                    {review.reviewer?.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={styles.reviewerName}>{review.reviewer?.name}</p>
                    <p style={styles.reviewGig}>{review.gig?.title}</p>
                  </div>
                  <StarRating value={review.rating} />
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>
                <p style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="glass" style={styles.section}>
        <h3 style={styles.sectionTitle}>💡 Performance Tips</h3>
        <div style={styles.tipsGrid}>
          {[
            {
              icon: '📝',
              tip: 'Complete your profile',
              desc: 'Profiles with photos get 3x more responses',
              done: !!user?.avatar
            },
            {
              icon: '🛠️',
              tip: 'Add more skills',
              desc: 'More skills = more AI job matches',
              done: (analytics?.skills?.length || 0) >= 5
            },
            {
              icon: '⚡',
              tip: 'Respond quickly',
              desc: 'Fast responses improve your ranking',
              done: false
            },
            {
              icon: '⭐',
              tip: 'Maintain high ratings',
              desc: 'Aim for 4.5+ rating for more gigs',
              done: (analytics?.avgRating || 0) >= 4.5
            }
          ].map((tip, i) => (
            <div key={i} style={{
              ...styles.tipCard,
              opacity: tip.done ? 0.6 : 1,
              borderColor: tip.done
                ? 'rgba(72,187,120,0.3)' : 'var(--border)'
            }}>
              <span style={styles.tipIcon}>{tip.done ? '✅' : tip.icon}</span>
              <div>
                <p style={styles.tipTitle}>{tip.tip}</p>
                <p style={styles.tipDesc}>{tip.desc}</p>
              </div>
            </div>
          ))}
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
  badge: { padding: '6px 14px', background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '20px', color: 'var(--success)', fontSize: '12px', fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' },
  statIconBox: { width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  statValue: { fontSize: '28px', fontWeight: 700 },
  statLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  section: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600 },
  emptyChart: { textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' },
  chart: { display: 'flex', gap: '12px', alignItems: 'flex-end', height: '160px', paddingTop: '20px' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  barAmount: { fontSize: '10px', color: 'var(--text-secondary)' },
  barTrack: { flex: 1, width: '100%', background: 'var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', minHeight: '4px' },
  barFill: { width: '100%', background: 'linear-gradient(180deg, var(--primary), var(--secondary))', borderRadius: '4px', transition: 'height 0.8s', minHeight: '4px' },
  barLabel: { fontSize: '11px', color: 'var(--text-secondary)' },
  barProjects: { fontSize: '10px', color: 'var(--text-secondary)' },
  proposalStats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  proposalItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  proposalCircle: { width: '56px', height: '56px', borderRadius: '50%', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  proposalLabel: { fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' },
  successSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  successHeader: { display: 'flex', justifyContent: 'space-between' },
  successLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  successValue: { fontSize: '13px', fontWeight: 600 },
  progressBar: { height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px', transition: 'width 0.8s' },
  skillsSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  skillsTitle: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillTag: { display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 },
  skillLevel: { fontSize: '10px', opacity: 0.7 },
  emptyReviews: { textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  reviewsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  reviewCard: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  reviewerAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 },
  reviewerName: { fontSize: '13px', fontWeight: 600, marginBottom: '2px' },
  reviewGig: { fontSize: '11px', color: 'var(--text-secondary)' },
  reviewComment: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  reviewDate: { fontSize: '11px', color: 'var(--text-secondary)' },
  tipsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tipCard: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid' },
  tipIcon: { fontSize: '24px', flexShrink: 0 },
  tipTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '4px' },
  tipDesc: { fontSize: '12px', color: 'var(--text-secondary)' }
}

export default AnalyticsDashboard