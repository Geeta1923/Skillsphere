import { useState, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const StarRating = ({ value, onChange, size = 24 }) => {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{
            fontSize: size, cursor: onChange ? 'pointer' : 'default',
            color: star <= (hover || value) ? '#ffc107' : 'var(--border)',
            transition: 'color 0.1s'
          }}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  async function fetchReviews() {
    try {
      const { data } = await API.get('/reviews/my')
      setReviews(data.reviews)
      setStats(data.stats)
    } catch {
      toast.error('Failed to load reviews')
    }
    setLoading(false)
  }

  useEffect(() => {
    const load = async () => {
      await fetchReviews()
    }

    void load()
  }, [])

  const ratingDistribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0
  }))

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Reviews</h2>

      {loading ? (
        <div style={styles.center}>Loading reviews...</div>
      ) : (
        <>
          {/* Stats Overview */}
          <div style={styles.statsGrid}>

            {/* Overall Rating */}
            <div className="glass" style={styles.ratingCard}>
              <p style={styles.bigRating}>{stats.avgRating || '0.0'}</p>
              <StarRating value={Math.round(stats.avgRating || 0)} size={28} />
              <p style={styles.ratingLabel}>{stats.totalReviews} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="glass" style={styles.distCard}>
              <h3 style={styles.sectionTitle}>Rating Breakdown</h3>
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} style={styles.distRow}>
                  <span style={styles.distStar}>{star} ★</span>
                  <div style={styles.distBar}>
                    <div style={{
                      ...styles.distFill,
                      width: `${percentage}%`,
                      background: star >= 4
                        ? 'var(--success)'
                        : star === 3 ? '#ffc107' : 'var(--error)'
                    }} />
                  </div>
                  <span style={styles.distCount}>{count}</span>
                </div>
              ))}
            </div>

            {/* Category Scores */}
            <div className="glass" style={styles.catCard}>
              <h3 style={styles.sectionTitle}>Category Scores</h3>
              {[
                { label: 'Communication', key: 'communication' },
                { label: 'Quality', key: 'quality' },
                { label: 'Timeliness', key: 'timeliness' }
              ].map(cat => {
                const avg = reviews.length > 0
                  ? (reviews.reduce((s, r) => s + (r[cat.key] || r.rating), 0) / reviews.length).toFixed(1)
                  : 0
                return (
                  <div key={cat.key} style={styles.catRow}>
                    <span style={styles.catLabel}>{cat.label}</span>
                    <StarRating value={Math.round(avg)} size={16} />
                    <span style={styles.catScore}>{avg}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div style={styles.reviewsList}>
            {reviews.length === 0 ? (
              <div className="glass" style={styles.empty}>
                <p style={{ fontSize: '48px' }}>⭐</p>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>No reviews yet</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Complete gigs to receive reviews from clients
                </p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="glass" style={styles.reviewCard}>
                  <div style={styles.reviewHeader}>
                    <div style={styles.reviewerInfo}>
                      <div style={styles.reviewerAvatar}>
                        {review.reviewer?.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={styles.reviewerName}>{review.reviewer?.name}</p>
                        <p style={styles.reviewGig}>{review.gig?.title}</p>
                      </div>
                    </div>
                    <div style={styles.reviewRight}>
                      <StarRating value={review.rating} size={18} />
                      <p style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p style={styles.reviewComment}>{review.comment}</p>

                  {/* Sub-ratings */}
                  {(review.communication || review.quality || review.timeliness) && (
                    <div style={styles.subRatings}>
                      {[
                        { label: 'Communication', val: review.communication },
                        { label: 'Quality', val: review.quality },
                        { label: 'Timeliness', val: review.timeliness }
                      ].map(s => s.val && (
                        <div key={s.label} style={styles.subRating}>
                          <span style={styles.subLabel}>{s.label}</span>
                          <StarRating value={s.val} size={14} />
                        </div>
                      ))}
                    </div>
                  )}

                  {review.isVerified && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.verifiedBadge}>✅ Verified Review</span>
                      <div style={styles.sentimentInfo}>
                        <span style={styles.sentimentLabel}>🤖 AI Sentiment: </span>
                        <span style={{ 
                          ...styles.sentimentScore, 
                          color: review.sentimentScore >= 70 ? 'var(--success)' : 
                                 review.sentimentScore >= 40 ? '#ffc107' : 'var(--error)'
                        }}>
                          {review.sentimentScore >= 70 ? 'Positive' : 
                           review.sentimentScore >= 40 ? 'Neutral' : 'Negative'} ({review.sentimentScore}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
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
  statsGrid: { display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '16px' },
  ratingCard: { padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  bigRating: { fontSize: '56px', fontWeight: 700, color: '#ffc107', lineHeight: 1 },
  ratingLabel: { color: 'var(--text-secondary)', fontSize: '14px' },
  distCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  catCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: 600, marginBottom: '4px' },
  distRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  distStar: { fontSize: '12px', color: '#ffc107', width: '30px', flexShrink: 0 },
  distBar: { flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s' },
  distCount: { fontSize: '12px', color: 'var(--text-secondary)', width: '20px', textAlign: 'right' },
  catRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  catLabel: { fontSize: '13px', flex: 1 },
  catScore: { fontSize: '13px', fontWeight: 600, color: '#ffc107', width: '28px' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  reviewCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewerInfo: { display: 'flex', gap: '12px', alignItems: 'center' },
  reviewerAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 },
  reviewerName: { fontWeight: 600, fontSize: '15px', marginBottom: '4px' },
  reviewGig: { fontSize: '12px', color: 'var(--text-secondary)' },
  reviewRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' },
  reviewDate: { fontSize: '12px', color: 'var(--text-secondary)' },
  reviewComment: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 },
  subRatings: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  subRating: { display: 'flex', alignItems: 'center', gap: '8px' },
  subLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
  verifiedBadge: { fontSize: '12px', color: 'var(--success)', alignSelf: 'flex-start' },
  sentimentInfo: { display: 'flex', alignItems: 'center', gap: '6px' },
  sentimentLabel: { fontSize: '11px', color: 'var(--text-secondary)' },
  sentimentScore: { fontSize: '12px', fontWeight: 600 }
}

export default ReviewsPage