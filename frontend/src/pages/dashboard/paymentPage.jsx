import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const PaymentPage = () => {
  const [gigs, setGigs] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)
  const [releasing, setReleasing] = useState(null)
  const navigate = useNavigate()

  async function fetchData() {
    setLoading(true)
    try {
      const [gigsRes, paymentsRes] = await Promise.all([
        API.get('/gigs/my/gigs'),
        API.get('/payments/my')
      ])
      setGigs(gigsRes.data.gigs.filter(g => g.hiredFreelancer))
      setPayments(paymentsRes.data.payments)
    } catch (error) {
      console.error('fetchData error:', error)
      toast.error('Failed to load payment data')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePayment = async (gig, amount, type = 'full', index = null) => {
    if (!window.Razorpay) return toast.error('Payment gateway not loaded')
    
    setPaying(index !== null ? `${gig._id}_${index}` : gig._id)

    try {
      const { data } = await API.post('/payments/create-order', {
        gigId: gig._id,
        amount: Number(amount),
        paymentType: type,
        milestoneIndex: index
      })

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'SkillSphere',
        description: type === 'milestone' ? `Milestone: ${gig.milestones[index].title}` : gig.title,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await API.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            toast.success('🛡️ Payment successful and held in Escrow!')
            setPaying(null)
            fetchData()
          } catch (err) {
            toast.error('Verification failed')
            setPaying(null)
          }
        },
        prefill: { email: 'client@skillsphere.com' },
        theme: { color: '#6c63ff' },
        modal: { ondismiss: () => setPaying(null) }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment initiation failed')
      setPaying(null)
    }
  }

  const handleReleaseFunds = async (paymentId) => {
    setReleasing(paymentId)
    try {
      await API.post(`/payments/release/${paymentId}`)
      toast.success('💰 Funds released to freelancer!')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Release failed')
    }
    setReleasing(null)
  }

  const getFreelancerName = (gig) => {
    return (typeof gig.hiredFreelancer === 'object' ? gig.hiredFreelancer?.name : 'Freelancer') || 'Freelancer'
  }

  const statusColor = {
    paid: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    escrowed: { bg: 'rgba(54,162,235,0.15)', color: '#36a2eb' },
    released: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    created: { bg: 'rgba(255,193,7,0.15)', color: '#ffc107' },
    failed: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181' }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Payments & Escrow</h2>

      {loading ? <div style={styles.center}>Loading...</div> : (
        <>
          <div style={styles.statsGrid}>
            <div className="glass" style={styles.statCard}>
              <span style={styles.statIcon}>🛡️</span>
              <span style={styles.statValue}>
                {payments.filter(p => p.status === 'escrowed').length}
              </span>
              <span style={styles.statLabel}>In Escrow</span>
            </div>
            <div className="glass" style={styles.statCard}>
              <span style={styles.statIcon}>💰</span>
              <span style={styles.statValue}>
                ₹{payments.filter(p => p.status === 'released').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </span>
              <span style={styles.statLabel}>Total Released</span>
            </div>
          </div>

          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>🔜 Milestone Payouts</h3>
            {gigs.length === 0 ? <p style={styles.empty}>No active projects found.</p> : (
              <div style={styles.gigList}>
                {gigs.map(gig => (
                  <div key={gig._id} className="glass" style={styles.gigCard}>
                    <div style={styles.gigInfo}>
                      <h4 style={styles.gigTitle}>{gig.title}</h4>
                      <p style={styles.gigMeta}>👤 Freelancer: {getFreelancerName(gig)}</p>
                      
                      {/* Milestones List */}
                      {gig.milestones?.length > 0 ? (
                        <div style={styles.milestoneList}>
                          {gig.milestones.map((m, idx) => (
                            <div key={idx} style={styles.milestoneRow}>
                              <span>{m.title} (₹{m.amount})</span>
                              {m.status === 'pending' ? (
                                <button
                                  className="btn-primary"
                                  onClick={() => handlePayment(gig, m.amount, 'milestone', idx)}
                                  disabled={paying === `${gig._id}_${idx}`}
                                  style={{ padding: '4px 12px', fontSize: '12px', width: 'auto' }}
                                >
                                  {paying === `${gig._id}_${idx}` ? '⏳' : 'Pay Now'}
                                </button>
                              ) : (
                                <span style={{ color: statusColor[m.status === 'paid' ? 'paid' : (m.status === 'funded' ? 'escrowed' : 'released')]?.color, fontSize: '12px', fontWeight: 600 }}>
                                  {m.status === 'funded' ? '🛡️ Funded' : m.status}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => handlePayment(gig, gig.budgetMax, 'full')}
                          disabled={paying === gig._id}
                          style={{ marginTop: '10px' }}
                        >
                          {paying === gig._id ? 'Opening...' : `Full Payment (₹${gig.budgetMax})`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>🛡️ Funds in Escrow</h3>
            <div style={styles.txList}>
              {payments.filter(p => p.status === 'escrowed').length === 0 ? (
                <p style={styles.emptyText}>No funds currently in escrow.</p>
              ) : (
                payments.filter(p => p.status === 'escrowed').map(p => (
                  <div key={p._id} style={styles.txItem}>
                    <div style={styles.txInfo}>
                      <p style={styles.txTitle}>{p.gig?.title}</p>
                      <p style={styles.txMeta}>Amount: ₹{p.amount} · Type: {p.paymentType}</p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => handleReleaseFunds(p._id)}
                      disabled={releasing === p._id}
                      style={{ background: 'var(--success)', width: 'auto' }}
                    >
                      {releasing === p._id ? 'Releasing...' : '✅ Release to Freelancer'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>📋 Transaction History</h3>
            <div style={styles.txList}>
              {payments.length === 0 ? <p style={styles.emptyText}>No transactions yet.</p> : (
                payments.map(p => (
                  <div key={p._id} style={styles.txItem}>
                    <div style={styles.txInfo}>
                      <p style={styles.txTitle}>{p.gig?.title}</p>
                      <p style={styles.txMeta}>To: {p.freelancer?.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={styles.txRight}>
                      <p style={styles.txAmount}>₹{p.amount}</p>
                      <span style={{ ...styles.txStatus, background: statusColor[p.status]?.bg, color: statusColor[p.status]?.color }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  title: { fontSize: '24px', fontWeight: 700 },
  center: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  statCard: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '28px', fontWeight: 700 },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  section: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '17px', fontWeight: 600 },
  empty: { textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' },
  emptyText: { color: 'var(--text-secondary)', fontSize: '14px' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  gigCard: { padding: '20px' },
  gigInfo: { flex: 1 },
  gigTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  gigMeta: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' },
  milestoneList: { display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' },
  milestoneRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' },
  txList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  txItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  txMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  txRight: { textAlign: 'right' },
  txAmount: { fontSize: '18px', fontWeight: 700, marginBottom: '4px' },
  txStatus: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', textTransform: 'capitalize' }
}

export default PaymentPage