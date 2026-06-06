import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const StarPicker = ({ value, onChange }) => {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{
            fontSize: '28px', cursor: 'pointer',
            color: star <= (hover || value) ? '#ffc107' : 'var(--border)',
            transition: 'color 0.1s'
          }}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

const ClientReviewsPage = () => {
  const [myGigs, setMyGigs] = useState([])
  const [reviewedGigs, setReviewedGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGig, setSelectedGig] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    rating: 0,
    comment: '',
    communication: 0,
    quality: 0,
    timeliness: 0
  })

   const fetchData = async () => {
  try {
    const { data } = await API.get('/gigs/my/gigs')
    const gigs = data.gigs

    const reviewed = []
    const notReviewed = []

    for (const gig of gigs) {
      // Show gig if it has a hired freelancer (regardless of status)
      if (gig.hiredFreelancer) {
        try {
          const res = await API.get(`/reviews/gig/${gig._id}`)
          if (res.data.review) {
            reviewed.push({ ...gig, existingReview: res.data.review })
          } else {
            notReviewed.push(gig)
          }
        } catch {
          notReviewed.push(gig)
        }
      }
    }

    setMyGigs(notReviewed)
    setReviewedGigs(reviewed)
  } catch {
    toast.error('Failed to load gigs')
  }
  setLoading(false)
}

  useEffect(() => {
    const loadReviews = async () => {
      await fetchData()
    }
    loadReviews()
  }, [])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!form.rating) return toast.error('Please select a rating')
    if (!form.comment.trim()) return toast.error('Please write a comment')
    if (!selectedGig?.hiredFreelancer) {
      return toast.error('No freelancer hired for this gig')
    }

    setSubmitting(true)
    try {
      await API.post('/reviews', {
        gigId: selectedGig._id,
        freelancerId: selectedGig.hiredFreelancer,
        ...form
      })
      toast.success('Review submitted!')
      setSelectedGig(null)
      setForm({ rating: 0, comment: '', communication: 0, quality: 0, timeliness: 0 })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
    setSubmitting(false)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reviews & Feedback</h2>

      {loading ? (
        <div style={styles.center}>Loading...</div>
      ) : (
        <>
          {/* Gigs Pending Review */}
          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>
              ⏳ Pending Reviews ({myGigs.length})
            </h3>
            <p style={styles.sectionSub}>
              Rate freelancers you've worked with
            </p>

            {myGigs.length === 0 ? (
              <p style={styles.empty}>
                No gigs pending review. Hire a freelancer to get started!
              </p>
            ) : (
              <div style={styles.gigList}>
                {myGigs.map(gig => (
                  <div key={gig._id} style={styles.gigItem}>
                    <div style={styles.gigInfo}>
                      <p style={styles.gigTitle}>{gig.title}</p>
                      <p style={styles.gigMeta}>
                        Status: <span style={{
                          color: gig.status === 'completed'
                            ? 'var(--success)' : 'var(--secondary)'
                        }}>{gig.status}</span>
                        {' · '}₹{gig.budgetMin} – ₹{gig.budgetMax}
                      </p>
                    </div>
                    <button
                      style={styles.reviewBtn}
                      onClick={() => setSelectedGig(
                        selectedGig?._id === gig._id ? null : gig
                      )}
                    >
                      {selectedGig?._id === gig._id ? 'Cancel' : '⭐ Leave Review'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Review Form */}
            {selectedGig && (
              <form onSubmit={handleSubmitReview} style={styles.reviewForm}>
                <h4 style={styles.formTitle}>
                  Review for: {selectedGig.title}
                </h4>

                {/* Overall Rating */}
                <div style={styles.field}>
                  <label style={styles.label}>Overall Rating *</label>
                  <StarPicker
                    value={form.rating}
                    onChange={v => setForm({ ...form, rating: v })}
                  />
                </div>

                {/* Sub Ratings */}
                <div style={styles.subGrid}>
                  {[
                    { key: 'communication', label: '💬 Communication' },
                    { key: 'quality', label: '✨ Quality of Work' },
                    { key: 'timeliness', label: '⏱ Timeliness' }
                  ].map(({ key, label }) => (
                    <div key={key} style={styles.field}>
                      <label style={styles.label}>{label}</label>
                      <StarPicker
                        value={form[key]}
                        onChange={v => setForm({ ...form, [key]: v })}
                      />
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div style={styles.field}>
                  <label style={styles.label}>Your Review *</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Share your experience working with this freelancer..."
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={submitting}
                  style={{ maxWidth: '200px' }}
                >
                  {submitting ? 'Submitting...' : '⭐ Submit Review'}
                </button>
              </form>
            )}
          </div>

          {/* Reviews Given */}
          <div className="glass" style={styles.section}>
            <h3 style={styles.sectionTitle}>
              ✅ Reviews Given ({reviewedGigs.length})
            </h3>

            {reviewedGigs.length === 0 ? (
              <p style={styles.empty}>No reviews given yet.</p>
            ) : (
              <div style={styles.gigList}>
                {reviewedGigs.map(gig => (
                  <div key={gig._id} style={styles.reviewedItem}>
                    <p style={styles.gigTitle}>{gig.title}</p>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{
                          color: s <= gig.existingReview?.rating
                            ? '#ffc107' : 'var(--border)'
                        }}>★</span>
                      ))}
                    </div>
                    <p style={styles.reviewComment}>
                      {gig.existingReview?.comment}
                    </p>
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
  center: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
  section: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '17px', fontWeight: 600 },
  sectionSub: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-8px' },
  empty: { color: 'var(--text-secondary)', fontSize: '14px', padding: '16px 0' },
  gigList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  gigItem: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px', border: '1px solid var(--border)'
  },
  gigInfo: { flex: 1 },
  gigTitle: { fontSize: '15px', fontWeight: 600, marginBottom: '4px' },
  gigMeta: { fontSize: '13px', color: 'var(--text-secondary)' },
  reviewBtn: {
    padding: '8px 16px', background: 'rgba(255,193,7,0.1)',
    border: '1px solid rgba(255,193,7,0.3)', borderRadius: '8px',
    color: '#ffc107', cursor: 'pointer', fontSize: '13px',
    fontWeight: 500, whiteSpace: 'nowrap'
  },
  reviewForm: {
    display: 'flex', flexDirection: 'column', gap: '20px',
    padding: '20px', background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px', border: '1px solid var(--border)',
    marginTop: '8px'
  },
  formTitle: { fontSize: '15px', fontWeight: 600 },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  reviewedItem: {
    padding: '16px', background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '8px'
  },
  reviewComment: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }
}

export default ClientReviewsPage