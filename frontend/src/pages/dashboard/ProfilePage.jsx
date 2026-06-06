import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserRole } from '../../redux/slices/authSlice'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [switching, setSwitching] = useState(false)

  
  // Basic Info form
  const [basicForm, setBasicForm] = useState({
    title: '', bio: '', hourlyRate: '', location: '', availability: 'available'
  })

  // Skills form
  const [skillForm, setSkillForm] = useState({ name: '', level: 'intermediate' })

  // Experience form
  const [expForm, setExpForm] = useState({
    company: '', role: '', from: '', to: '', current: false, description: ''
  })

  // Education form
  const [eduForm, setEduForm] = useState({
    institution: '', degree: '', field: '', from: '', to: ''
  })

  // Certification form
  const [certForm, setCertForm] = useState({
    name: '', issuer: '', year: '', link: ''
  })

  // Portfolio form
  const [portForm, setPortForm] = useState({
    title: '', description: '', link: '', image: ''
  })

  // 2FA state
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)
  const [showEduForm, setShowEduForm] = useState(false)

  // ===== FETCH PROFILE ON LOAD =====
  async function fetchProfile() {
    setLoading(true)
    setProfile(null) // Clear stale data
    try {
      const { data } = await API.get('/profile/me')
      setProfile(data.profile)
      // Pre-fill basic form with existing data
      setBasicForm({
        title: data.profile.title || '',
        bio: data.profile.bio || '',
        hourlyRate: data.profile.hourlyRate || '',
        location: data.profile.location || '',
        availability: data.profile.availability || 'available'
      })
    } catch (error) {
      console.error('fetchProfile error:', error)
      // If profile not found, we create a basic one in the next save
      toast.error('Failed to load profile')
    }
    setLoading(false)
  }

  const handleSwitchRole = async () => {
    const newRole = user?.role === 'client' ? 'freelancer' : 'client'
    if (!window.confirm(`Switch to ${newRole} mode?`)) return

    setSwitching(true)
    try {
      const { data } = await API.patch('/profile/switch-role', { role: newRole })
      dispatch(updateUserRole(data.role))
      toast.success(data.message)
      fetchProfile() // Refresh profile data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Switch failed')
    }
    setSwitching(false)
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id])

  // ===== UPDATE BASIC INFO =====
  const handleBasicSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await API.put('/profile/me', basicForm)
      setProfile(data.profile)
      toast.success('Profile updated!')
    } catch (error) {
      console.error('handleBasicSubmit error:', error)
      toast.error('Update failed')
    }
    setLoading(false)
  }

  // ===== ADD SKILL =====
  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!skillForm.name.trim()) return toast.error('Enter a skill name')
    try {
      // Add to existing skills array
      const updatedSkills = [...(profile?.skills || []), skillForm]
      const { data } = await API.put('/profile/me', { skills: updatedSkills })
      setProfile(data.profile)
      setSkillForm({ name: '', level: 'intermediate' })
      toast.success('Skill added!')
    } catch (error) {
      console.error('handleAddSkill error:', error)
      toast.error('Failed to add skill')
    }
  }

  // ===== REMOVE SKILL =====
  const handleRemoveSkill = async (index) => {
    try {
      const updatedSkills = profile.skills.filter((_, i) => i !== index)
      const { data } = await API.put('/profile/me', { skills: updatedSkills })
      setProfile(data.profile)
      toast.success('Skill removed')
    } catch (error) {
      console.error('handleRemoveSkill error:', error)
      toast.error('Failed to remove skill')
    }
  }

  // ===== ADD EXPERIENCE =====
  const handleAddExp = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post('/profile/experience', expForm)
      setProfile(prev => ({ ...prev, experience: data.experience }))
      setExpForm({ company: '', role: '', from: '', to: '', current: false, description: '' })
      setShowExpForm(false)
      toast.success('Experience added!')
    } catch (error) {
      console.error('handleAddExp error:', error)
      toast.error('Failed to add experience')
    }
  }

  // ===== ADD EDUCATION =====
  const handleAddEdu = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post('/profile/education', eduForm)
      setProfile(prev => ({ ...prev, education: data.education }))
      setEduForm({ institution: '', degree: '', field: '', from: '', to: '' })
      setShowEduForm(false)
      toast.success('Education added!')
    } catch (error) {
      console.error('handleAddEdu error:', error)
      toast.error('Failed to add education')
    }
  }

  // ===== ADD CERTIFICATION =====
  const handleAddCert = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post('/profile/certifications', certForm)
      setProfile(prev => ({ ...prev, certifications: data.certifications }))
      setCertForm({ name: '', issuer: '', year: '', link: '' })
      toast.success('Certification added!')
    } catch (error) {
      console.error('handleAddCert error:', error)
      toast.error('Failed to add certification')
    }
  }

  // ===== ADD PORTFOLIO =====
  const handleAddPort = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post('/profile/portfolio', portForm)
      setProfile(prev => ({ ...prev, portfolio: data.portfolio }))
      setPortForm({ title: '', description: '', link: '', image: '' })
      toast.success('Portfolio item added!')
    } catch (error) {
      console.error('handleAddPort error:', error)
      toast.error('Failed to add portfolio item')
    }
  }
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  
  // ===== UPLOAD AVATAR =====
