import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const GigProposals = () => {
  const { gigId } = useParams()
  const navigate = useNavigate()
  const [gig, setGig] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [gigRes, propRes] = await Promise.all([
        API.get(`/gigs/${gigId}`),
        API.get(`/proposals/gig/${gigId}`)
      ])
      setGig(gigRes.data.gig)
      setProposals(propRes.data.proposals)
    } catch (error) {
      console.error('fetchData error:', error)
      toast.error(error.response?.data?.message || 'Failed to load proposals')
    }
    setLoading(false)
  }, [gigId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const handleStatus = async (proposalId, status) => {
    setUpdating(proposalId)
    try {
      await API.put(`/proposals/${proposalId}/status`, { status })
      toast.success(status === 'accepted' ? '🎉 Proposal Accepted!' : 'Proposal Rejected')
      fetchData() // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update')
    }
    setUpdating(null)
  }

  const statusStyles = {
    pending: { bg: 'rgba(255,193,7,0.15)', color: '#ffc107' },
    accepted: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    rejected: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181' },
    withdrawn: { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
      Loading proposals...
    </div>
  )

  return (
    <div style={styles.container}>

      {/* Header */}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📋 Proposals</h2>
          <p style={styles.subtitle}>
            {gig?.title} — {proposals.length} proposals received
          </p>
        </div>
        {gig?.hiredFreelancer && (
          <div style={styles.hiredBadge}>
            ✅ Freelancer Hired
          </div>
        )}
      </div>

      {/* Gig Summary */}
      <div className="glass" style={styles.gigSummary}>
        <div style={styles.gigInfo}>
          <span style={styles.gigCategory}>{gig?.category}</span>
          <h3 style={styles.gigTitle}>{gig?.title}</h3>
          <p style={styles.gigBudget}>
            Budget: ₹{gig?.budgetMin?.toLocaleString()} – ₹{gig?.budgetMax?.toLocaleString()}
          </p>
        </div>
        <div style={styles.gigStats}>
          <div style={styles.statItem}>
            <span style={styles.statVal}>{proposals.length}</span>
            <span style={styles.statLbl}>Total</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {proposals.filter(p => p.status === 'pending').length}
            </span>
            <span style={styles.statLbl}>Pending</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {proposals.filter(p => p.status === 'accepted').length}
            </span>
            <span style={styles.statLbl}>Accepted</span>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="glass" style={styles.empty}>
          <p style={{ fontSize: '48px' }}>📭</p>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>No proposals yet</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Freelancers will apply soon!
          </p>
        </div>
      ) : (
        <div style={styles.proposalList}>
          {proposals.map(proposal => {
            const s = statusStyles[proposal.status]
            return (
              <div key={proposal._id} className="glass" style={styles.proposalCard}>

                {/* Freelancer Info */}
                <div style={styles.cardHeader}>
                  <div style={styles.freelancerInfo}>
                    <div style={styles.avatar}>
                      {proposal.freelancer?.name?.charAt(0)}
                    </div>
                    <div>
                      <p style={styles.freelancerName}>
                        {proposal.freelancer?.name}
                        {proposal.freelancer?.isVerified && ' ✅'}
                      </p>
                      <p style={styles.freelancerEmail}>
                        {proposal.freelancer?.email}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {proposal.aiMatchScore > 0 && (
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                        background: 'rgba(72,187,120,0.15)', color: '#48bb78', border: '1px solid rgba(72,187,120,0.3)'
                      }}>
                        🤖 {proposal.aiMatchScore}% Match
                      </span>
                    )}
                    <span style={{
                      ...styles.statusBadge,
                      background: s?.bg,
                      color: s?.color
                    }}>
                      {proposal.status}
                    </span>
                  </div>
                </div>

                {/* Proposal Details */}
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>💰 Bid Amount</span>
                    <span style={styles.detailValue}>
                      ₹{proposal.bidAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>⏱ Timeline</span>
                    <span style={styles.detailValue}>
                      {proposal.estimatedDays} days
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>📅 Submitted</span>
                    <span style={styles.detailValue}>
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Cover Letter */}
                <div style={styles.coverLetter}>
                  <p style={styles.coverLabel}>Cover Letter</p>
                  <p style={styles.coverText}>{proposal.coverLetter}</p>
                </div>

                {/* Action Buttons — only for pending proposals */}
                {proposal.status === 'pending' && !gig?.hiredFreelancer && (
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleStatus(proposal._id, 'accepted')}
                      disabled={updating === proposal._id}
                      style={styles.acceptBtn}
                    >
                      {updating === proposal._id ? 'Processing...' : '✅ Accept Proposal'}
                    </button>
                    <button
                      onClick={() => handleStatus(proposal._id, 'rejected')}
                      disabled={updating === proposal._id}
                      style={styles.rejectBtn}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {/* Already accepted message */}
                {proposal.status === 'accepted' && (
                  <div style={styles.acceptedBanner}>
                    🎉 You hired this freelancer! Go to Payments to pay them.
                    <button
                      onClick={() => navigate('/dashboard/payments')}
                      style={styles.payNowBtn}
                    >
                      💳 Pay Now
                    </button>
                  </div>
                )}

                {/* Gig already hired by someone else */}
                {proposal.status === 'pending' && gig?.hiredFreelancer && (
                  <div style={styles.closedBanner}>
                    Position filled — another freelancer was hired
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  backBtn: { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, alignSelf: 'flex-start' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  hiredBadge: { padding: '8px 16px', background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '20px', color: 'var(--success)', fontSize: '13px', fontWeight: 600 },
  gigSummary: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gigInfo: { flex: 1 },
  gigCategory: { fontSize: '11px', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' },
  gigTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
  gigBudget: { fontSize: '13px', color: 'var(--text-secondary)' },
  gigStats: { display: 'flex', gap: '24px' },
  statItem: { textAlign: 'center' },
  statVal: { fontSize: '24px', fontWeight: 700, display: 'block' },
  statLbl: { fontSize: '12px', color: 'var(--text-secondary)' },
  empty: { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  proposalList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  proposalCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  freelancerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 },
  freelancerName: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  freelancerEmail: { fontSize: '13px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  detailValue: { fontSize: '18px', fontWeight: 700 },
  coverLetter: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid var(--primary)' },
  coverLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' },
  coverText: { fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' },
  actions: { display: 'flex', gap: '12px' },
  acceptBtn: { padding: '12px 24px', background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)', borderRadius: '8px', color: 'var(--success)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' },
  rejectBtn: { padding: '12px 24px', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', borderRadius: '8px', color: 'var(--error)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  acceptedBanner: { padding: '14px 16px', background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '14px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  payNowBtn: { padding: '8px 16px', background: 'var(--success)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  closedBanner: { padding: '12px 16px', background: 'rgba(160,174,192,0.1)', border: '1px solid rgba(160,174,192,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px' }
}

export default GigProposals