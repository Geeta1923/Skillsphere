const StatCard = ({ icon, label, value, trend, color }) => {
  return (
    <div className="glass" style={styles.card}>
      <div style={styles.top}>
        <div style={{ ...styles.iconBox, background: color || 'rgba(108,99,255,0.15)' }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            ...styles.trend,
            color: trend > 0 ? 'var(--success)' : 'var(--error)'
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={styles.value}>{value}</p>
      <p style={styles.label}>{label}</p>
    </div>
  )
}

const styles = {
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  iconBox: {
    width: '48px', height: '48px',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '22px'
  },
  trend: { fontSize: '13px', fontWeight: 600 },
  value: { fontSize: '28px', fontWeight: 700 },
  label: { fontSize: '13px', color: 'var(--text-secondary)' }
}

export default StatCard