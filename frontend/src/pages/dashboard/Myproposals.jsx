import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const MyProposals = () => {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProposals = async () => {
    try {
      const { data } = await API.get('/proposals/my')
      setProposals(data.proposals)
    } catch (error) {
      toast.error('Failed to load proposals')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProposals()
  }, [])

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm('Withdraw this proposal?')) return
    try {
      await API.delete(`/proposals/${proposalId}`)
      setProposals(proposals.filter(p => p._id !== proposalId))
      toast.success('Proposal withdrawn')
    } catch (error) {
      toast.error('Failed to withdraw')
    }
  }

  const statusStyles = {
    pending:  { bg: 'rgba(255,193,7,0.15)',  color: '#ffc107',  label: '⏳ Pending' },
    accepted: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78',  label: '✅ Accepted' },
    rejected: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181', label: '❌ Rejected' },
    withdrawn:{ bg: 'rgba(160,174,192,0.15)', color: '#a0aec0', label: '↩ Withdrawn' }
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My Proposals</h2>
          <p style={styles.subtitle}>{proposals.length} proposals submitted</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/gigs')}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          🔍 Browse More Gigs
        </button>
      </div>

      {loading ? (
        <div style={styles.center}>Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '48px' }}>📋</p>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>No proposals yet</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Browse gigs and submit your first proposal!
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard/gigs')}
            style={{ width: 'auto', padding: '12px 24px', marginTop: '8px' }}
          >
            Browse Gigs
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {proposals.map(proposal => {
            const s = statusStyles[proposal.status] || statusStyles.pending
            return (
              <div key={proposal._id} className="glass" style={styles.card}>

                {/* Top Row */}
                <div style={styles.cardTop}>
                  <div style={styles.cardLeft}>
                    <span style={styles.category}>
                      {proposal.gig?.category}
                    </span>
                    <h3
                      style={styles.gigTitle}
                      onClick={() => navigate(`/dashboard/gigs/${proposal.gig?._id}`)}
                    >
                      {proposal.gig?.title}
                    </h3>
                    <p style={styles.gigBudget}>
                      Client Budget: ₹{proposal.gig?.budgetMin?.toLocaleString()}
                      {' – '}₹{proposal.gig?.budgetMax?.toLocaleString()}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    ...styles.statusBadge,
                    background: s.bg, color: s.color
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Proposal Details */}
                <div style={styles.details}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Your Bid</span>
                    <span style={styles.detailValue}>
                      ₹{proposal.bidAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Timeline</span>
                    <span style={styles.detailValue}>
                      {proposal.estimatedDays} days
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Submitted</span>
                    <span style={styles.detailValue}>
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Gig Status</span>
                    <span style={styles.detailValue}>
                      {proposal.gig?.status}
                    </span>
                  </div>
                </div>

                {/* Cover Letter Preview */}
                <div style={styles.coverLetter}>
                  <p style={styles.coverLabel}>Cover Letter</p>
                  <p style={styles.coverText}>
                    {proposal.coverLetter?.length > 150
                      ? proposal.coverLetter.slice(0, 150) + '...'
                      : proposal.coverLetter}
                  </p>
                </div>

                {/* Client Note if any */}
                {proposal.clientNote && (
                  <div style={styles.clientNote}>
                    <p style={styles.coverLabel}>Client's Response</p>
                    <p style={styles.coverText}>{proposal.clientNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div style={styles.actions}>
                  <button
                    onClick={() => navigate(`/dashboard/gigs/${proposal.gig?._id}`)}
                    style={styles.viewBtn}
                  >
                    👁 View Gig
                  </button>
                  {proposal.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(proposal._id)}
                      style={styles.withdrawBtn}
                    >
                      ↩ Withdraw
                    </button>
                  )}
                </div>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  center: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' },
  empty: {
    textAlign: 'center', padding: '60px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
  },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  cardLeft: { flex: 1 },
  category: {
    fontSize: '11px', fontWeight: 600, color: 'var(--secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'
  },
  gigTitle: {
    fontSize: '18px', fontWeight: 600, marginBottom: '6px',
    cursor: 'pointer', color: 'var(--text-primary)',
    transition: 'color 0.2s'
  },
  gigBudget: { fontSize: '13px', color: 'var(--text-secondary)' },
  statusBadge: {
    padding: '6px 14px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
  },
  details: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px', padding: '16px',
    background: 'rgba(255,255,255,0.03)', borderRadius: '8px'
  },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  detailValue: { fontSize: '15px', fontWeight: 600 },
  coverLetter: {
    padding: '14px', background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px', borderLeft: '3px solid var(--primary)'
  },
  clientNote: {
    padding: '14px', background: 'rgba(72,187,120,0.05)',
    borderRadius: '8px', borderLeft: '3px solid var(--success)'
  },
  coverLabel: { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' },
  coverText: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  actions: { display: 'flex', gap: '12px' },
  viewBtn: {
    padding: '8px 16px', background: 'rgba(108,99,255,0.1)',
    border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px',
    color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  },
  withdrawBtn: {
    padding: '8px 16px', background: 'rgba(252,129,129,0.1)',
    border: '1px solid rgba(252,129,129,0.3)', borderRadius: '8px',
    color: 'var(--error)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
  }
}

export default MyProposals