import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AdminGigs = () => {
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { fetchGigs() }, [filter])

  const fetchGigs = async () => {
    setLoading(true)
    try {
      const { data } = await API.get(`/admin/gigs${filter ? `?status=${filter}` : ''}`)
      setGigs(data.gigs)
    } catch (error) {
      toast.error('Failed to load gigs')
    }
    setLoading(false)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/admin/gigs/${id}/status`, { status: newStatus })
      toast.success(`Gig marked as ${newStatus}`)
      fetchGigs()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const statusColors = {
    open: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    in_progress: { bg: 'rgba(108,99,255,0.15)', color: '#6c63ff' },
    completed: { bg: 'rgba(0,188,212,0.15)', color: '#00bcd4' },
    closed: { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Manage Gigs</h2>
        <div style={styles.filters}>
          {['', 'open', 'in_progress', 'completed', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                ...styles.filterBtn,
                ...(filter === s ? styles.filterBtnActive : {})
              }}
            >
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass" style={styles.section}>
        {loading ? (
          <p style={styles.empty}>Loading gigs...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Gig Info', 'Client', 'Budget', 'Status', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gigs.map(gig => (
                <tr key={gig._id} style={styles.tr}>
                  <td style={styles.td}>
                    <p style={styles.gigTitle}>{gig.title}</p>
                    <p style={styles.gigCategory}>{gig.category}</p>
                  </td>
                  <td style={styles.td}>
                    <p style={styles.clientName}>{gig.client?.name}</p>
                    <p style={styles.clientEmail}>{gig.client?.email}</p>
                  </td>
                  <td style={styles.td}>₹{gig.budgetMax?.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: statusColors[gig.status]?.bg,
                      color: statusColors[gig.status]?.color
                    }}>
                      {gig.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <select
                      style={styles.select}
                      value={gig.status}
                      onChange={(e) => handleStatusChange(gig._id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="closed">Closed</option>
                    </select>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700 },
  filters: { display: 'flex', gap: '8px' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize', transition: 'all 0.2s' },
  filterBtnActive: { background: 'rgba(108,99,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)' },
  section: { padding: '24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' },
  td: { padding: '16px 12px', fontSize: '14px' },
  gigTitle: { fontWeight: 600, fontSize: '14px', marginBottom: '2px' },
  gigCategory: { fontSize: '12px', color: 'var(--text-secondary)' },
  clientName: { fontWeight: 500, fontSize: '13px' },
  clientEmail: { fontSize: '11px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
  select: { padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer', outline: 'none' },
  empty: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }
}

export default AdminGigs
