import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const { theme, toggleTheme } = useTheme()

  // useEffect removed to allow logged-in users to view landing page

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Matching',
      desc: 'Our AI matches freelancers to gigs based on skill similarity scoring using HuggingFace'
    },
    {
      icon: '💬',
      title: 'Real-time Chat',
      desc: 'Instant messaging with typing indicators, read receipts built with Socket.IO'
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      desc: 'Milestone-based escrow payments powered by Razorpay with transaction history'
    },
    {
      icon: '⭐',
      title: 'Smart Reviews',
      desc: 'Weighted reputation scoring with verified reviews and fraud detection'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      desc: 'Detailed earnings analytics, proposal tracking and client feedback insights'
    },
    {
      icon: '🛡️',
      title: 'Admin Control',
      desc: 'Full admin panel to manage users, verify freelancers and monitor payments'
    }
  ]

  const stats = [
    { value: '500+', label: 'Freelancers' },
    { value: '1000+', label: 'Projects Posted' },
    { value: '₹50L+', label: 'Paid Out' },
    { value: '4.8★', label: 'Avg Rating' }
  ]

  const steps = [
    { icon: '📝', title: 'Create Profile', desc: 'Sign up and build your professional profile with skills and portfolio' },
    { icon: '🔍', title: 'Browse or Post', desc: 'Clients post gigs, freelancers browse AI-matched opportunities' },
    { icon: '🤝', title: 'Collaborate', desc: 'Chat in real-time, track progress and hit milestones together' },
    { icon: '💰', title: 'Get Paid', desc: 'Secure milestone payments released automatically on completion' }
  ]

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={styles.logoIcon}>⚡</span>
          <span style={styles.logoText}>SkillSphere</span>
        </div>
        <div style={styles.navLinks}>
          <button onClick={toggleTheme} style={styles.themeToggleBtn}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => navigate('/login')}
            style={styles.loginBtn}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 24px' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            🤖 AI-Powered Freelance Platform
          </div>
          <h1 style={styles.heroTitle}>
            Find the Perfect
            <span style={styles.heroGradient}> Freelancer</span>
            <br />for Your Project
          </h1>
          <p style={styles.heroSubtitle}>
            SkillSphere connects clients with skilled freelancers using AI-powered
            job matching, real-time collaboration, and secure milestone payments.
          </p>
          <div style={styles.heroButtons}>
            <button
              className="btn-primary"
              onClick={() => navigate('/register')}
              style={{ width: 'auto', padding: '14px 32px', fontSize: '16px' }}
            >
              🚀 Start as Freelancer
            </button>
            <button
              onClick={() => navigate('/register')}
              style={styles.clientBtn}
            >
              💼 Hire Talent
            </button>
          </div>

          {/* Stats Row */}
          <div style={styles.statsRow}>
            {stats.map((stat, i) => (
              <div key={i} style={styles.statItem}>
                <span style={styles.statValue}>{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual */}
        <div style={styles.heroVisual}>
          <div style={styles.heroCard}>
            <div style={styles.heroCardHeader}>
              <div style={styles.heroAvatar}>G</div>
              <div>
                <p style={styles.heroCardName}>Geeta R</p>
                <p style={styles.heroCardRole}>Full Stack Developer</p>
              </div>
              <span style={styles.heroMatch}>98% match</span>
            </div>
            <div style={styles.heroSkills}>
              {['React', 'Node.js', 'MongoDB'].map(s => (
                <span key={s} style={styles.heroSkillTag}>{s}</span>
              ))}
            </div>
            <div style={styles.heroRating}>
              ⭐⭐⭐⭐⭐ <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>5.0 (24 reviews)</span>
            </div>
          </div>

          <div style={{ ...styles.heroCard, marginTop: '16px', opacity: 0.8 }}>
            <p style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 600 }}>
              🤖 AI Match Found!
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '8px 0' }}>
              Build React Dashboard
            </p>
            <p style={{ fontSize: '13px', color: 'var(--success)' }}>
              ₹5,000 – ₹10,000 · Remote
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything You Need</h2>
          <p style={styles.sectionSub}>
            A complete freelance ecosystem with cutting-edge features
          </p>
        </div>
        <div style={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className="glass" style={styles.featureCard}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ ...styles.section, background: 'rgba(108,99,255,0.05)' }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <p style={styles.sectionSub}>Get started in 4 simple steps</p>
        </div>
        <div style={styles.stepsGrid}>
          {steps.map((step, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={styles.stepNumber}>{i + 1}</div>
              <span style={styles.stepIcon}>{step.icon}</span>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
              {i < steps.length - 1 && (
                <div style={styles.stepArrow}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>
            Ready to Get Started?
          </h2>
          <p style={styles.ctaSub}>
            Join thousands of freelancers and clients on SkillSphere
          </p>
          <div style={styles.ctaButtons}>
            <button
              className="btn-primary"
              onClick={() => navigate('/register')}
              style={{ width: 'auto', padding: '16px 40px', fontSize: '16px' }}
            >
              🚀 Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>
            <span>⚡</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>SkillSphere</span>
          </div>
          <p style={styles.footerText}>
            Intelligent Hyperlocal Freelance Ecosystem
          </p>
          <p style={styles.footerCopy}>
            © 2026 SkillSphere. Built with ❤️ using MERN Stack
          </p>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 80px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-dark)', backdropFilter: 'blur(10px)', zIndex: 100, opacity: 0.95 },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '28px' },
  logoText: { fontSize: '22px', fontWeight: 700, color: 'var(--primary)' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '16px' },
  themeToggleBtn: { background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' },
  loginBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px', minHeight: '90vh', position: 'relative', overflow: 'hidden', gap: '60px' },
  heroBg: { position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' },
  heroContent: { flex: 1, maxWidth: '600px', zIndex: 1 },
  heroBadge: { display: 'inline-block', padding: '8px 16px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '20px', fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginBottom: '24px' },
  heroTitle: { fontSize: '56px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' },
  heroGradient: { background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSubtitle: { fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '36px' },
  heroButtons: { display: 'flex', gap: '16px', marginBottom: '48px' },
  clientBtn: { padding: '14px 32px', background: 'transparent', border: '2px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px', fontWeight: 600, transition: 'all 0.2s' },
  statsRow: { display: 'flex', gap: '40px' },
  statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statValue: { fontSize: '28px', fontWeight: 700, color: 'var(--primary)' },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  heroVisual: { flex: '0 0 360px', zIndex: 1 },
  heroCard: { padding: '20px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  heroCardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  heroAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, flexShrink: 0 },
  heroCardName: { fontWeight: 600, fontSize: '15px', marginBottom: '2px' },
  heroCardRole: { fontSize: '12px', color: 'var(--text-secondary)' },
  heroMatch: { marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: 'var(--success)', background: 'rgba(72,187,120,0.15)', padding: '4px 10px', borderRadius: '10px' },
  heroSkills: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  heroSkillTag: { fontSize: '12px', padding: '4px 10px', borderRadius: '10px', background: 'rgba(108,99,255,0.15)', color: 'var(--primary)' },
  heroRating: { fontSize: '14px' },
  section: { padding: '80px', display: 'flex', flexDirection: 'column', gap: '48px' },
  sectionHeader: { textAlign: 'center' },
  sectionTitle: { fontSize: '40px', fontWeight: 700, marginBottom: '12px' },
  sectionSub: { fontSize: '16px', color: 'var(--text-secondary)' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  featureCard: { padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s' },
  featureIcon: { fontSize: '36px' },
  featureTitle: { fontSize: '18px', fontWeight: 600 },
  featureDesc: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 },
  stepsGrid: { display: 'flex', justifyContent: 'center', gap: '24px', position: 'relative' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', flex: 1, maxWidth: '220px', position: 'relative' },
  stepNumber: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 },
  stepIcon: { fontSize: '40px' },
  stepTitle: { fontSize: '16px', fontWeight: 600 },
  stepDesc: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  stepArrow: { position: 'absolute', right: '-20px', top: '40px', fontSize: '24px', color: 'var(--primary)' },
  ctaSection: { padding: '80px', background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))', borderTop: '1px solid rgba(108,99,255,0.2)' },
  ctaContent: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  ctaTitle: { fontSize: '44px', fontWeight: 700 },
  ctaSub: { fontSize: '16px', color: 'var(--text-secondary)' },
  ctaButtons: { marginTop: '8px' },
  footer: { padding: '40px 80px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' },
  footerContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' },
  footerText: { fontSize: '14px', color: 'var(--text-secondary)' },
  footerCopy: { fontSize: '12px', color: 'var(--text-secondary)' }
}

export default LandingPage