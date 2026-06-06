import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchUsers() }, [page, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)
      params.append('page', page)
      const { data } = await API.get(`/admin/users?${params}`)
      setUsers(data.users)
      setTotalPages(data.pages)
    } catch (error) {
      toast.error('Failed to load users')
    }
    setLoading(false)
  }

  const handleSuspend = async (userId) => {
    try {
      const { data } = await API.put(`/admin/users/${userId}/suspend`)
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u))
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed')
    }
  }

  const handleVerify = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/verify`)
      setUsers(users.map(u => u._id === userId ? { ...u, isVerified: true } : u))
      toast.success('Freelancer verified!')
    } catch (error) {
      toast.error('Failed to verify')
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return
    try {
      await API.delete(`/admin/users/${userId}`)
      setUsers(users.filter(u => u._id !== userId))
      toast.success('User deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed')
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 Manage Users</h2>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          className="input"
          placeholder="🔍 Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          style={{ flex: 1 }}
        />
        <select className="input" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ width: '150px' }}>
          <option value="">All Roles</option>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-primary"
          onClick={fetchUsers} style={{ width: '100px' }}>
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="glass" style={styles.tableCard}>
        {loading ? (
          <div style={styles.center}>Loading...</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['User', 'Role', 'Joined', 'Verified', 'Status', 'Actions'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.avatar}>
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <p style={styles.userName}>{user.name}</p>
                          <p style={styles.userEmail}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: user.role === 'freelancer'
                          ? 'rgba(0,212,255,0.15)'
                          : user.role === 'admin'
                          ? 'rgba(252,129,129,0.15)'
                          : 'rgba(72,187,120,0.15)',
                        color: user.role === 'freelancer'
                          ? 'var(--secondary)'
                          : user.role === 'admin'
                          ? 'var(--error)'
                          : 'var(--success)'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      {user.isVerified
                        ? <span style={styles.verified}>✅ Verified</span>
                        : user.role === 'freelancer'
                        ? <button
                            onClick={() => handleVerify(user._id)}
                            style={styles.verifyBtn}
                          >
                            Verify
                          </button>
                        : <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      }
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        background: user.isActive
                          ? 'rgba(72,187,120,0.15)' : 'rgba(252,129,129,0.15)',
                        color: user.isActive ? 'var(--success)' : 'var(--error)'
                      }}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {user.role !== 'admin' && (
                        <div style={styles.actions}>
                          <button
                            onClick={() => handleSuspend(user._id)}
                            style={{
                              ...styles.actionBtn,
                              color: user.isActive ? 'var(--error)' : 'var(--success)',
                              borderColor: user.isActive ? 'rgba(252,129,129,0.3)' : 'rgba(72,187,120,0.3)'
                            }}
                          >
                            {user.isActive ? '🔒 Suspend' : '🔓 Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            style={{ ...styles.actionBtn, color: 'var(--error)', borderColor: 'rgba(252,129,129,0.3)' }}
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              ...styles.pageBtn,
              ...(page === p ? styles.pageBtnActive : {})
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  title: { fontSize: '24px', fontWeight: 700 },
  filters: { display: 'flex', gap: '12px' },
  tableCard: { padding: '0', overflow: 'hidden' },
  center: { padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'left', background: 'rgba(255,255,255,0.02)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' },
  td: { padding: '14px 16px', fontSize: '13px' },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 },
  userName: { fontWeight: 500, marginBottom: '2px' },
  userEmail: { fontSize: '12px', color: 'var(--text-secondary)' },
  badge: { padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
  verified: { color: 'var(--success)', fontSize: '12px' },
  verifyBtn: { padding: '4px 12px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '6px', color: 'var(--secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
  actions: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '5px 10px', background: 'transparent', border: '1px solid', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px' },
  pageBtn: { width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' },
  pageBtnActive: { background: 'var(--primary)', border: '1px solid var(--primary)', color: 'white' }
}

export default AdminUsers