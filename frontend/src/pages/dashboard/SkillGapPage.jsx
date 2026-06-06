import { useState } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const SkillGapPage = () => {
  const [target, setTarget] = useState({ company: '', role: '' })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!target.company || !target.role) return toast.error('Please fill all fields')

    setLoading(true)
    try {
      const { data } = await API.get(`/ai/skill-gap?targetCompany=${target.company}&targetRole=${target.role}`)
      setAnalysis(data.analysis)
      toast.success('Analysis complete!')
    } catch (error) {
      toast.error('Failed to get analysis. Make sure your profile has skills!')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <header className="glass" style={styles.header}>
        <h1 style={styles.title}>🤖 AI Skill Gap Analyzer</h1>
        <p style={styles.subtitle}>Analyze your readiness for top companies & roles</p>
      </header>

      <div style={styles.layout}>
        {/* Input Card */}
        <div className="glass" style={styles.inputCard}>
          <h3 style={styles.sectionTitle}>Set Your Goal</h3>
          <form onSubmit={handleAnalyze} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Dream Company</label>
              <input
                className="input"
                placeholder="e.g. Google, Amazon, Infosys"
                value={target.company}
                onChange={e => setTarget({ ...target, company: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Target Role</label>
              <input
                className="input"
                placeholder="e.g. Frontend Engineer, Data Scientist"
                value={target.role}
                onChange={e => setTarget({ ...target, role: e.target.value })}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : '🚀 Start Analysis'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {analysis && (
          <div className="glass" style={styles.resultsCard}>
            <div style={styles.scoreHeader}>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreNum}>{analysis.currentLevel}%</span>
                <span style={styles.scoreLabel}>Readiness</span>
              </div>
              <div style={styles.quickStats}>
                <div style={styles.stat}>
                  <label>Prep Time</label>
                  <span>{analysis.estimatedPrepTime}</span>
                </div>
                <div style={styles.stat}>
                  <label>Market Demand</label>
                  <span style={{ color: 'var(--success)' }}>{analysis.marketDemand}</span>
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <h4 style={styles.miniTitle}>⚠️ Missing Skills</h4>
              <div style={styles.tags}>
                {analysis.missingSkills.map((s, i) => (
                  <span key={i} style={styles.missingTag}>{s}</span>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.miniTitle}>🗓️ Preparation Roadmap</h4>
              <p style={styles.roadmapText}>{analysis.roadmap}</p>
            </div>

            <div style={styles.footer}>
              <p>Placement Readiness Score: <strong>{analysis.placementReadinessScore}/10</strong></p>
            </div>
          </div>
        )}

        {!analysis && !loading && (
          <div className="glass" style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎯</div>
            <h3>Your analysis will appear here</h3>
            <p>Tell us where you want to work and we'll tell you how to get there.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { padding: '30px', textAlign: 'center' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)' },
  layout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' },
  inputCard: { padding: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', color: 'var(--text-secondary)' },
  resultsCard: { padding: '24px' },
  scoreHeader: { display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '24px' },
  scoreCircle: {
    width: '120px', height: '120px', borderRadius: '50%',
    border: '8px solid var(--primary)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: 'rgba(108,99,255,0.05)'
  },
  scoreNum: { fontSize: '24px', fontWeight: 800, color: 'var(--primary)' },
  scoreLabel: { fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' },
  quickStats: { display: 'flex', flexDirection: 'column', gap: '16px' },
  stat: { display: 'flex', flexDirection: 'column', gap: '4px' },
  divider: { height: '1px', background: 'var(--border)', margin: '24px 0' },
  section: { marginBottom: '24px' },
  miniTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  missingTag: {
    padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
    background: 'rgba(255,100,100,0.1)', color: '#ff6b6b',
    border: '1px solid rgba(255,100,100,0.2)'
  },
  roadmapText: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  footer: { 
    padding: '16px', background: 'rgba(255,255,255,0.03)', 
    borderRadius: '8px', textAlign: 'center', fontSize: '14px' 
  },
  emptyState: { 
    padding: '80px', textAlign: 'center', display: 'flex', 
    flexDirection: 'column', alignItems: 'center', gap: '16px' 
  },
  emptyIcon: { fontSize: '48px' }
}

export default SkillGapPage
