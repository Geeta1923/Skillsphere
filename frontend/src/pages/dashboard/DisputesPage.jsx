import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const DisputesPage = () => {
  const { user } = useSelector(state => state.auth)
  const [disputes, setDisputes] = useState([])
  const [myGigs, setMyGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState([]) // New state for files

  const [form, setForm] = useState({
    gigId: '',
    reason: '',
    description: ''
  })

  const reasons = [
    'Payment not received',
    'Work not delivered',
    'Poor quality work',
    'Missed deadline',
    'Fraud or scam',
    'Other'
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [disputesRes, gigsRes] = await Promise.all([
        API.get('/disputes/my'),
        user.role === 'client'
          ? API.get('/gigs/my/gigs')
          : API.get('/proposals/my')
      ])
      setDisputes(disputesRes.data.disputes)
      if (user.role === 'client') {
        setMyGigs(gigsRes.data.gigs.filter(g => g.hiredFreelancer))
      }
    } catch (error) {
      toast.error('Failed to load disputes')
    }
    setLoading(false)
  }

  const handleCreateDispute = async (e) => {
    e.preventDefault()
    if (!form.gigId || !form.reason || !form.description) {
      return toast.error('Please fill all fields')
    }
    setSubmitting(true)
    try {
      const formData = new FormData();
      formData.append('gigId', form.gigId);
      formData.append('reason', form.reason);
      formData.append('description', form.description);
      
      // Append files
      evidenceFiles.forEach(file => {
        formData.append('evidence', file);
      });

      await API.post('/disputes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('Dispute raised successfully!')
      setShowForm(false)
      setForm({ gigId: '', reason: '', description: '' })
      setEvidenceFiles([])
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to raise dispute')
    }
    setSubmitting(false)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      const { data } = await API.post(
        `/disputes/${selectedDispute._id}/message`,
        { message: newMessage }
      )
      setSelectedDispute(prev => ({ ...prev, messages: data.messages }))
      setNewMessage('')
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const fetchDispute = async (id) => {
    try {
      const { data } = await API.get(`/disputes/${id}`)
      setSelectedDispute(data.dispute)
    } catch (error) {
      toast.error('Failed to load dispute')
    }
  }

  const statusStyles = {
    open: { bg: 'rgba(252,129,129,0.15)', color: '#fc8181' },
    under_review: { bg: 'rgba(255,193,7,0.15)', color: '#ffc107' },
    resolved: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    closed: { bg: 'rgba(160,174,192,0.15)', color: '#a0aec0' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚖️ Dispute Resolution</h2>
          <p style={styles.subtitle}>
            Raise and track disputes for your projects
          </p>
        </div>
        {user.role === 'client' && myGigs.length > 0 && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            {showForm ? 'Cancel' : '⚠️ Raise Dispute'}
          </button>
        )}
        {user.role === 'freelancer' && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            {showForm ? 'Cancel' : '⚠️ Raise Dispute'}
          </button>
        )}
      </div>

      {/* Raise Dispute Form */}
      {showForm && (
        <div className="glass" style={styles.formCard}>
          <h3 style={styles.sectionTitle}>⚠️ Raise a Dispute</h3>
          <form onSubmit={handleCreateDispute} style={styles.form}>

            {user.role === 'client' && (
              <div style={styles.field}>
                <label style={styles.label}>Select Gig</label>
                <select
                  className="input"
                  value={form.gigId}
                  onChange={e => setForm({ ...form, gigId: e.target.value })}
                  required
                >
                  <option value="">Select a gig...</option>
                  {myGigs.map(gig => (
                    <option key={gig._id} value={gig._id}>
                      {gig.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user.role === 'freelancer' && (
              <div style={styles.field}>
                <label style={styles.label}>Gig ID</label>
                <input
                  className="input"
                  placeholder="Enter the gig ID"
                  value={form.gigId}
                  onChange={e => setForm({ ...form, gigId: e.target.value })}
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Reason</label>
              <select
                className="input"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                required
              >
                <option value="">Select reason...</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ resize: 'vertical' }}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Evidence (Images/PDFs, max 5)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={e => setEvidenceFiles(Array.from(e.target.files))}
                className="input"
                style={{ paddingTop: '8px' }}
              />
              {evidenceFiles.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--primary)' }}>
                  {evidenceFiles.length} file(s) selected
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={submitting}
              style={{ maxWidth: '200px' }}
            >
              {submitting ? 'Submitting...' : '⚠️ Submit Dispute'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.layout}>
        {/* Disputes List */}
        <div style={styles.disputeList}>
          <h3 style={styles.sectionTitle}>
            My Disputes ({disputes.length})
          </h3>

          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : disputes.length === 0 ? (
            <div className="glass" style={styles.emptyCard}>
              <p style={{ fontSize: '40px' }}>⚖️</p>
              <p style={{ fontWeight: 600 }}>No disputes</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Raise a dispute if you have payment or work issues
              </p>
            </div>
          ) : (
            disputes.map(dispute => (
              <div
                key={dispute._id}
                className="glass"
                style={{
                  ...styles.disputeCard,
                  ...(selectedDispute?._id === dispute._id
                    ? styles.disputeCardActive : {})
                }}
                onClick={() => fetchDispute(dispute._id)}
              >
                <div style={styles.disputeHeader}>
                  <span style={styles.disputeGig}>
                    {dispute.gig?.title?.slice(0, 30)}...
                  </span>
                  <span style={{
                    ...styles.statusBadge,
                    background: statusStyles[dispute.status]?.bg,
                    color: statusStyles[dispute.status]?.color
                  }}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>
                <p style={styles.disputeReason}>{dispute.reason}</p>
                <div style={styles.disputeMeta}>
                  <span>vs {
                    dispute.raisedBy?._id === user._id
                      ? dispute.against?.name
                      : dispute.raisedBy?.name
                  }</span>
                  <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dispute Detail */}
        <div style={styles.disputeDetail}>
          {!selectedDispute ? (
            <div className="glass" style={styles.noSelect}>
              <p style={{ fontSize: '40px' }}>⚖️</p>
              <p style={{ fontWeight: 600 }}>Select a dispute</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Click a dispute to view details
              </p>
            </div>
          ) : (
            <>
              {/* Dispute Info */}
              <div className="glass" style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <div>
                    <h3 style={styles.detailTitle}>
                      {selectedDispute.gig?.title}
                    </h3>
                    <p style={styles.detailMeta}>
                      Raised by {selectedDispute.raisedBy?.name}
                      {' · '}
                      {new Date(selectedDispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: statusStyles[selectedDispute.status]?.bg,
                    color: statusStyles[selectedDispute.status]?.color
                  }}>
                    {selectedDispute.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Reason</span>
                    <span style={styles.infoValue}>{selectedDispute.reason}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Against</span>
                    <span style={styles.infoValue}>
                      {selectedDispute.against?.name}
                    </span>
                  </div>
                </div>

                <div style={styles.descBox}>
                  <p style={styles.infoLabel}>Description</p>
                  <p style={styles.descText}>{selectedDispute.description}</p>
                </div>

                {/* Evidence Files Display */}
                {selectedDispute.evidence?.length > 0 && (
                  <div style={styles.evidenceBox}>
                    <p style={styles.infoLabel}>📎 Attached Evidence</p>
                    <div style={styles.evidenceList}>
                      {selectedDispute.evidence.map((ev, i) => (
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

                {/* Resolution */}
                {selectedDispute.resolution && (
                  <div style={styles.resolutionBox}>
                    <p style={styles.resolutionLabel}>
                      ✅ Admin Resolution
                    </p>
                    <p style={styles.resolutionText}>
                      {selectedDispute.resolution}
                    </p>
                    <p style={styles.resolutionMeta}>
                      Resolved by {selectedDispute.resolvedBy?.name}
                      {' · '}
                      {new Date(selectedDispute.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="glass" style={styles.messagesCard}>
                <h4 style={styles.sectionTitle}>💬 Mediation Messages</h4>

                <div style={styles.messageList}>
                  {selectedDispute.messages?.length === 0 ? (
                    <p style={styles.empty}>
                      No messages yet — add context to help admin resolve faster
                    </p>
                  ) : (
                    selectedDispute.messages?.map((msg, i) => (
                      <div key={i} style={{
                        ...styles.msgItem,
                        alignSelf: msg.sender?._id === user._id
                          ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={styles.msgAvatar}>
                          {msg.sender?.name?.charAt(0)}
                        </div>
                        <div style={{
                          ...styles.msgBubble,
                          background: msg.sender?._id === user._id
                            ? 'rgba(108,99,255,0.2)'
                            : 'rgba(255,255,255,0.05)'
                        }}>
                          <p style={styles.msgSender}>
                            {msg.sender?.name}
                          </p>
                          <p style={styles.msgText}>{msg.message}</p>
                          <p style={styles.msgTime}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                {selectedDispute.status !== 'resolved' &&
                  selectedDispute.status !== 'closed' && (
                  <form onSubmit={handleSendMessage} style={styles.msgForm}>
                    <input
                      className="input"
                      placeholder="Add context or evidence description..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      style={styles.sendBtn}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  formCard: { padding: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', alignItems: 'start' },
  disputeList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: { color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' },
  emptyCard: { padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  disputeCard: { padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' },
  disputeCardActive: { border: '1px solid var(--primary)' },
  disputeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  disputeGig: { fontSize: '13px', fontWeight: 600, flex: 1 },
  statusBadge: { padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  disputeReason: { fontSize: '12px', color: 'var(--secondary)' },
  disputeMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' },
  disputeDetail: { display: 'flex', flexDirection: 'column', gap: '16px' },
  noSelect: { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  detailCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '4px' },
  detailMeta: { fontSize: '13px', color: 'var(--text-secondary)' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  infoValue: { fontSize: '14px', fontWeight: 500 },
  descBox: { padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  descText: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  resolutionBox: { padding: '16px', background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  resolutionLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--success)' },
  resolutionText: { fontSize: '14px', lineHeight: 1.6 },
  resolutionMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  messagesCard: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' },
  msgItem: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
  msgAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  msgBubble: { padding: '10px 14px', borderRadius: '12px', maxWidth: '80%' },
  msgSender: { fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--primary)' },
  msgText: { fontSize: '13px', lineHeight: 1.5 },
  msgTime: { fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' },
  msgForm: { display: 'flex', gap: '10px' },
  sendBtn: { padding: '10px 20px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  evidenceBox: { marginTop: '10px' },
  evidenceList: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' },
  evidenceLink: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' },
  evidenceName: { color: 'var(--primary)', fontWeight: 500 }
}

export default DisputesPage