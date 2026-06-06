import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'



const GigDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const [gig, setGig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [aiMatches, setAiMatches] = useState([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [proposal, setProposal] = useState({
    coverLetter: '', bidAmount: '', estimatedDays: ''
  })

  async function fetchGig() {
    try {
      const { data } = await API.get(`/gigs/${id}`)
      setGig(data.gig)
    } catch (error) {
      console.error(error)
      toast.error('Gig not found')
      navigate('/dashboard/gigs')
    }
    setLoading(false)
  }

  async function checkIfApplied() {
    try {
      const { data } = await API.get('/proposals/my')
      const applied = data.proposals.some(p => p.gig._id === id)
      setAlreadyApplied(applied)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!gig || user?.role !== 'client') return

    const loadAIMatches = async () => {
      setLoadingAI(true)
      try {
        const { data } = await API.get(`/ai/match/${id}`)
        setAiMatches(data.matches)
      } catch (error) {
        console.error('AI match error:', error)
      }
      setLoadingAI(false)
    }

    loadAIMatches()
  }, [gig, user?.role, id])

  useEffect(() => {
    const loadGigDetail = async () => {
      await fetchGig()
      await checkIfApplied()
    }
    loadGigDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmitProposal = async (e) => {
    e.preventDefault()
    if (!proposal.coverLetter || !proposal.bidAmount || !proposal.estimatedDays) {
      return toast.error('Please fill all fields')
    }
    setSubmitting(true)
    try {
      await API.post(`/proposals/${id}`, {
        ...proposal,
        bidAmount: Number(proposal.bidAmount),
        estimatedDays: Number(proposal.estimatedDays)
      })
      toast.success('Proposal submitted successfully!')
      setAlreadyApplied(true)
      setShowProposalForm(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit proposal')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
      Loading gig...
    </div>
  )

  if (!gig) return null

  return (
    <div style={styles.container}>

      {/* Back Button */}
      <button onClick={() => navigate('/dashboard/gigs')} style={styles.backBtn}>
        ← Back to Gigs
      </button>

      <div style={styles.layout}>

        {/* LEFT — Main Content */}
        <div style={styles.main}>

          {/* Header */}
          <div className="glass" style={styles.gigHeader}>
            <div style={styles.gigMeta}>
              <span style={styles.category}>{gig.category}</span>
              <span style={styles.status}>🟢 {gig.status}</span>
            </div>
            <h1 style={styles.gigTitle}>{gig.title}</h1>
            <div style={styles.gigStats}>
              <span>📋 {gig.proposalCount} proposals</span>
              <span>👁 {gig.views} views</span>
              <span>📅 {new Date(gig.createdAt).toLocaleDateString()}</span>
              <span>📍 {gig.location}</span>
            </div>
          </div>

          {/* Description */}
          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>Project Description</h3>
            <p style={styles.description}>{gig.description}</p>
          </div>

          {/* Skills Required */}
          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>Skills Required</h3>
            <div style={styles.skills}>
              {(gig.skillsRequired || []).map((skill, i) => (
                <span key={i} style={styles.skillTag}>{skill}</span>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {gig.milestones?.length > 0 && (
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>Milestones</h3>
              {gig.milestones.map((m, i) => (
                <div key={i} style={styles.milestone}>
                  <div style={styles.milestoneDot} />
                  <div>
                    <p style={styles.milestoneTitle}>{m.title}</p>
                    <p style={styles.milestoneMeta}>
                      ₹{m.amount} · Due: {new Date(m.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attachments */}
          {gig.attachments?.length > 0 && (
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>📎 Project Documents</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {gig.attachments.map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span style={styles.skillTag}>📄 {file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Proposal Form or Client Warning */}
          {user?.role === 'freelancer' ? (
            <div className="glass" style={styles.section}>
              {alreadyApplied ? (
                <div style={styles.appliedBanner}>
                  ✅ You have already submitted a proposal for this gig
                </div>
              ) : !showProposalForm ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowProposalForm(true)}
                >
                  📋 Submit Proposal
                </button>
              ) : (
                <form onSubmit={handleSubmitProposal} style={styles.proposalForm}>
                  <h3 style={styles.sectionTitle}>Submit Your Proposal</h3>

                  <div style={styles.formRow}>
                    <div style={styles.field}>
                      <label style={styles.label}>Your Bid Amount (₹)</label>
                      <input
                        className="input"
                        type="number"
                        placeholder={`Budget: ₹${gig.budgetMin} – ₹${gig.budgetMax}`}
                        value={proposal.bidAmount}
                        onChange={e => setProposal({ ...proposal, bidAmount: e.target.value })}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Estimated Days</label>
                      <input
                        className="input"
                        type="number"
                        placeholder="e.g. 7"
                        value={proposal.estimatedDays}
                        onChange={e => setProposal({ ...proposal, estimatedDays: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Cover Letter</label>
                    <textarea
                      className="input"
                      rows={5}
                      placeholder="Explain why you're the best fit for this project..."
                      value={proposal.coverLetter}
                      onChange={e => setProposal({ ...proposal, coverLetter: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary" type="submit"
                      disabled={submitting} style={{ maxWidth: '200px' }}>
                      {submitting ? 'Submitting...' : '🚀 Submit Proposal'}
                    </button>
                    <button type="button"
                      onClick={() => setShowProposalForm(false)}
                      style={styles.cancelBtn}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            user?.role === 'client' && (
              <div className="glass" style={{ ...styles.section, border: '1px solid var(--primary)', background: 'rgba(108,99,255,0.05)' }}>
                <h3 style={styles.sectionTitle}>💼 Applying for this Gig</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  You are currently in <strong>Client Mode</strong>. To submit a proposal for this gig, you need to switch to your <strong>Freelancer</strong> profile.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn-primary" 
                    onClick={async () => {
                      if (!window.confirm('Switch to Freelancer mode?')) return;
                      try {
                        const { data } = await API.patch('/profile/switch-role', { role: 'freelancer' });
                        // Update local state by re-fetching gig detail which will trigger re-render
                        window.location.reload(); 
                        toast.success('Switched to Freelancer Mode!');
                      } catch (err) {
                        toast.error('Failed to switch role');
                      }
                    }}
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    🔄 Switch to Freelancer Mode
                  </button>
                </div>
              </div>
            )
          )}
        </div>


        {/* RIGHT — Sidebar */}
        <div style={styles.sidebar}>

          {/* Budget Card */}
          <div className="glass" style={styles.sideCard}>
            <h3 style={styles.sectionTitle}>Budget</h3>
            <p style={styles.budgetAmount}>
              ₹{gig.budgetMin.toLocaleString()} – ₹{gig.budgetMax.toLocaleString()}
            </p>
            <p style={styles.budgetType}>{gig.budgetType} price</p>
          </div>

          {/* Client Card */}
          <div className="glass" style={styles.sideCard}>
            <h3 style={styles.sectionTitle}>About the Client</h3>
            <div style={styles.clientInfo}>
              <div style={styles.clientAvatar}>
                {gig.client?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <p style={styles.clientName}>{gig.client?.name}</p>
                <p style={styles.clientEmail}>{gig.client?.email}</p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="glass" style={styles.sideCard}>
            <h3 style={styles.sectionTitle}>Project Info</h3>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Type</span>
                <span style={styles.infoValue}>{gig.budgetType}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Location</span>
                <span style={styles.infoValue}>{gig.location}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Remote</span>
                <span style={styles.infoValue}>{gig.isRemote ? 'Yes' : 'No'}</span>
              </div>
              {gig.deadline && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Deadline</span>
                  <span style={styles.infoValue}>
                    {new Date(gig.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {user?.role === 'client' && (
  <div className="glass" style={styles.sideCard}>
    <h3 style={styles.sectionTitle}>🤖 AI Matched Freelancers</h3>
    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
      Best matches for your gig
    </p>

    {loadingAI ? (
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Finding matches...
      </p>
    ) : aiMatches.length === 0 ? (
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        No matches found yet
      </p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {aiMatches.slice(0, 5).map((match, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            gap: '10px', padding: '10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px', border: '1px solid var(--border)'
          }}>
            {/* Rank */}
            <span style={{
              fontSize: '11px', fontWeight: 700,
              color: i === 0 ? '#ffc107' : 'var(--text-secondary)',
              width: '16px'
            }}>
              #{i + 1}
            </span>

            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, flexShrink: 0
            }}>
              {match.freelancer.name?.charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
                {match.freelancer.name}
                {match.freelancer.isVerified && ' ✅'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {match.profile.title || 'Freelancer'}
              </p>
            </div>

            {/* Match Score */}
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: '14px', fontWeight: 700,
                color: match.matchScore >= 70
                  ? 'var(--success)'
                  : match.matchScore >= 40
                  ? '#ffc107' : 'var(--text-secondary)'
              }}>
                {match.matchScore}%
              </p>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                match
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--primary)',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500,
    alignSelf: 'flex-start', padding: '0'
  },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '16px' },
  gigHeader: { padding: '24px' },
  gigMeta: { display: 'flex', gap: '12px', marginBottom: '12px' },
  category: {
    fontSize: '12px', fontWeight: 600, color: 'var(--secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  status: { fontSize: '12px', fontWeight: 600, color: 'var(--success)' },
  gigTitle: { fontSize: '24px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.3 },
  gigStats: { display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' },
  section: { padding: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '16px' },
  description: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillTag: {
    padding: '6px 14px', borderRadius: '16px', fontSize: '13px',
    background: 'rgba(108,99,255,0.1)', color: 'var(--primary)',
    border: '1px solid rgba(108,99,255,0.2)'
  },
  milestone: { display: 'flex', gap: '12px', marginBottom: '12px' },
  milestoneDot: {
    width: '10px', height: '10px', borderRadius: '50%', marginTop: '4px', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
  },
  milestoneTitle: { fontWeight: 500, fontSize: '14px' },
  milestoneMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  appliedBanner: {
    padding: '16px', background: 'rgba(72,187,120,0.1)',
    border: '1px solid rgba(72,187,120,0.3)', borderRadius: '8px',
    color: 'var(--success)', fontSize: '14px', fontWeight: 500
  },
  proposalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  cancelBtn: {
    padding: '12px 20px', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: '8px',
    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px'
  },
  sideCard: { padding: '20px' },
  budgetAmount: { fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginBottom: '4px' },
  budgetType: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' },
  clientInfo: { display: 'flex', gap: '12px', alignItems: 'center' },
  clientAvatar: {
    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: 700
  },
  clientName: { fontWeight: 600, fontSize: '15px', marginBottom: '4px' },
  clientEmail: { fontSize: '12px', color: 'var(--text-secondary)' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  infoValue: { fontSize: '13px', fontWeight: 500 }
}

export default GigDetail