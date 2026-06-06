import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const PortfolioArchitect = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/ai/portfolio-architect')
      setData(data.analysis)
    } catch (error) {
      toast.error('Failed to analyze portfolio. Ensure your profile has skills!')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div className="spinner"></div>
      <p>Architecting your portfolio... 🏗️</p>
    </div>
  )

  if (!data) return null

  return (
    <div style={styles.container}>
      {/* Header Card */}
      <div className="glass" style={styles.headerCard}>
        <div style={styles.scoreSection}>
          <div style={styles.radialScore}>
            <span style={styles.scoreNum}>{data.portfolioScore}</span>
            <span style={styles.scoreText}>Portfolio Score</span>
          </div>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>AI Portfolio Architect</h1>
            <p style={styles.description}>
              We've analyzed your profile. Here is how you can level up to reach Top Tech standards.
            </p>
            <button className="btn-primary" onClick={fetchAnalysis} style={{ width: 'auto' }}>
              🔄 Re-Analyze
            </button>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Analysis Column */}
        <div style={styles.analysisCol}>
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>✅ Your Strengths</h3>
            <ul style={styles.list}>
              {data.strengths.map((s, i) => <li key={i} style={styles.listItem}>{s}</li>)}
            </ul>
          </div>

          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>🎯 Critical Gaps</h3>
            <ul style={styles.list}>
              {data.weaknesses.map((w, i) => (
                <li key={i} style={{ ...styles.listItem, color: '#ff6b6b' }}>{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Projects Column */}
        <div style={styles.projectsCol}>
          <h2 style={styles.sectionTitle}>Resume-Worthy Project Ideas 🚀</h2>
          {data.suggestedProjects.map((p, i) => (
            <div key={i} className="glass" style={styles.projectCard}>
              <div style={styles.projectHeader}>
                <h4 style={styles.projectTitle}>{p.title}</h4>
                <span style={styles.difficultyTag}>{p.difficulty}</span>
              </div>
              <p style={styles.projectWhy}>{p.whyItHelps}</p>
              
              <div style={styles.techStack}>
                {p.techStack.map((t, j) => <span key={j} style={styles.techTag}>{t}</span>)}
              </div>

              <div style={styles.roadmap}>
                <h5 style={styles.roadmapTitle}>📍 Execution Roadmap</h5>
                <p style={styles.roadmapText}>{p.roadmap}</p>
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
  loadingContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  headerCard: { padding: '40px' },
  scoreSection: { display: 'flex', gap: '40px', alignItems: 'center' },
  radialScore: {
    width: '140px', height: '140px', borderRadius: '50%',
    border: '10px solid var(--primary)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: 'rgba(108,99,255,0.05)'
  },
  scoreNum: { fontSize: '36px', fontWeight: 800, color: 'var(--primary)' },
  scoreText: { fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '28px', fontWeight: 700 },
  description: { color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' },
  
  grid: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', alignItems: 'start' },
  analysisCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { padding: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '20px' },
  list: { paddingLeft: '20px' },
  listItem: { marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' },

  projectsCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { fontSize: '20px', fontWeight: 700, marginBottom: '10px' },
  projectCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  projectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectTitle: { fontSize: '18px', fontWeight: 600, color: 'var(--primary)' },
  difficultyTag: { padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 500 },
  projectWhy: { fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' },
  techStack: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  techTag: { padding: '4px 12px', background: 'rgba(0,212,255,0.1)', color: '#00d4ff', borderRadius: '16px', fontSize: '12px' },
  roadmap: { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' },
  roadmapTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' },
  roadmapText: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }
}

export default PortfolioArchitect
