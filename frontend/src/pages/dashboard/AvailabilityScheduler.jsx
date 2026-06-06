import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const HOURS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00'
]

const AvailabilityScheduler = () => {
  const { user } = useSelector(state => state.auth)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00'
  })

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get('/availability/my')
        setSlots(data.slots)
      } catch (error) {
        toast.error('Failed to load slots')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAddSlot = async (e) => {
    e.preventDefault()
    if (!form.date) return toast.error('Select a date')
    if (form.startTime >= form.endTime) {
      return toast.error('End time must be after start time')
    }
    setAdding(true)
    try {
      const { data } = await API.post('/availability/slots', form)
      setSlots(data.slots)
      setForm({ date: '', startTime: '09:00', endTime: '17:00' })
      toast.success('Availability slot added!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add slot')
    }
    setAdding(false)
  }

  const handleRemoveSlot = async (slotId) => {
    try {
      await API.delete(`/availability/slots/${slotId}`)
      setSlots(slots.filter(s => s._id !== slotId))
      toast.success('Slot removed')
    } catch (error) {
      toast.error('Failed to remove slot')
    }
  }

  // Group slots by date
  const groupedSlots = slots.reduce((groups, slot) => {
    const date = new Date(slot.date).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(slot)
    return groups
  }, {})

  // Get today's date for min
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📅 Availability Scheduler</h2>
          <p style={styles.subtitle}>
            Set your available time slots for client bookings
          </p>
        </div>
        <div style={{
          ...styles.statusBadge,
          background: slots.filter(s => !s.isBooked).length > 0
            ? 'rgba(72,187,120,0.15)' : 'rgba(252,129,129,0.15)',
          color: slots.filter(s => !s.isBooked).length > 0
            ? 'var(--success)' : 'var(--error)'
        }}>
          {slots.filter(s => !s.isBooked).length > 0
            ? '🟢 Available' : '🔴 No slots'}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Slots', value: slots.length, icon: '📅' },
          { label: 'Available', value: slots.filter(s => !s.isBooked).length, icon: '✅' },
          { label: 'Booked', value: slots.filter(s => s.isBooked).length, icon: '🔒' }
        ].map((stat, i) => (
          <div key={i} className="glass" style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.layout}>

        {/* Add Slot Form */}
        <div className="glass" style={styles.formCard}>
          <h3 style={styles.sectionTitle}>➕ Add Availability Slot</h3>

          <form onSubmit={handleAddSlot} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Date</label>
              <input
                className="input"
                type="date"
                min={today}
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Start Time</label>
              <select
                className="input"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>End Time</label>
              <select
                className="input"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={adding}
            >
              {adding ? 'Adding...' : '➕ Add Slot'}
            </button>
          </form>

          {/* Quick add buttons */}
          <div style={styles.quickAdd}>
            <p style={styles.quickTitle}>Quick Add:</p>
            <div style={styles.quickBtns}>
              {[
                { label: 'Morning', start: '09:00', end: '12:00' },
                { label: 'Afternoon', start: '13:00', end: '17:00' },
                { label: 'Full Day', start: '09:00', end: '18:00' }
              ].map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    startTime: q.start,
                    endTime: q.end
                  })}
                  style={styles.quickBtn}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div style={styles.calendarSection}>
          <h3 style={styles.sectionTitle}>📆 Your Schedule</h3>

          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <div className="glass" style={styles.emptyCard}>
              <p style={{ fontSize: '40px' }}>📅</p>
              <p style={{ fontWeight: 600 }}>No slots added yet</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Add your available time slots so clients can book you
              </p>
            </div>
          ) : (
            Object.entries(groupedSlots)
              .sort((a, b) => new Date(a[0]) - new Date(b[0]))
              .map(([date, daySlots]) => (
                <div key={date} className="glass" style={styles.dayCard}>
                  <div style={styles.dayHeader}>
                    <span style={styles.dayDate}>📅 {date}</span>
                    <span style={styles.dayCount}>
                      {daySlots.filter(s => !s.isBooked).length} available
                    </span>
                  </div>

                  <div style={styles.slotList}>
                    {daySlots
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(slot => (
                        <div key={slot._id} style={{
                          ...styles.slotItem,
                          background: slot.isBooked
                            ? 'rgba(252,129,129,0.1)'
                            : 'rgba(72,187,120,0.1)',
                          borderColor: slot.isBooked
                            ? 'rgba(252,129,129,0.3)'
                            : 'rgba(72,187,120,0.3)'
                        }}>
                          <div style={styles.slotTime}>
                            <span style={styles.timeIcon}>🕐</span>
                            <span style={styles.timeText}>
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </div>

                          <div style={styles.slotRight}>
                            {slot.isBooked ? (
                              <div style={styles.bookedInfo}>
                                <span style={styles.bookedBadge}>
                                  🔒 Booked
                                </span>
                                {slot.bookedBy && (
                                  <span style={styles.bookedBy}>
                                    by {slot.bookedBy.name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={styles.availableBadge}>
                                ✅ Available
                              </span>
                            )}

                            {!slot.isBooked && (
                              <button
                                onClick={() => handleRemoveSlot(slot._id)}
                                style={styles.removeBtn}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="glass" style={styles.tipsCard}>
        <h4 style={styles.sectionTitle}>💡 Tips</h4>
        <div style={styles.tipsList}>
          {[
            '📅 Add slots at least 2-3 days in advance',
            '🕐 Morning slots (9AM-12PM) get booked faster',
            '💬 Clients can message you after booking',
            '🔒 Booked slots cannot be removed'
          ].map((tip, i) => (
            <p key={i} style={styles.tip}>{tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  statusBadge: { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '28px', fontWeight: 700 },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' },
  formCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  quickAdd: { marginTop: '8px' },
  quickTitle: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' },
  quickBtns: { display: 'flex', gap: '8px' },
  quickBtn: { padding: '6px 12px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '6px', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
  calendarSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { color: 'var(--text-secondary)', fontSize: '13px' },
  emptyCard: { padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  dayCard: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dayDate: { fontSize: '14px', fontWeight: 600 },
  dayCount: { fontSize: '12px', color: 'var(--success)' },
  slotList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  slotItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid' },
  slotTime: { display: 'flex', alignItems: 'center', gap: '8px' },
  timeIcon: { fontSize: '16px' },
  timeText: { fontSize: '14px', fontWeight: 500 },
  slotRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  bookedInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  bookedBadge: { fontSize: '12px', color: 'var(--error)', fontWeight: 600 },
  bookedBy: { fontSize: '12px', color: 'var(--text-secondary)' },
  availableBadge: { fontSize: '12px', color: 'var(--success)', fontWeight: 600 },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px', padding: '4px' },
  tipsCard: { padding: '20px' },
  tipsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  tip: { fontSize: '13px', color: 'var(--text-secondary)' }
}

export default AvailabilityScheduler