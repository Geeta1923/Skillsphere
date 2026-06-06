import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [resolveForm, setResolveForm] = useState({
    resolution: '', adminNotes: '', status: 'resolved'
  })
  const [resolving, setResolving] = useState(false)

  useEffect(() => { fetchDisputes() }, [filter])

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const { data } = await API.get(`/disputes${params}`)
      setDisputes(data.disputes)
    } catch (error) {
      toast.error('Failed to load disputes')
    }
    setLoading(false)
  }

  const fetchDispute = async (id) => {
    try {
      const { data } = await API.get(`/disputes/${id}`)
      setSelected(data.dispute)
    } catch (error) {
      toast.error('Failed to load dispute')
    }
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!resolveForm.resolution) return toast.error('Enter resolution')
    setResolving(true)
    try {
      await API.put(`/disputes/${selected._id}/resolve`, resolveForm)
      toast.success('Dispute resolved!')
      fetchDisputes()
      setSelected(null)
    } catch (error) {
      toast.error('Failed to resolve')
    }
    setResolving(false)
  }

  const statusStyles = {
    open: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181' },
    under_review: { bg: 'rgba(255,193,7,0.15)', color: '#ffc107' },
    resolved: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    closed: { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚖️ Manage Disputes</h2>

      <div style={styles.filters}>
        {['', 'open', 'under_review', 'resolved', 'closed'].map(s => (
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

      <div style={styles.layout}>
        {/* List */}
        <div style={styles.list}>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : disputes.length === 0 ? (
            <p style={styles.empty}>No disputes found</p>
          ) : disputes.map(d => (
            <div
              key={d._id}
              className="glass"
              style={{
                ...styles.disputeCard,
                ...(selected?._id === d._id ? styles.active : {})
              }}
              onClick={() => fetchDispute(d._id)}
            >
              <div style={styles.cardTop}>
                <p style={styles.cardTitle}>{d.gig?.title?.slice(0, 25)}...</p>
                <span style={{
                  ...styles.badge,
                  background: statusStyles[d.status]?.bg,
                  color: statusStyles[d.status]?.color
                }}>
                  {d.status.replace('_', ' ')}
                </span>
              </div>
              <p style={styles.cardMeta}>
                {d.raisedBy?.name} vs {d.against?.name}
              </p>
              <p style={styles.cardReason}>{d.reason}</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={styles.detail}>
          {!selected ? (
            <div className="glass" style={styles.noSelect}>
              <p style={{ fontSize: '40px' }}>⚖️</p>
              <p style={{ fontWeight: 600 }}>Select a dispute to review</p>
            </div>
          ) : (
            <>
              <div className="glass" style={styles.detailCard}>
                <h3 style={styles.detailTitle}>{selected.gig?.title}</h3>
                <div style={styles.partiesRow}>
                  <div style={styles.party}>
                    <p style={styles.partyLabel}>Raised By</p>
                    <p style={styles.partyName}>{selected.raisedBy?.name}</p>
                    <p style={styles.partyEmail}>{selected.raisedBy?.email}</p>
                  </div>
                  <span style={styles.vs}>VS</span>
                  <div style={styles.party}>
                    <p style={styles.partyLabel}>Against</p>
                    <p style={styles.partyName}>{selected.against?.name}</p>
                    <p style={styles.partyEmail}>{selected.against?.email}</p>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>Reason: <span style={styles.infoVal}>{selected.reason}</span></p>
                  <p style={styles.infoLabel}>Description:</p>
                  <p style={styles.descText}>{selected.description}</p>
                </div>

                {/* Evidence Display for Admin */}
                {selected.evidence?.length > 0 && (
                  <div style={styles.evidenceBox}>
                    <p style={styles.infoLabel}>📎 Attached Evidence</p>
                    <div style={styles.evidenceList}>
                      {selected.evidence.map((ev, i) => (
                        <a
                          key={i}
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.evidenceLink}
                        >
                          <span style={{ fontSize: '16px' }}>
                            {ev.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? '🖼️' : '📄'}
                          </span>
                          <span style={styles.evidenceName}>
                            {ev.description || `Evidence ${i + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {selected.messages?.length > 0 && (
                  <div style={styles.msgs}>
                    <p style={styles.infoLabel}>Messages ({selected.messages.length})</p>
                    {selected.messages.map((m, i) => (
                      <div key={i} style={styles.msgItem}>
                        <strong style={{ fontSize: '13px' }}>{m.sender?.name}:</strong>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{m.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolve Form */}
              {selected.status !== 'resolved' && selected.status !== 'closed' && (
                <div className="glass" style={styles.resolveCard}>
                  <h4 style={styles.resolveTitle}>⚖️ Resolve Dispute</h4>
                  <form onSubmit={handleResolve} style={styles.form}>
                    <div style={styles.field}>
                      <label style={styles.label}>Resolution Decision *</label>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Enter your resolution decision..."
                        value={resolveForm.resolution}
                        onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                        style={{ resize: 'vertical' }}
                        required
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Admin Notes (internal)</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Internal notes..."
                        value={resolveForm.adminNotes}
                        onChange={e => setResolveForm({ ...resolveForm, adminNotes: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Final Status</label>
                      <select
                        className="input"
                        value={resolveForm.status}
                        onChange={e => setResolveForm({ ...resolveForm, status: e.target.value })}
                      >
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed (No Action)</option>
                      </select>
                    </div>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={resolving}
                      style={{ maxWidth: '200px' }}
                    >
                      {resolving ? 'Resolving...' : '✅ Resolve Dispute'}
                    </button>
                  </form>
                </div>
              )}

              {selected.resolution && (
                <div className="glass" style={styles.resolvedBox}>
                  <p style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Resolved</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>{selected.resolution}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  title: { fontSize: '24px', fontWeight: 700 },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize' },
  filterBtnActive: { background: 'rgba(108,99,255,0.15)', border: '1px solid var(--primary)', color: 'var(--primary)' },
  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: { color: 'var(--text-secondary)', fontSize: '13px' },
  disputeCard: { padding: '14px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '6px' },
  active: { border: '1px solid var(--primary)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  cardTitle: { fontSize: '13px', fontWeight: 600, flex: 1 },
  badge: { padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  cardMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  cardReason: { fontSize: '11px', color: 'var(--secondary)' },
  detail: { display: 'flex', flexDirection: 'column', gap: '16px' },
  noSelect: { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  detailCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  detailTitle: { fontSize: '18px', fontWeight: 600 },
  partiesRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' },
  party: { flex: 1, textAlign: 'center' },
  partyLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' },
  partyName: { fontSize: '15px', fontWeight: 600 },
  partyEmail: { fontSize: '12px', color: 'var(--text-secondary)' },
  vs: { fontSize: '18px', fontWeight: 700, color: 'var(--error)', flexShrink: 0 },
  infoBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  infoVal: { color: 'var(--text-primary)', fontWeight: 500 },
  descText: { fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' },
  msgs: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' },
  msgItem: { padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  resolveCard: { padding: '24px' },
  resolveTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  resolvedBox: { padding: '20px' },
  evidenceBox: { marginTop: '10px' },
  evidenceList: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' },
  evidenceLink: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' },
  evidenceName: { color: 'var(--primary)', fontWeight: 500 }
}

export default AdminDisputes