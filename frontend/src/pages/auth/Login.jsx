import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { authStart, authSuccess, authFail } from '../../redux/slices/authSlice'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [tempUserId, setTempUserId] = useState(null)
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
      const { data } = await API.post('/auth/login', formData)
      
      if (data.require2FA) {
        setShow2FA(true)
        setTempUserId(data.userId)
        dispatch(authFail(null)) // clear loading
        return
      }

      dispatch(authSuccess(data.user))
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed'
      dispatch(authFail(msg))
      toast.error(msg)
    }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    dispatch(authStart())
    try {
      const { data } = await API.post('/auth/2fa/login', {
        userId: tempUserId,
        token: twoFactorCode
      })
      dispatch(authSuccess(data.user))
      toast.success(`Verified! Welcome ${data.user.name}`)
      navigate('/dashboard')
    } catch (error) {
      dispatch(authFail(error.response?.data?.message || 'Invalid code'))
      toast.error('Invalid 2FA code')
    }
  }

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.logo}>⚡ SkillSphere</h1>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {!show2FA ? (
          <form onSubmit={handleSubmit} style={styles.form}>
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

              <div style={{ textAlign: 'right' }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>2FA Verification Code</label>
              <p style={{ ...styles.subtitle, textAlign: 'left', marginBottom: '8px' }}>
                Open your authenticator app to get the 6-digit code.
              </p>
              <input
                className="input"
                type="text"
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button 
              type="button" 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setShow2FA(false)}
            >
              Back to Login
            </button>
          </form>
        )}

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

        {/* Footer */}
        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Sign up</Link>
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
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px'
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '24px', marginBottom: '16px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
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

export default Login