import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    try {
      const { data } = await API.get('/admin/payments')
      setPayments(data.payments)
    } catch (error) {
      toast.error('Failed to load payments')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>💰 Payment Monitoring</h2>
        <p style={styles.subtitle}>Track all transactions across the platform</p>
      </div>

      <div className="glass" style={styles.section}>
        {loading ? (
          <p style={styles.empty}>Loading transactions...</p>
        ) : payments.length === 0 ? (
          <p style={styles.empty}>No transactions found</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Transaction Date', 'Gig', 'Client', 'Freelancer', 'Amount', 'Status'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment._id} style={styles.tr}>
                  <td style={styles.td}>
                    {new Date(payment.createdAt).toLocaleDateString()}
                    <br />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(payment.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <p style={styles.gigTitle}>{payment.gig?.title || 'Unknown Gig'}</p>
                    <p style={styles.paymentId}>ID: {payment._id}</p>
                  </td>
                  <td style={styles.td}>
                    {payment.client?.name}
                  </td>
                  <td style={styles.td}>
                    {payment.freelancer?.name}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: 'var(--success)' }}>
                    ₹{payment.amount?.toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: payment.status === 'paid' ? 'rgba(72,187,120,0.15)' : 'rgba(255,193,7,0.15)',
                      color: payment.status === 'paid' ? '#48bb78' : '#ffc107'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  section: { padding: '24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '16px 12px', fontSize: '13px' },
  gigTitle: { fontWeight: 600, fontSize: '13px' },
  paymentId: { fontSize: '10px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }
}

export default AdminPayments
