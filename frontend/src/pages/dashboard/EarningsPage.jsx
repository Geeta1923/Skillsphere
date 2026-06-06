import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const EarningsPage = () => {
  const [payments, setPayments] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [monthlyData, setMonthlyData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true)
      try {
        const { data } = await API.get('/payments/earnings')
        setPayments(data.payments)
        setTotalEarnings(data.totalEarnings)
        setMonthlyData(data.monthlyData)
      } catch (error) {
        console.error('Failed to load earnings:', error)
        toast.error('Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }
    fetchEarnings()
  }, [])

  const maxMonthly = Math.max(...Object.values(monthlyData), 1)

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 Earnings</h2>

      {loading ? (
        <div style={styles.center}>Loading earnings...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={styles.statsGrid}>
            <div className="glass" style={styles.statCard}>
              <span style={styles.statIcon}>💰</span>
              <span style={styles.statValue}>
                ₹{totalEarnings.toLocaleString()}
              </span>
              <span style={styles.statLabel}>Total Earnings</span>
            </div>
            <div className="glass" style={styles.statCard}>
              <span style={styles.statIcon}>✅</span>
              <span style={styles.statValue}>{payments.length}</span>
              <span style={styles.statLabel}>Completed Payments</span>
            </div>
            <div className="glass" style={styles.statCard}>
              <span style={styles.statIcon}>📊</span>
              <span style={styles.statValue}>
                ₹{payments.length > 0
                  ? Math.round(totalEarnings / payments.length).toLocaleString()
                  : 0}
              </span>
              <span style={styles.statLabel}>Avg per Project</span>
            </div>
          </div>

          {/* Monthly Chart */}
          {Object.keys(monthlyData).length > 0 && (
            <div className="glass" style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>Monthly Revenue</h3>
              <div style={styles.chart}>
                {Object.entries(monthlyData).map(([month, amount]) => (
                  <div key={month} style={styles.barWrapper}>
                    <span style={styles.barAmount}>
                      ₹{(amount/1000).toFixed(1)}k
                    </span>
                    <div style={styles.barTrack}>
                      <div style={{
                        ...styles.barFill,
                        height: `${(amount / maxMonthly) * 100}%`
                      }} />
                    </div>
                    <span style={styles.barMonth}>{month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>Transaction History</h3>

            {payments.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: '40px' }}>💸</p>
                <p style={{ fontWeight: 600 }}>No earnings yet</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Complete gigs to start earning!
                </p>
              </div>
            ) : (
              <div style={styles.txList}>
                {payments.map(payment => (
                  <div key={payment._id} style={styles.txItem}>
                    <div style={styles.txIcon}>💰</div>
                    <div style={styles.txInfo}>
                      <p style={styles.txTitle}>{payment.gig?.title}</p>
                      <p style={styles.txMeta}>
                        From {payment.client?.name} ·{' '}
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={styles.txRight}>
                      <p style={styles.txAmount}>
                        +₹{payment.amount.toLocaleString()}
                      </p>
                      <span style={styles.txStatus}>✅ Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' },
  statIcon: { fontSize: '32px' },
  statValue: { fontSize: '28px', fontWeight: 700, color: 'var(--success)' },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  chartSection: { padding: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '20px' },
  chart: { display: 'flex', gap: '16px', alignItems: 'flex-end', height: '160px' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  barAmount: { fontSize: '11px', color: 'var(--text-secondary)' },
  barTrack: { flex: 1, width: '100%', background: 'var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', background: 'linear-gradient(180deg, var(--primary), var(--secondary))', borderRadius: '4px', transition: 'height 0.5s', minHeight: '4px' },
  barMonth: { fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' },
  section: { padding: '24px' },
  empty: { textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  txList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  txItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' },
  txIcon: { fontSize: '28px', flexShrink: 0 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  txMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  txRight: { textAlign: 'right' },
  txAmount: { fontSize: '18px', fontWeight: 700, color: 'var(--success)', marginBottom: '4px' },
  txStatus: { fontSize: '12px', color: 'var(--success)' }
}

export default EarningsPage