const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('avatar', file)

  setAvatarUploading(true)
  try {
    const { data } = await API.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // Update profile state with new avatar
    setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }))
    toast.success('Profile picture updated!')
  } catch (error) {
    console.error('handleAvatarUpload error:', error)
    toast.error(error.response?.data?.message || 'Failed to upload image')
  }
  setAvatarUploading(false)
}

// ===== UPLOAD RESUME =====
const handleResumeUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('resume', file)

  setResumeUploading(true)
  try {
    const { data } = await API.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setProfile(prev => ({ ...prev, resumeUrl: data.resumeUrl }))
    toast.success('Resume uploaded!')
  } catch (error) {
    console.error('handleResumeUpload error:', error)
    toast.error(error.response?.data?.message || 'Failed to upload resume')
  }
  setResumeUploading(false)
}

// ===== 2FA SETUP =====
const handleSetup2FA = async () => {
  try {
    const { data } = await API.post('/auth/2fa/setup')
    setQrCode(data.qrCodeUrl)
    setShowQr(true)
  } catch (error) {
    toast.error('Failed to initiate 2FA setup')
  }
}

const handleVerify2FA = async (e) => {
  e.preventDefault()
  try {
    await API.post('/auth/2fa/verify', { token: twoFactorToken })
    toast.success('2FA enabled successfully!')
    setShowQr(false)
    fetchProfile() // Refresh profile status if needed (though it's in User model)
    // For simplicity, we assume profile includes user info
    setProfile(prev => ({ ...prev, user: { ...prev.user, isTwoFactorEnabled: true } }))
  } catch (error) {
    toast.error(error.response?.data?.message || 'Verification failed')
  }
}

const handleDisable2FA = async () => {
  if (!window.confirm('Are you sure you want to disable 2FA?')) return
  try {
    await API.post('/auth/2fa/disable')
    toast.success('2FA disabled')
    setProfile(prev => ({ ...prev, user: { ...prev.user, isTwoFactorEnabled: false } }))
  } catch (error) {
    toast.error('Failed to disable 2FA')
  }
}

