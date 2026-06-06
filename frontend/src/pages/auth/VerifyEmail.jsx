import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const hasVerified = useRef(false) // ← key fix

  useEffect(() => {
    // useRef prevents double execution
    if (hasVerified.current) return
    hasVerified.current = true

    const verify = async () => {
      if (!token) {
        setStatus('error')
        return
      }
      try {
        const { data } = await API.get(`/auth/verify-email?token=${token}`)
        console.log('Verify response:', data)
        setStatus('success')
        setTimeout(() => navigate('/login'), 3000)
      } catch (error) {
        console.error('Verify error:', error.response?.data)
        setStatus('error')
      }
    }

    verify()
  }, []) // ← empty deps

  const handleResend = async (e) => {
    e.preventDefault()
    setResending(true)
    try {
      await API.post('/auth/resend-verification', { email })
      toast.success('New verification email sent! Check your inbox.')
    } catch (error) {
      toast.error('Failed to resend')
    }
    setResending(false)
  }

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <h1 style={styles.logo}>⚡ SkillSphere</h1>

        {status === 'verifying' && (
          <div style={styles.content}>
            <p style={{ fontSize: '48px' }}>⏳</p>
            <h2 style={styles.title}>Verifying your email...</h2>
            <p style={styles.subtitle}>Please wait a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.content}>
            <p style={{ fontSize: '48px' }}>✅</p>
            <h2 style={styles.title}>Email Verified!</h2>
            <p style={styles.subtitle}>
              Your account is now active.
              Redirecting to login in 3 seconds...
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{ marginTop: '16px' }}
            >
              Go to Login Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.content}>
            <p style={{ fontSize: '48px' }}>❌</p>
            <h2 style={styles.title}>Link Expired or Invalid</h2>
            <p style={styles.subtitle}>
              Enter your email to get a fresh verification link
            </p>
            <form onSubmit={handleResend} style={styles.resendForm}>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button
                className="btn-primary"
                type="submit"
                disabled={resending}
              >
                {resending ? 'Sending...' : '📧 Resend Verification'}
              </button>
            </form>
            <button
              onClick={() => navigate('/login')}
              style={styles.backBtn}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f1a 70%)', padding: '20px' },
  card: { width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' },
  logo: { fontSize: '24px', marginBottom: '24px', color: 'var(--primary)' },
  content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  title: { fontSize: '24px', fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' },
  resendForm: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' },
  backBtn: { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }
}

export default VerifyEmail