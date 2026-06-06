import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ProgressTracker = () => {
  const { user } = useSelector(state => state.auth)
  const [gigs, setGigs] = useState([])
  const [selectedGig, setSelectedGig] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState({ message: '', percentage: 0, fileUrl: '', fileName: '' })
  const [fileLoading, setFileLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        let activeGigs = []
        if (user.role === 'freelancer') {
          const res = await API.get('/gigs/hired')
          activeGigs = res.data.gigs
        } else {
          const res = await API.get('/gigs/my/gigs')
          activeGigs = res.data.gigs.filter(g =>
            g.status === 'in_progress' || g.status === 'completed'
          )
        }
        setGigs(activeGigs)
      } catch (error) {
        console.error('Progress error:', error.response?.data)
        toast.error('Failed to load gigs')
      }
      setLoading(false)
    }
    load()
  }, [])

  const fetchProgress = async (gigId) => {
    try {
      const { data } = await API.get(`/gigs/${gigId}/progress`)
      setProgressData(data)
      setForm({ message: '', percentage: data.completionPercentage || 0 })
    } catch {
      toast.error('Failed to load progress')
    }
  }

  const selectGig = async (gig) => {
    setSelectedGig(gig)
    await fetchProgress(gig._id)
  }

  const handleUpdateProgress = async (e) => {
    e.preventDefault()
    if (!form.message.trim()) return toast.error('Add a progress message')
    setUpdating(true)
    try {
      await API.post(`/gigs/${selectedGig._id}/progress`, form)
      toast.success('Progress updated!')
      await fetchProgress(selectedGig._id)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update')
    }
    setUpdating(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await API.post('/upload/docs', formData)
      setForm({ ...form, fileUrl: data.url, fileName: data.name })
      toast.success('File attached!')
    } catch {
      toast.error('File upload failed')
    }
    setFileLoading(false)
  }

  const checkDeadline = (deadline) => {
    if (!deadline) return null
    const diff = new Date(deadline) - new Date()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: 'OVERDUE', color: 'var(--error)' }
    if (days <= 2) return { text: `Due in ${days} days!`, color: 'var(--error)' }
    return null
  }

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'var(--success)'
    if (pct >= 50) return 'var(--secondary)'
    if (pct >= 25) return '#ffc107'
    return 'var(--error)'
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Project Progress</h2>

      {loading ? (
        <div style={styles.center}>Loading projects...</div>
      ) : (
        <div style={styles.layout}>

          {/* Left — Gig List */}
          <div style={styles.gigList}>
            <h3 style={styles.listTitle}>Active Projects</h3>
            {gigs.length === 0 ? (
              <div className="glass" style={styles.empty}>
                <p>📭</p>
                <p>No active projects</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {user.role === 'freelancer'
                    ? 'Get hired to track progress'
                    : 'Hire a freelancer first'}
                </p>
              </div>
            ) : (
              gigs.map(gig => (
                <div
                  key={gig._id}
                  className="glass"
                  style={{
                    ...styles.gigCard,
                    ...(selectedGig?._id === gig._id ? styles.gigCardActive : {})
                  }}
                  onClick={() => selectGig(gig)}
                >
                  <p style={styles.gigTitle}>{gig.title}</p>
                  <p style={styles.gigCategory}>{gig.category}</p>
                  <div style={styles.miniBarTrack}>
                    <div style={{
                      ...styles.miniBarFill,
                      width: `${gig.completionPercentage || 0}%`,
                      background: getProgressColor(gig.completionPercentage || 0)
                    }} />
                  </div>
                  <p style={styles.gigPct}>{gig.completionPercentage || 0}% complete</p>
                </div>
              ))
            )}
          </div>

          {/* Right — Progress Detail */}
          <div style={styles.detail}>
            {!selectedGig ? (
              <div className="glass" style={styles.noSelect}>
                <p style={{ fontSize: '40px' }}>📊</p>
                <p style={{ fontWeight: 600 }}>Select a project</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Click a project to view progress
                </p>
              </div>
            ) : (
              <>
                <div className="glass" style={styles.overviewCard}>
                  <div style={styles.overviewHeader}>
                    <div>
                      <h3 style={styles.gigDetailTitle}>{selectedGig.title}</h3>
                      <p style={styles.gigDetailMeta}>{selectedGig.category}</p>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      background: selectedGig.status === 'completed'
                         ? 'rgba(72,187,120,0.15)' : 'rgba(0,212,255,0.15)',
                      color: selectedGig.status === 'completed'
                         ? 'var(--success)' : 'var(--secondary)'
                    }}>
                      {selectedGig.status}
                    </span>
                  </div>
                  
                  {checkDeadline(selectedGig.deadline) && (
                    <div style={{ ...styles.deadlineAlert, color: checkDeadline(selectedGig.deadline).color }}>
                      🚨 {checkDeadline(selectedGig.deadline).text}
                    </div>
                  )}
                  <div style={styles.bigBarTrack}>
                    <div style={{
                      ...styles.bigBarFill,
                      width: `${progressData?.completionPercentage || 0}%`,
                      background: getProgressColor(progressData?.completionPercentage || 0)
                    }} />
                  </div>
                  <div style={styles.pctRow}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>0%</span>
                    <span style={{
                      fontSize: '24px', fontWeight: 700,
                      color: getProgressColor(progressData?.completionPercentage || 0)
                    }}>
                      {progressData?.completionPercentage || 0}%
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>100%</span>
                  </div>
                </div>

                {/* Milestones Section */}
                {progressData?.milestones?.length > 0 && (
                  <div className="glass" style={styles.section}>
                    <h4 style={styles.sectionTitle}>🎯 Project Milestones</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {progressData.milestones.map((m, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 600 }}>{m.title}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{m.amount}</p>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px',
                            background: m.status === 'released' ? 'rgba(72,187,120,0.15)' : (m.status === 'funded' ? 'rgba(54,162,235,0.15)' : 'rgba(255,193,7,0.15)'),
                            color: m.status === 'released' ? '#48bb78' : (m.status === 'funded' ? '#36a2eb' : '#ffc107'),
                            textTransform: 'uppercase'
                          }}>
                            {m.status === 'funded' ? '🛡️ Funded (In Escrow)' : m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.role === 'freelancer' && selectedGig.status !== 'completed' && (
                  <div className="glass" style={styles.section}>
                    <h4 style={styles.sectionTitle}>📝 Update Progress</h4>
                    <form onSubmit={handleUpdateProgress} style={styles.form}>
                      <div style={styles.field}>
                        <label style={styles.label}>Completion: {form.percentage}%</label>
                        <input
                          type="range" min="0" max="100" step="5"
                          value={form.percentage}
                          onChange={e => setForm({ ...form, percentage: Number(e.target.value) })}
                          style={styles.slider}
                        />
                        <div style={styles.sliderTicks}>
                          {[0,25,50,75,100].map(v => (
                            <span key={v} style={styles.tick}>{v}%</span>
                          ))}
                        </div>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Progress Note</label>
                        <textarea
                          className="input" rows={3}
                          placeholder="What did you complete?"
                          value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Attach Proof/File (Optional)</label>
                        <input type="file" onChange={handleFileUpload} />
                        {fileLoading && <p style={{ fontSize: '12px' }}>Uploading...</p>}
                        {form.fileName && <p style={{ fontSize: '12px', color: 'var(--success)' }}>📎 {form.fileName}</p>}
                      </div>
                      <button className="btn-primary" type="submit"
                        disabled={updating} style={{ maxWidth: '200px' }}>
                        {updating ? 'Updating...' : '📊 Update Progress'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="glass" style={styles.section}>
                  <h4 style={styles.sectionTitle}>📋 Progress Timeline</h4>
                  {!progressData?.progressLogs?.length ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No updates yet
                    </p>
                  ) : (
                    <div style={styles.timeline}>
                      {[...(progressData?.progressLogs || [])].reverse().map((log, i) => (
                        <div key={i} style={styles.logItem}>
                          <div style={{
                            ...styles.logDot,
                            background: getProgressColor(log.percentage)
                          }} />
                          <div style={styles.logContent}>
                            <div style={styles.logHeader}>
                              <span style={styles.logPct}>{log.percentage}%</span>
                              <span style={styles.logTime}>
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={styles.logMsg}>{log.message}</p>
                            {log.fileUrl && (
                              <a href={log.fileUrl} target="_blank" rel="noreferrer" style={styles.logFile}>
                                📎 {log.fileName || 'View Attachment'}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  title: { fontSize: '24px', fontWeight: 700 },
  center: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' },
  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  listTitle: { fontSize: '15px', fontWeight: 600, marginBottom: '4px' },
  empty: { padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px' },
  gigCard: { padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' },
  gigCardActive: { border: '1px solid var(--primary)', background: 'rgba(108,99,255,0.05)' },
  gigTitle: { fontSize: '14px', fontWeight: 600 },
  gigCategory: { fontSize: '12px', color: 'var(--text-secondary)' },
  miniBarTrack: { height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: '2px', transition: 'width 0.5s' },
  gigPct: { fontSize: '11px', color: 'var(--text-secondary)' },
  detail: { display: 'flex', flexDirection: 'column', gap: '16px' },
  noSelect: { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  overviewCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  overviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  gigDetailTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '4px' },
  gigDetailMeta: { fontSize: '13px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' },
  deadlineAlert: { marginTop: '8px', fontSize: '13px', fontWeight: 600, padding: '8px', background: 'rgba(252,129,129,0.1)', borderRadius: '6px' },
  bigBarTrack: { height: '16px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' },
  bigBarFill: { height: '100%', borderRadius: '8px', transition: 'width 0.8s' },
  pctRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  section: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  sectionTitle: { fontSize: '15px', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  slider: { width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' },
  sliderTicks: { display: 'flex', justifyContent: 'space-between' },
  tick: { fontSize: '11px', color: 'var(--text-secondary)' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  logDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
  logContent: { flex: 1 },
  logHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  logPct: { fontSize: '13px', fontWeight: 600 },
  logTime: { fontSize: '11px', color: 'var(--text-secondary)' },
  logMsg: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 },
  logFile: { fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'block', marginTop: '4px' }
}

export default ProgressTracker
