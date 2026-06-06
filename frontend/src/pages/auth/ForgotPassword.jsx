import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await API.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent!')
    } catch {
      toast.error('Failed to send reset email')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>⚡ SkillSphere</h1>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>
            Enter your email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div style={styles.successBox}>
            <p style={{ fontSize: '40px', textAlign: 'center' }}>📧</p>
            <p style={{ fontWeight: 600, textAlign: 'center' }}>
              Reset link sent!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
              Check your email inbox for the password reset link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : '📧 Send Reset Link'}
            </button>
          </form>
        )}

        <p style={styles.footer}>
          Remember your password?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f1a 70%)' },
  card: { width: '100%', maxWidth: '420px', padding: '40px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '24px', marginBottom: '16px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
  successBox: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px', background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: '12px' },
  footer: { textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' },
  link: { color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }
}

export default ForgotPassword