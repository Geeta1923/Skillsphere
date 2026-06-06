import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { authStart, authSuccess, authFail } from '../../redux/slices/authSlice'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'client'
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(authStart())
    try {
      const { data } = await API.post('/auth/register', formData)
      dispatch(authSuccess(data.user))
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed'
      dispatch(authFail(msg))
      toast.error(msg)
    }
  }

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>

        <div style={styles.header}>
          <h1 style={styles.logo}>⚡ SkillSphere</h1>
          <h2 style={styles.title}>Create account</h2>
          <p style={styles.subtitle}>Join the freelance ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              className="input"
              type="text"
              name="name"
              placeholder="Geeta Galagali"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role Selection */}
          <div style={styles.field}>
            <label style={styles.label}>I want to...</label>
            <div style={styles.roleContainer}>
              {['client', 'freelancer'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  style={{
                    ...styles.roleBtn,
                    ...(formData.role === r ? styles.roleBtnActive : {})
                  }}
                >
                  {r === 'client' ? '💼 Hire Talent' : '🚀 Work as Freelancer'}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
           <div style={styles.divider}>
  <span style={styles.dividerLine} />
  <span style={styles.dividerText}>or</span>
  <span style={styles.dividerLine} />
</div>

<a
  href="http://localhost:5000/api/auth/google"
  style={styles.googleBtn}
>
  <img
    src="https://www.google.com/favicon.ico"
    alt="Google"
    style={{ width: '18px', height: '18px' }}
  />
  Continue with Google
</a>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f1a 70%)'
  },
  card: { width: '100%', maxWidth: '420px', padding: '40px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '24px', marginBottom: '16px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
  roleContainer: { display: 'flex', gap: '12px' },
  roleBtn: {
    flex: 1, padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--bg-input)', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
  },
  roleBtnActive: {
    border: '1px solid var(--primary)', color: 'var(--primary)',
    background: 'rgba(108, 99, 255, 0.1)'
  },
  footer: { textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' },
  link: { color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  dividerLine: {
    flex: 1, height: '1px', background: 'var(--border)'
  },
  dividerText: {
    color: 'var(--text-secondary)', fontSize: '12px'
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)',
    textDecoration: 'none', fontSize: '14px', fontWeight: 500,
    transition: 'all 0.2s', cursor: 'pointer'
  }
}

export default Register