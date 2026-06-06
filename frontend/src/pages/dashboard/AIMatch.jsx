import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AIMatch = () => {
  const [gigs, setGigs] = useState([])
  const [selectedGig, setSelectedGig] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingGigs, setLoadingGigs] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const { data } = await API.get('/gigs/my/gigs')
        const openGigs = data.gigs.filter(g => g.status === 'open')
        setGigs(openGigs)
        if (openGigs.length > 0) {
          setSelectedGig(openGigs[0])
        }
      } catch (err) {
        toast.error('Failed to load gigs')
      }
      setLoadingGigs(false)
    }
    fetchGigs()
  }, [])

  useEffect(() => {
    if (!selectedGig) return
    const fetchMatches = async () => {
      setLoadingMatches(true)
      try {
        const { data } = await API.get(`/ai/match/${selectedGig._id}`)
        setMatches(data.matches)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load matches')
      }
      setLoadingMatches(false)
    }
    fetchMatches()
  }, [selectedGig])

  if (loadingGigs) return <div style={styles.center}>Loading gigs...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 AI Freelancer Matching</h2>
        <p style={styles.subtitle}>Find the perfect match for your open projects using our AI matching algorithm.</p>
      </div>

      {gigs.length === 0 ? (
        <div className="glass" style={styles.empty}>
          <p style={{ fontSize: '48px' }}>🔍</p>
          <p style={{ fontWeight: 600 }}>No open gigs found</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Post a new gig to start matching with freelancers!</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/create-gig')} style={{ marginTop: '12px', width: 'auto' }}>
            + Post Gig
          </button>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* Left: Gig Selector */}
          <div style={styles.sidebar}>
            <h3 style={styles.sectionTitle}>Select a Project</h3>
            <div style={styles.gigList}>
              {gigs.map(g => (
                <div
                  key={g._id}
                  className="glass"
                  style={{
                    ...styles.gigCard,
                    ...(selectedGig?._id === g._id ? styles.selectedGigCard : {})
                  }}
                  onClick={() => setSelectedGig(g)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={styles.gigTitle}>{g.title}</p>
                    {selectedGig?._id === g._id && <span style={styles.selectedTick}>✓</span>}
                  </div>
                  <p style={styles.gigMeta}>Budget: ₹{g.budgetMax.toLocaleString()}</p>
                  {selectedGig?._id === g._id && (
                    <div style={styles.activePulse}>Currently Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Matches */}
          <div style={styles.main}>
            {loadingMatches ? (
              <div style={styles.center}>Analyzing freelancers...</div>
            ) : matches.length === 0 ? (
              <div className="glass" style={styles.empty}>
                <p>No matches found with required skills yet.</p>
              </div>
            ) : (
              <div style={styles.matchGrid}>
                {matches.map((m, i) => (
                  <div key={i} className="glass" style={styles.matchCard}>
                    <div style={styles.scoreBadge}>{m.matchScore}% Match</div>
                    <div style={styles.cardHeader}>
                      <div style={styles.avatar}>{m.freelancer.name.charAt(0)}</div>
                      <div>
                        <h4 style={styles.name}>{m.freelancer.name} {m.freelancer.isVerified && '✅'}</h4>
                        <p style={styles.matchTitle}>{m.profile.title}</p>
                      </div>
                    </div>
                    
                    <div style={styles.skills}>
                      {m.matchedSkills.map((s, idx) => (
                        <span key={idx} style={styles.skillBadge}>{s}</span>
                      ))}
                    </div>

                    <div style={styles.stats}>
                      <div>
                        <p style={styles.statVal}>₹{m.profile.hourlyRate}</p>
                        <p style={styles.statLbl}>Hourly</p>
                      </div>
                      <div>
                        <p style={styles.statVal}>{m.profile.reputationScore}</p>
                        <p style={styles.statLbl}>Reputation</p>
                      </div>
                      <div>
                        <p style={styles.statVal}>{m.profile.completedGigs}</p>
                        <p style={styles.statLbl}>Finished</p>
                      </div>
                    </div>

                    <button 
                      className="btn-primary" 
                      onClick={() => navigate(`/dashboard/messages?user=${m.freelancer._id}`)}
                      style={{ marginTop: '16px' }}
                    >
                      💬 Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  center: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' },
  empty: { padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  gigCard: { padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' },
  selectedGigCard: { border: '1px solid var(--primary)', background: 'rgba(108,99,255,0.1)', transform: 'scale(1.02)' },
  selectedTick: { color: 'var(--primary)', fontWeight: 800, fontSize: '18px' },
  activePulse: { marginTop: '8px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px' },
  gigTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  gigMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  matchGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  matchCard: { padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' },
  scoreBadge: { position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(72,187,120,0.15)', color: '#48bb78', fontSize: '12px', fontWeight: 700 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 },
  name: { fontSize: '16px', fontWeight: 600 },
  matchTitle: { fontSize: '13px', color: 'var(--text-secondary)' },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skillBadge: { padding: '4px 8px', borderRadius: '6px', background: 'rgba(108,99,255,0.1)', color: 'var(--primary)', fontSize: '11px', fontWeight: 500 },
  stats: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' },
  statVal: { fontSize: '15px', fontWeight: 700, textAlign: 'center' },
  statLbl: { fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase' }
}

export default AIMatch
