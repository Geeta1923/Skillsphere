import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const categories = [
  'All', 'Web Development', 'Mobile Development', 'UI/UX Design',
  'Graphic Design', 'Content Writing', 'Digital Marketing',
  'Data Science', 'DevOps', 'Video Editing', 'Other'
]

const BrowseGigs = () => {
  const [gigs, setGigs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [pagination, setPagination] = useState({})
  const navigate = useNavigate()

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)

  async function fetchGigs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category !== 'All') params.append('category', category)
      if (budgetMin) params.append('budgetMin', budgetMin)
      if (budgetMax) params.append('budgetMax', budgetMax)
      if (location) params.append('location', location)
      params.append('page', page)
      params.append('limit', 9)

      const { data } = await API.get(`/gigs?${params.toString()}`)
      setGigs(data.gigs)
      setPagination(data.pagination)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load gigs')
    }
    setLoading(false)
  }

  async function fetchRecommendations() {
    setLoadingAI(true)
    try {
      const { data } = await API.get('/ai/recommendations')
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('AI error:', error)
    }
    setLoadingAI(false)
  }

  useEffect(() => {
    fetchGigs()
    fetchRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchGigs()
  }

  const statusColor = {
    open: { bg: 'rgba(72,187,120,0.15)', color: '#48bb78' },
    in_progress: { bg: 'rgba(0,212,255,0.15)', color: '#00d4ff' },
    completed: { bg: 'rgba(108,99,255,0.15)', color: '#6c63ff' }
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Browse Gigs</h2>
          <p style={styles.subtitle}>
            Find your next project — {pagination.total || 0} gigs available
          </p>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && category === 'All' && !search && (
        <div style={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={styles.sectionTitle}>🤖 AI-Powered Matches</h3>
            <span style={styles.aiBadge}>HuggingFace Optimized</span>
          </div>
          <div style={styles.row}>
            {recommendations.map(gig => (
              <div 
                key={gig._id} 
                className="glass" 
                style={{
                  ...styles.miniCard,
                  border: '1px solid rgba(0,212,255,0.3)',
                  boxShadow: '0 0 15px rgba(0,212,255,0.05)'
                }}
                onClick={() => navigate(`/dashboard/gigs/${gig._id}`)}
              >
                <div style={styles.miniHead}>
                  <span style={{
                    ...styles.score,
                    background: gig.matchScore >= 80 ? 'rgba(72,187,120,0.15)' : 'rgba(108,99,255,0.15)',
                    color: gig.matchScore >= 80 ? '#48bb78' : 'var(--primary)'
                  }}>
                    {gig.matchScore}% Match
                  </span>
                  <span style={styles.miniBudget}>₹{gig.budgetMax}</span>
                </div>
                <p style={styles.miniTitle}>{gig.title}</p>
                <div style={styles.miniTags}>
                  {gig.skillsRequired.slice(0, 2).map((s, i) => (
                    <span key={i} style={styles.miniTag}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input
          className="input"
          placeholder="🔍 Search gigs by title or skill..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          type="number"
          placeholder="Min ₹"
          value={budgetMin}
          onChange={e => setBudgetMin(e.target.value)}
          style={{ width: '100px' }}
        />
        <input
          className="input"
          type="number"
          placeholder="Max ₹"
          value={budgetMax}
          onChange={e => setBudgetMax(e.target.value)}
          style={{ width: '100px' }}
        />
        <input
          className="input"
          placeholder="📍 Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={{ width: '150px' }}
        />
        <button className="btn-primary" type="submit"
          style={{ width: '100px' }}>
          Search
        </button>
      </form>

      {/* Category Filters */}
      <div style={styles.categories}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            style={{
              ...styles.catBtn,
              ...(category === cat ? styles.catBtnActive : {})
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gigs Grid */}
      {loading ? (
        <div style={styles.loading}>Loading gigs...</div>
      ) : gigs.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '48px' }}>🔍</p>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>No gigs found</p>
          <p style={{ color: 'var(--text-secondary)' }}>Try different filters</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {gigs.map(gig => (
            <div
              key={gig._id}
              className="glass"
              style={styles.card}
              onClick={() => navigate(`/dashboard/gigs/${gig._id}`)}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <span style={styles.category}>{gig.category}</span>
                <span style={{
                  ...styles.status,
                  background: statusColor[gig.status]?.bg,
                  color: statusColor[gig.status]?.color
                }}>
                  {gig.status === 'open' ? '🟢 Open' : gig.status}
                </span>
              </div>

              {/* Title */}
              <h3 style={styles.gigTitle}>{gig.title}</h3>

              {/* Description */}
              <p style={styles.description}>
                {gig.description.length > 100
                  ? gig.description.slice(0, 100) + '...'
                  : gig.description}
              </p>

              {/* Skills */}
              <div style={styles.skills}>
                {gig.skillsRequired.slice(0, 3).map((skill, i) => (
                  <span key={i} style={styles.skillTag}>{skill}</span>
                ))}
                {gig.skillsRequired.length > 3 && (
                  <span style={styles.skillTag}>+{gig.skillsRequired.length - 3}</span>
                )}
              </div>

              {/* Footer */}
              <div style={styles.cardFooter}>
                <div>
                  <p style={styles.budget}>
                    ₹{gig.budgetMin.toLocaleString()} – ₹{gig.budgetMax.toLocaleString()}
                  </p>
                  <p style={styles.budgetType}>{gig.budgetType}</p>
                </div>
                <div style={styles.meta}>
                  <span>📍 {gig.location}</span>
                  <span>📋 {gig.proposalCount} proposals</span>
                  <span>👁 {gig.views}</span>
                </div>
              </div>

              {/* Client */}
              <div style={styles.client}>
                <div style={styles.clientAvatar}>
                  {gig.client?.name?.charAt(0) || 'C'}
                </div>
                <span style={styles.clientName}>
                  {gig.client?.name || 'Client'}
                </span>
                <span style={styles.postedAt}>
                  {new Date(gig.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={styles.pagination}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                ...styles.pageBtn,
                ...(page === p ? styles.pageBtnActive : {})
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  section: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600 },
  aiBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,212,255,0.1)', color: 'var(--secondary)', textTransform: 'uppercase', border: '1px solid rgba(0,212,255,0.3)' },
  row: { display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' },
  miniCard: { minWidth: '220px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' },
  miniHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  score: { fontSize: '11px', fontWeight: 700, color: 'var(--success)', background: 'rgba(72,187,120,0.1)', padding: '2px 8px', borderRadius: '10px' },
  miniBudget: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' },
  miniTitle: { fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  miniTags: { display: 'flex', gap: '4px' },
  miniTag: { fontSize: '10px', background: 'rgba(108,99,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' },
  searchBar: { display: 'flex', gap: '12px', alignItems: 'center' },
  categories: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  catBtn: {
    padding: '8px 16px', borderRadius: '20px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  catBtnActive: {
    background: 'rgba(108,99,255,0.15)',
    border: '1px solid var(--primary)',
    color: 'var(--primary)'
  },
  loading: { textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' },
  empty: {
    textAlign: 'center', padding: '60px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  card: {
    padding: '20px', cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    display: 'flex', flexDirection: 'column', gap: '12px'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  category: {
    fontSize: '11px', fontWeight: 600,
    color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  status: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px' },
  gigTitle: { fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
  description: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skillTag: {
    fontSize: '11px', padding: '4px 10px', borderRadius: '12px',
    background: 'rgba(108,99,255,0.1)', color: 'var(--primary)',
    border: '1px solid rgba(108,99,255,0.2)'
  },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  budget: { fontSize: '16px', fontWeight: 700, color: 'var(--success)' },
  budgetType: { fontSize: '11px', color: 'var(--text-secondary)' },
  meta: { display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' },
  client: {
    display: 'flex', alignItems: 'center', gap: '8px',
    paddingTop: '12px', borderTop: '1px solid var(--border)'
  },
  clientAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, flexShrink: 0
  },
  clientName: { fontSize: '13px', fontWeight: 500, flex: 1 },
  postedAt: { fontSize: '11px', color: 'var(--text-secondary)' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px' },
  pageBtn: {
    width: '36px', height: '36px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px'
  },
  pageBtnActive: {
    background: 'var(--primary)', border: '1px solid var(--primary)', color: 'white'
  }
}

export default BrowseGigs