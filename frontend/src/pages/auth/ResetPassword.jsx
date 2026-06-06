import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      return toast.error('Passwords do not match!')
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await API.post('/auth/reset-password', { token, password })
      toast.success('Password reset successful!')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>⚡ SkillSphere</h1>
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Resetting...' : '🔑 Reset Password'}
          </button>
        </form>
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
  label: { fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }
}

export default ResetPassword