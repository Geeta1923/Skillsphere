import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const MentorMarketplace = () => {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [bookingData, setBookingData] = useState({ topic: '', date: '', time: '' })
  const { user } = useSelector(state => state.auth)

  const fetchMentors = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/mentorship/mentors')
      setMentors(data.mentors)
    } catch (error) {
      toast.error('Failed to load mentors')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMentors()
  }, [])

  const handleBookSession = async (e) => {
    e.preventDefault()
    if (!window.Razorpay) return toast.error('Payment gateway not loaded. Please refresh.')

    try {
      // 1. Create Order
      const { data } = await API.post('/mentorship/create-order', {
        mentorId: selectedMentor.user._id,
        slot: { date: bookingData.date, startTime: bookingData.time, endTime: bookingData.time },
        amount: selectedMentor.mentorshipRate,
        topic: bookingData.topic
      })

      // 2. Open Razorpay
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'SkillSphere Mentorship',
        description: `Mentorship with ${selectedMentor.user.name}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await API.post('/mentorship/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            toast.success('🛡️ Session booked and payment held in Escrow!')
            setShowBookingModal(false)
          } catch (err) {
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: { color: '#6c63ff' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment initiation failed')
    }
  }

  return (
    <div style={styles.container}>
      <header className="glass" style={styles.header}>
        <h1 style={styles.title}>🎓 Mentor Marketplace</h1>
        <p style={styles.subtitle}>Learn from the best in the community. Master your skills with 1-on-1 mentorship.</p>
      </header>

      {loading ? (
        <div style={styles.loader}>Loading mentors...</div>
      ) : (
        <div style={styles.grid}>
          {mentors.map((mentor) => (
            <div key={mentor._id} className="glass" style={styles.mentorCard}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {mentor.user?.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={styles.mentorName}>{mentor.user?.name}</h3>
                  <p style={styles.mentorTitle}>{mentor.title}</p>
                </div>
              </div>
              
              <div style={styles.specialties}>
                {mentor.mentorshipSpecialties.map((s, i) => (
                  <span key={i} style={styles.specialtyTag}>{s}</span>
                ))}
              </div>

              <div style={styles.divider} />

              <div style={styles.cardFooter}>
                <div style={styles.rateInfo}>
                  <span style={styles.rateLabel}>Per Session</span>
                  <span style={styles.rateValue}>₹{mentor.mentorshipRate}</span>
                </div>
                <button 
                  className="btn-primary" 
                  style={styles.bookBtn}
                  onClick={() => {
                    setSelectedMentor(mentor)
                    setShowBookingModal(true)
                  }}
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modal}>
            <h2 style={styles.modalTitle}>Book Mentorship with {selectedMentor?.user?.name}</h2>
            <form onSubmit={handleBookSession} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>What do you want to learn?</label>
                <input 
                  className="input" 
                  placeholder="e.g. System Design Review, React Basics"
                  value={bookingData.topic}
                  onChange={e => setBookingData({...bookingData, topic: e.target.value})}
                  required
                />
              </div>
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>Select Date</label>
                  <input 
                    className="input" 
                    type="date"
                    value={bookingData.date}
                    onChange={e => setBookingData({...bookingData, date: e.target.value})}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Select Time</label>
                  <input 
                    className="input" 
                    type="time" 
                    value={bookingData.time}
                    onChange={e => setBookingData({...bookingData, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowBookingModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm & Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { padding: '30px', textAlign: 'center' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  mentorCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardHeader: { display: 'flex', gap: '16px', alignItems: 'center' },
  avatar: { 
    width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 
  },
  mentorName: { fontSize: '18px', fontWeight: 600 },
  mentorTitle: { fontSize: '13px', color: 'var(--text-secondary)' },
  specialties: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  specialtyTag: { 
    padding: '4px 10px', borderRadius: '16px', background: 'rgba(108,99,255,0.1)', 
    fontSize: '11px', color: 'var(--primary)', border: '1px solid rgba(108,99,255,0.2)' 
  },
  divider: { height: '1px', background: 'var(--border)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rateInfo: { display: 'flex', flexDirection: 'column' },
  rateLabel: { fontSize: '11px', color: 'var(--text-secondary)' },
  rateValue: { fontSize: '18px', fontWeight: 700, color: 'var(--success)' },
  bookBtn: { width: 'auto', padding: '8px 20px' },
  
  modalOverlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  modal: { width: '90%', maxWidth: '500px', padding: '30px' },
  modalTitle: { fontSize: '20px', fontWeight: 700, marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { fontSize: '13px', color: 'var(--text-secondary)' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
  cancelBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
  loader: { padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }
}

export default MentorMarketplace
