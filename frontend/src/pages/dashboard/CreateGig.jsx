import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const categories = [
  'Web Development', 'Mobile Development', 'UI/UX Design',
  'Graphic Design', 'Content Writing', 'Digital Marketing',
  'Data Science', 'DevOps', 'Video Editing', 'Other'
]

const CreateGig = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [milestoneForm, setMilestoneForm] = useState({ title: '', amount: '', dueDate: '' })

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    skillsRequired: [],
    budgetType: 'fixed',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    location: 'Remote',
    isRemote: true,
    milestones: [],
    attachments: []
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    if (form.skillsRequired.includes(skillInput.trim())) {
      return toast.error('Skill already added')
    }
    setForm({ ...form, skillsRequired: [...form.skillsRequired, skillInput.trim()] })
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setForm({ ...form, skillsRequired: form.skillsRequired.filter(s => s !== skill) })
  }

  const addMilestone = () => {
    if (!milestoneForm.title || !milestoneForm.amount || !milestoneForm.dueDate) {
      return toast.error('Fill milestone title, amount and due date')
    }
    setForm({ ...form, milestones: [...form.milestones, { ...milestoneForm, status: 'pending' }] })
    setMilestoneForm({ title: '', amount: '', dueDate: '' })
  }

  const removeMilestone = (index) => {
    setForm({ ...form, milestones: form.milestones.filter((_, i) => i !== index) })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await API.post('/upload/docs', formData)
      setForm({ ...form, attachments: [...form.attachments, { url: data.url, name: data.name }] })
      toast.success('Document uploaded!')
    } catch {
      toast.error('Upload failed')
    }
    setFileLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.budgetMin || !form.budgetMax) {
      return toast.error('Please fill all required fields')
    }
    if (Number(form.budgetMin) >= Number(form.budgetMax)) {
      return toast.error('Max budget must be greater than min budget')
    }
    setLoading(true)
    try {
      const { data } = await API.post('/gigs', form)
      toast.success('Gig created successfully!')
      navigate(`/dashboard/gigs/${data.gig._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create gig')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <div>
          <h2 style={styles.title}>Post a New Gig</h2>
          <p style={styles.subtitle}>Find the perfect freelancer for your project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.layout}>

          {/* LEFT — Main Details */}
          <div style={styles.main}>

            {/* Basic Info */}
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>📝 Project Details</h3>

              <div style={styles.field}>
                <label style={styles.label}>Project Title *</label>
                <input
                  className="input"
                  name="title"
                  placeholder="e.g. Build a React E-Commerce Website"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Category *</label>
                <select className="input" name="category"
                  value={form.category} onChange={handleChange}>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description *</label>
                <textarea
                  className="input"
                  name="description"
                  rows={6}
                  placeholder="Describe your project in detail — what needs to be built, what skills are needed, expected outcomes..."
                  value={form.description}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>
            </div>

            {/* Skills */}
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>🛠️ Skills Required</h3>

              <div style={styles.skillInput}>
                <input
                  className="input"
                  placeholder="Type a skill and press Add"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={styles.addSkillBtn}
                >
                  + Add
                </button>
              </div>

              <div style={styles.skillTags}>
                {form.skillsRequired.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No skills added yet
                  </p>
                )}
                {form.skillsRequired.map((skill, i) => (
                  <span key={i} style={styles.skillTag}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={styles.removeSkill}
                    >✕</button>
                  </span>
                ))}
              </div>
            </div>
            {/* Milestones */}
            <div className="glass" style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>🎯 Project Milestones</h3>
                <span style={styles.badge}>Escrow Protected</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Break your project into smaller tasks. Funds are held securely and released only when work is approved.
              </p>
              
              <div style={styles.milestoneInputRows}>
                <div style={styles.field}>
                  <label style={styles.label}>Milestone Title</label>
                  <input
                    className="input"
                    placeholder="e.g. Design Wireframes"
                    value={milestoneForm.title}
                    onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.field}>
                    <label style={styles.label}>Amount (₹)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="5000"
                      value={milestoneForm.amount}
                      onChange={e => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Due Date</label>
                    <input
                      className="input"
                      type="date"
                      value={milestoneForm.dueDate}
                      onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={addMilestone} 
                  className="btn-primary" 
                  style={{ marginTop: '8px' }}
                >
                  + Add Milestone
                </button>
              </div>

              {/* Added Milestones List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {form.milestones.length === 0 ? (
                  <div style={styles.emptyMilestones}>
                    No milestones added yet.
                  </div>
                ) : (
                  form.milestones.map((m, i) => (
                    <div key={i} style={styles.milestoneCard}>
                      <div style={styles.milestoneInfo}>
                        <p style={styles.mTitle}>{m.title}</p>
                        <p style={styles.mMeta}>
                          📅 Due: {new Date(m.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={styles.mAmount}>₹{Number(m.amount).toLocaleString()}</p>
                        <button type="button" onClick={() => removeMilestone(i)} style={styles.removeMilestoneBtn}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>📎 Project Documents</h3>
              <div style={styles.field}>
                <input type="file" onChange={handleFileUpload} disabled={fileLoading} />
                {fileLoading && <p style={{ fontSize: '11px' }}>Uploading...</p>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {form.attachments.map((file, i) => (
                  <span key={i} style={styles.skillTag}>📄 {file.name}</span>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT — Budget & Settings */}
          <div style={styles.sidebar}>

            {/* Budget */}
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>💰 Budget</h3>

              <div style={styles.field}>
                <label style={styles.label}>Budget Type</label>
                <div style={styles.radioGroup}>
                  {['fixed', 'hourly'].map(type => (
                    <label key={type} style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="budgetType"
                        value={type}
                        checked={form.budgetType === type}
                        onChange={handleChange}
                      />
                      {type === 'fixed' ? '🔒 Fixed Price' : '⏱ Hourly Rate'}
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.budgetRow}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Min ₹ *
                  </label>
                  <input
                    className="input"
                    type="number"
                    name="budgetMin"
                    placeholder="5000"
                    value={form.budgetMin}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Max ₹ *
                  </label>
                  <input
                    className="input"
                    type="number"
                    name="budgetMax"
                    placeholder="10000"
                    value={form.budgetMax}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {form.budgetMin && form.budgetMax && (
                <div style={styles.budgetPreview}>
                  Budget: ₹{Number(form.budgetMin).toLocaleString()}
                  {' – '}₹{Number(form.budgetMax).toLocaleString()}
                </div>
              )}
            </div>

            {/* Location & Deadline */}
            <div className="glass" style={styles.section}>
              <h3 style={styles.sectionTitle}>📍 Location & Timeline</h3>

              <div style={styles.field}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    name="isRemote"
                    checked={form.isRemote}
                    onChange={handleChange}
                  />
                  Remote work allowed
                </label>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Location</label>
                <input
                  className="input"
                  name="location"
                  placeholder="e.g. Bengaluru or Remote"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Deadline (optional)</label>
                <input
                  className="input"
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Posting...' : '🚀 Post Gig'}
            </button>

            <p style={styles.note}>
              * Your gig will be visible to all freelancers immediately after posting
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--primary)',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500
  },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '16px' },
  section: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600 },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  skillInput: { display: 'flex', gap: '10px' },
  addSkillBtn: {
    padding: '12px 20px', background: 'rgba(108,99,255,0.15)',
    border: '1px solid var(--primary)', borderRadius: '8px',
    color: 'var(--primary)', cursor: 'pointer', fontSize: '14px',
    fontWeight: 500, whiteSpace: 'nowrap'
  },
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillTag: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '16px', fontSize: '13px',
    background: 'rgba(108,99,255,0.1)', color: 'var(--primary)',
    border: '1px solid rgba(108,99,255,0.2)'
  },
  milestoneRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px'
  },
  removeSkill: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', fontSize: '11px', padding: '0'
  },
  radioGroup: { display: 'flex', gap: '16px' },
  radioLabel: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', cursor: 'pointer'
  },
  budgetRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  budgetPreview: {
    padding: '10px 14px', background: 'rgba(72,187,120,0.1)',
    border: '1px solid rgba(72,187,120,0.3)', borderRadius: '8px',
    color: 'var(--success)', fontSize: '14px', fontWeight: 600
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', cursor: 'pointer'
  },
  badge: {
    padding: '4px 10px', background: 'rgba(72,187,120,0.15)',
    color: 'var(--success)', borderRadius: '12px', fontSize: '11px',
    fontWeight: 700, textTransform: 'uppercase'
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  milestoneInputRows: { display: 'flex', flexDirection: 'column', gap: '12px' },
  emptyMilestones: {
    padding: '24px', textAlign: 'center', border: '1px dashed var(--border)',
    borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '13px'
  },
  milestoneCard: {
    padding: '16px', background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)', borderRadius: '12px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  mTitle: { fontWeight: 600, fontSize: '14px', marginBottom: '4px' },
  mMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  mAmount: { fontWeight: 700, color: 'var(--success)', fontSize: '15px', marginBottom: '4px' },
  removeMilestoneBtn: {
    background: 'none', border: 'none', color: 'var(--error)',
    fontSize: '11px', cursor: 'pointer', padding: '0', fontWeight: 500
  },
  note: { fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }
}

export default CreateGig