// ===== UPLOAD PORTFOLIO IMAGE =====
const handlePortfolioImageUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  try {
    const { data } = await API.post('/upload/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // Set the image URL in the portfolio form
    setPortForm(prev => ({ ...prev, image: data.imageUrl }))
    toast.success('Image uploaded!')
  } catch (error) {
    console.error('handlePortfolioImageUpload error:', error)
    toast.error(error.response?.data?.message || 'Failed to upload image')
  }
}



  const tabs = [
    { id: 'basic', label: '👤 Basic Info' },
    { id: 'skills', label: '🛠️ Skills' },
    { id: 'experience', label: '💼 Experience' },
    { id: 'education', label: '🎓 Education' },
    { id: 'certifications', label: '📜 Certifications' },
    { id: 'portfolio', label: '🖼️ Portfolio' },
    { id: 'security', label: '🔒 Security' },
  ]

  const levelColors = {
    beginner: 'rgba(255,193,7,0.2)',
    intermediate: 'rgba(0,212,255,0.2)',
    expert: 'rgba(72,187,120,0.2)'
  }

  const levelTextColors = {
    beginner: '#ffc107',
    intermediate: 'var(--secondary)',
    expert: 'var(--success)'
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatarLarge}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={styles.name}>{user?.name}</h2>
            {user?.isVerified && (
              <span style={{
                background: 'rgba(72,187,120,0.15)',
                color: 'var(--success)',
                border: '1px solid rgba(72,187,120,0.4)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ✅ Verified
              </span>
            )}
          </div>
          <p style={styles.title}>{profile?.title || 'Add your professional title'}</p>
          <p style={styles.location}>📍 {profile?.location || 'Add location'}</p>
          <button 
            onClick={handleSwitchRole} 
            disabled={switching}
            style={styles.switchRoleBtn}
          >
            {switching ? 'Switching...' : `🔄 Switch to ${user?.role === 'client' ? 'Freelancer' : 'Client'} Mode`}
          </button>
        </div>
        <div style={styles.statsRow}>

          <div style={styles.statItem}>
            <span style={styles.statVal}>₹{profile?.hourlyRate || 0}</span>
            <span style={styles.statLbl}>/ hour</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statVal}>{profile?.completedGigs || 0}</span>
            <span style={styles.statLbl}>Gigs Done</span>
          </div>
          <div style={styles.statItem}>
            <span style={{
              ...styles.availBadge,
              background: profile?.availability === 'available'
                ? 'rgba(72,187,120,0.2)' : 'rgba(252,129,129,0.2)',
              color: profile?.availability === 'available'
                ? 'var(--success)' : 'var(--error)'
            }}>
              {profile?.availability === 'available' ? '🟢 Available' : '🔴 Busy'}
            </span>
          </div>
            {/* Avatar with upload */}
<div style={styles.avatarWrapper}>
  <div style={styles.avatarLarge}>
    {profile?.avatarUrl || user?.avatar ? (
      <img
        src={profile?.avatarUrl || user?.avatar}
        alt="avatar"
        style={styles.avatarImg}
      />
    ) : (
      user?.name?.charAt(0).toUpperCase()
    )}
  </div>
  <label style={styles.avatarEditBtn} title="Change photo">
    {avatarUploading ? '⏳' : '📷'}
    <input
      type="file"
      accept="image/*"
      onChange={handleAvatarUpload}
      style={{ display: 'none' }}
    />
  </label>
</div>

        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass" style={styles.content}>

        {/* ===== BASIC INFO ===== */}
        {activeTab === 'basic' && (
          <form onSubmit={handleBasicSubmit} style={styles.form}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Professional Title</label>
                <input className="input" placeholder="e.g. Full Stack Developer"
                  value={basicForm.title}
                  onChange={e => setBasicForm({ ...basicForm, title: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Location</label>
                <input className="input" placeholder="e.g. Bengaluru, Karnataka"
                  value={basicForm.location}
                  onChange={e => setBasicForm({ ...basicForm, location: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Hourly Rate (₹)</label>
                <input className="input" type="number" placeholder="500"
                  value={basicForm.hourlyRate}
                  onChange={e => setBasicForm({ ...basicForm, hourlyRate: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Availability</label>
                <select className="input"
                  value={basicForm.availability}
                  onChange={e => setBasicForm({ ...basicForm, availability: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Bio</label>
              <textarea className="input" rows={4}
                placeholder="Tell clients about yourself..."
                value={basicForm.bio}
                onChange={e => setBasicForm({ ...basicForm, bio: e.target.value })}
                style={{ resize: 'vertical' }} />
            </div>

            {/* Resume Upload */}
            <div style={styles.field}>
              <label style={styles.label}>Resume / CV</label>
              {profile?.resumeUrl ? (
                <div style={styles.resumeBox}>
                  <span>📄 Resume uploaded</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.resumeLink}
                    >
                      View
                    </a>
                    <label style={styles.resumeChangeBtn}>
                      {resumeUploading ? 'Uploading...' : 'Change'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={styles.uploadBox}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                  />
                  {resumeUploading ? (
                    <span>⏳ Uploading...</span>
                  ) : (
                    <span>📄 Click to upload resume (PDF/DOC)</span>
                  )}
                </label>
              )}
            </div>

            <button className="btn-primary" type="submit"
              disabled={loading} style={{ maxWidth: '200px' }}>
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </form>
        )}

        {/* ===== SKILLS ===== */}
        {activeTab === 'skills' && (
          <div style={styles.form}>
            <h3 style={styles.sectionTitle}>Skills</h3>

            {/* Add Skill Form */}
            <div style={styles.inlineForm}>
              <input className="input" placeholder="Skill name e.g. React"
                value={skillForm.name}
                onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
                style={{ flex: 2 }} />
              <select className="input" value={skillForm.level}
                onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}
                style={{ flex: 1 }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
              <button className="btn-primary" onClick={handleAddSkill}
                style={{ flex: 1, maxWidth: '120px' }}>
                + Add
              </button>
            </div>

            {/* Skills List */}
            <div style={styles.tagList}>
              {profile?.skills?.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No skills added yet.</p>
              )}
              {profile?.skills?.map((skill, i) => (
                <div key={i} style={{
                  ...styles.skillTag,
                  background: levelColors[skill.level]
                }}>
                  <span style={{ color: levelTextColors[skill.level], fontWeight: 600 }}>
                    {skill.name}
                  </span>
                  <span style={styles.skillLevel}>{skill.level}</span>
                  <button onClick={() => handleRemoveSkill(i)} style={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== EXPERIENCE ===== */}
        {activeTab === 'experience' && (
          <div style={styles.form}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Work Experience</h3>
              <button 
                onClick={() => setShowExpForm(!showExpForm)}
                style={styles.postBtn}
              >
                {showExpForm ? '✕ Cancel' : '+ Add Experience'}
              </button>
            </div>
            
            {showExpForm && (
              <form onSubmit={handleAddExp} style={{ ...styles.formGrid, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Company</label>
                  <input className="input" placeholder="Company name"
                    value={expForm.company}
                    onChange={e => setExpForm({ ...expForm, company: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Role</label>
                  <input className="input" placeholder="Your role"
                    value={expForm.role}
                    onChange={e => setExpForm({ ...expForm, role: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>From</label>
                  <input className="input" type="date"
                    value={expForm.from}
                    onChange={e => setExpForm({ ...expForm, from: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>To</label>
                  <input className="input" type="date"
                    disabled={expForm.current}
                    value={expForm.to}
                    onChange={e => setExpForm({ ...expForm, to: e.target.value })} />
                </div>
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.checkLabel}>
                    <input type="checkbox" checked={expForm.current}
                      onChange={e => setExpForm({ ...expForm, current: e.target.checked })} />
                    Currently working here
                  </label>
                </div>
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Description</label>
                  <textarea className="input" rows={3} placeholder="What did you do?"
                    value={expForm.description}
                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>
                <button className="btn-primary" type="submit"
                  style={{ maxWidth: '180px' }}>
                  🚀 Save Experience
                </button>
              </form>
            )}

            {/* Experience List */}
            <div style={styles.timelineList}>
              {profile?.experience?.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No experience added yet.</p>
              )}
              {profile?.experience?.map((exp, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div>
                    <p style={styles.timelineTitle}>{exp.role} at {exp.company}</p>
                    <p style={styles.timelineDate}>
                      {exp.from?.slice(0, 10)} → {exp.current ? 'Present' : exp.to?.slice(0, 10)}
                    </p>
                    <p style={styles.timelineDesc}>{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== EDUCATION ===== */}
        {activeTab === 'education' && (
          <div style={styles.form}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Education</h3>
              <button 
                onClick={() => setShowEduForm(!showEduForm)}
                style={styles.postBtn}
              >
                {showEduForm ? '✕ Cancel' : '+ Add Education'}
              </button>
            </div>

            {showEduForm && (
              <form onSubmit={handleAddEdu} style={{ ...styles.formGrid, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Institution</label>
                  <input className="input" placeholder="College/University"
                    value={eduForm.institution}
                    onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Degree</label>
                  <input className="input" placeholder="e.g. B.Tech"
                    value={eduForm.degree}
                    onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Field of Study</label>
                  <input className="input" placeholder="e.g. Computer Science"
                    value={eduForm.field}
                    onChange={e => setEduForm({ ...eduForm, field: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>From</label>
                  <input className="input" type="date"
                    value={eduForm.from}
                    onChange={e => setEduForm({ ...eduForm, from: e.target.value })} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>To</label>
                  <input className="input" type="date"
                    value={eduForm.to}
                    onChange={e => setEduForm({ ...eduForm, to: e.target.value })} />
                </div>
                <button className="btn-primary" type="submit"
                  style={{ maxWidth: '180px' }}>
                  🚀 Save Education
                </button>
              </form>
            )}

            <div style={styles.timelineList}>
              {profile?.education?.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No education added yet.</p>
              )}
              {profile?.education?.map((edu, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timelineDot} />
                  <div>
                    <p style={styles.timelineTitle}>{edu.degree} in {edu.field}</p>
                    <p style={styles.timelineDate}>{edu.institution}</p>
                    <p style={styles.timelineDate}>
                      {edu.from?.slice(0, 10)} → {edu.to?.slice(0, 10)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CERTIFICATIONS ===== */}
        {activeTab === 'certifications' && (
          <div style={styles.form}>
            <h3 style={styles.sectionTitle}>Certifications</h3>

            <form onSubmit={handleAddCert} style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Certificate Name</label>
                <input className="input" placeholder="e.g. AWS Certified Developer"
                  value={certForm.name}
                  onChange={e => setCertForm({ ...certForm, name: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Issuer</label>
                <input className="input" placeholder="e.g. Amazon"
                  value={certForm.issuer}
                  onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Year</label>
                <input className="input" placeholder="e.g. 2024"
                  value={certForm.year}
                  onChange={e => setCertForm({ ...certForm, year: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Certificate Link</label>
                <input className="input" placeholder="https://..."
                  value={certForm.link}
                  onChange={e => setCertForm({ ...certForm, link: e.target.value })} />
              </div>
              <button className="btn-primary" type="submit"
                style={{ maxWidth: '200px' }}>
                + Add Certification
              </button>
            </form>

            <div style={styles.certList}>
              {profile?.certifications?.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No certifications added yet.</p>
              )}
              {profile?.certifications?.map((cert, i) => (
                <div key={i} className="glass" style={styles.certItem}>
                  <span style={styles.certIcon}>📜</span>
                  <div>
                    <p style={styles.certName}>{cert.name}</p>
                    <p style={styles.certMeta}>{cert.issuer} · {cert.year}</p>
                    {cert.link && (
                      <a href={cert.link} target="_blank" rel="noreferrer"
                        style={styles.certLink}>View Certificate →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PORTFOLIO ===== */}
        {activeTab === 'portfolio' && (
          <div style={styles.form}>
            <h3 style={styles.sectionTitle}>Portfolio</h3>

            <form onSubmit={handleAddPort} style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Project Title</label>
                <input className="input" placeholder="e.g. E-Commerce App"
                  value={portForm.title}
                  onChange={e => setPortForm({ ...portForm, title: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Project Link</label>
                <input className="input" placeholder="https://github.com/..."
                  value={portForm.link}
                  onChange={e => setPortForm({ ...portForm, link: e.target.value })} />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Description</label>
                <textarea className="input" rows={3} placeholder="What did you build?"
                  value={portForm.description}
                  onChange={e => setPortForm({ ...portForm, description: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>


              {/* Portfolio Image Upload */}
<div style={{ ...styles.field, gridColumn: '1 / -1' }}>
  <label style={styles.label}>Project Image</label>
  {portForm.image ? (
    <div style={styles.imagePreview}>
      <img
        src={portForm.image}
        alt="portfolio"
        style={styles.previewImg}
      />
      <button
        type="button"
        onClick={() => setPortForm({ ...portForm, image: '' })}
        style={styles.removeImgBtn}
      >
        Remove
      </button>
    </div>
  ) : (
    <label style={styles.uploadBox}>
      <input
        type="file"
        accept="image/*"
        onChange={handlePortfolioImageUpload}
        style={{ display: 'none' }}
      />
      <span>🖼️ Click to upload project image</span>
    </label>
  )}
</div>
              <button className="btn-primary" type="submit"
                style={{ maxWidth: '180px' }}>
                + Add Project
              </button>
            </form>

            <div style={styles.portfolioGrid}>
              {profile?.portfolio?.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>No portfolio items yet.</p>
              )}
              {profile?.portfolio?.map((item, i) => (
                <div key={i} className="glass" style={styles.portfolioCard}>
                  <div style={styles.portfolioIcon}>🖥️</div>
                  <p style={styles.portfolioTitle}>{item.title}</p>
                  <p style={styles.portfolioDesc}>{item.description}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer"
                      style={styles.certLink}>View Project →</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SECURITY / 2FA ===== */}
        {activeTab === 'security' && (
          <div style={styles.form}>
            <h3 style={styles.sectionTitle}>Two-Factor Authentication</h3>
            <p style={styles.subtitle}>Add an extra layer of security to your account.</p>

            <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
              {!profile?.user?.isTwoFactorEnabled ? (
                <>
                  {!showQr ? (
                    <div>
                      <p style={{ marginBottom: '16px' }}>2FA is currently disabled.</p>
                      <button className="btn-primary" onClick={handleSetup2FA}>
                        Enable 2FA
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <p>Scan this QR code with your Authenticator app (e.g., Google Authenticator):</p>
                      <img src={qrCode} alt="2FA QR Code" style={{ background: 'white', padding: '10px', borderRadius: '8px' }} />
                      <div style={styles.field}>
                        <label style={styles.label}>Enter 6-digit Code</label>
                        <input 
                          className="input" 
                          placeholder="000000" 
                          value={twoFactorToken}
                          onChange={e => setTwoFactorToken(e.target.value)}
                          maxLength={6}
                          style={{ textAlign: 'center', width: '200px', fontSize: '18px' }}
                        />
                      </div>
                      <button className="btn-primary" type="submit">Verify & Enable</button>
                      <button type="button" onClick={() => setShowQr(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>Cancel</button>
                    </form>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--success)' }}>
                  <p style={{ marginBottom: '16px' }}>✅ 2FA is enabled on your account.</p>
                  <button 
                    style={{ background: 'rgba(252,129,129,0.1)', color: 'var(--error)', border: '1px solid var(--error)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={handleDisable2FA}
                  >
                    Disable 2FA
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: {
    background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))',
    border: '1px solid rgba(108,99,255,0.3)',
    borderRadius: '16px', padding: '28px 32px',
    display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap'
  },
  avatarLarge: {
    width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '32px', fontWeight: 700
  },
  name: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  title: { color: 'var(--secondary)', fontSize: '14px', marginBottom: '4px' },
  location: { color: 'var(--text-secondary)', fontSize: '13px' },
  statsRow: { marginLeft: 'auto', display: 'flex', gap: '24px', alignItems: 'center' },
  statItem: { textAlign: 'center' },
  statVal: { fontSize: '22px', fontWeight: 700, display: 'block' },
  statLbl: { fontSize: '12px', color: 'var(--text-secondary)' },
  availBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 },
  switchRoleBtn: {
    marginTop: '12px', padding: '8px 16px', background: 'rgba(108,99,255,0.1)',
    border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--primary)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
  },
  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },

  tab: {
    padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
  },
  tabActive: {
    background: 'rgba(108,99,255,0.15)', border: '1px solid var(--primary)',
    color: 'var(--primary)'
  },
  content: { padding: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '4px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' },
  inlineForm: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  skillTag: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', borderRadius: '20px', fontSize: '13px'
  },
  skillLevel: { color: 'var(--text-secondary)', fontSize: '11px' },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', fontSize: '12px', padding: '0 2px'
  },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' },
  timelineItem: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  timelineDot: {
    width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
  },
  timelineTitle: { fontWeight: 600, fontSize: '14px', marginBottom: '4px' },
  timelineDate: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' },
  timelineDesc: { fontSize: '13px', color: 'var(--text-secondary)' },
  certList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  certItem: { display: 'flex', gap: '16px', padding: '16px', alignItems: 'flex-start' },
  certIcon: { fontSize: '28px' },
  certName: { fontWeight: 600, fontSize: '14px', marginBottom: '4px' },
  certMeta: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' },
  certLink: { fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' },
  portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  portfolioCard: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  portfolioIcon: { fontSize: '32px' },
  portfolioTitle: { fontWeight: 600, fontSize: '15px' },
  portfolioDesc: { fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }
  ,
  avatarWrapper: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  avatarEditBtn: {
    position: 'absolute', bottom: '0', right: '0',
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--primary)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', cursor: 'pointer',
    border: '2px solid var(--bg-dark)'
  },

  resumeBox: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '12px 16px',
    background: 'rgba(72,187,120,0.1)',
    border: '1px solid rgba(72,187,120,0.3)',
    borderRadius: '8px', fontSize: '14px', color: 'var(--success)'
  },
  resumeLink: {
    color: 'var(--primary)', textDecoration: 'none',
    fontSize: '13px', fontWeight: 500
  },
  resumeChangeBtn: {
    color: 'var(--text-secondary)', fontSize: '13px',
    cursor: 'pointer', fontWeight: 500
  },
  uploadBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', border: '2px dashed var(--border)',
    borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
    color: 'var(--text-secondary)', transition: 'all 0.2s'
  },
  imagePreview: {
    position: 'relative', display: 'inline-block'
  },
  previewImg: {
    width: '100%', maxHeight: '200px',
    objectFit: 'cover', borderRadius: '8px'
  },
  removeImgBtn: {
    position: 'absolute', top: '8px', right: '8px',
    padding: '4px 10px', background: 'rgba(252,129,129,0.9)',
    border: 'none', borderRadius: '4px', color: 'white',
    cursor: 'pointer', fontSize: '12px'
  }
}

export default ProfilePage