import { useState, useRef, useEffect } from 'react'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const InterviewPage = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [target, setTarget] = useState({ company: 'Google', role: 'Software Engineer' })
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const startInterview = async () => {
    setLoading(true)
    setInterviewStarted(true)
    try {
      const { data } = await API.post('/ai/interview', {
        messages: [],
        targetCompany: target.company,
        targetRole: target.role
      })
      setMessages([{ isUser: false, text: data.text, time: new Date() }])
    } catch (error) {
      toast.error('Failed to start interview')
      setInterviewStarted(false)
    }
    setLoading(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { isUser: true, text: input, time: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const { data } = await API.post('/ai/interview', {
        messages: updatedMessages,
        targetCompany: target.company,
        targetRole: target.role
      })
      setMessages(prev => [...prev, { isUser: false, text: data.text, time: new Date() }])
    } catch (error) {
      toast.error('Connection lost')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {!interviewStarted ? (
        <div className="glass" style={styles.startCard}>
          <div style={styles.icon}>🎙️</div>
          <h2 style={styles.title}>AI Interview Simulator</h2>
          <p style={styles.subtitle}>Practice for your dream role with our tough AI recruiter.</p>
          
          <div style={styles.setupForm}>
            <div style={styles.field}>
              <label style={styles.label}>Interviewing for (Company)</label>
              <input 
                className="input" 
                value={target.company}
                onChange={e => setTarget({...target, company: e.target.value})}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>
              <input 
                className="input" 
                value={target.role}
                onChange={e => setTarget({...target, role: e.target.value})}
              />
            </div>
            <button className="btn-primary" onClick={startInterview}>
              🚀 Enter Interview Room
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.chatLayout}>
          <div className="glass" style={styles.sidebar}>
            <h3 style={styles.sideTitle}>Interview Info</h3>
            <p style={styles.sideText}><strong>Company:</strong> {target.company}</p>
            <p style={styles.sideText}><strong>Role:</strong> {target.role}</p>
            <div style={styles.divider} />
            <p style={styles.tip}>💡 Tip: Give detailed technical answers to score higher.</p>
            <button style={styles.endBtn} onClick={() => window.location.reload()}>
              End Interview
            </button>
          </div>

          <div className="glass" style={styles.chatBox}>
            <div style={styles.messageList}>
              {messages.map((m, i) => (
                <div key={i} style={m.isUser ? styles.userMsgRow : styles.botMsgRow}>
                  {!m.isUser && <div style={styles.botAvatar}>🤖</div>}
                  <div style={m.isUser ? styles.userBubble : styles.botBubble}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={styles.botMsgRow}>
                  <div style={styles.botAvatar}>🤖</div>
                  <div style={styles.botBubble}>Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} style={styles.inputArea}>
              <input
                className="input"
                style={styles.textInput}
                placeholder="Type your answer here..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button className="btn-primary" style={styles.sendBtn} type="submit" disabled={loading}>
                {loading ? '...' : '📩'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' },
  startCard: { 
    maxWidth: '500px', margin: 'auto', padding: '40px', 
    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' 
  },
  icon: { fontSize: '64px' },
  title: { fontSize: '24px', fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', marginBottom: '10px' },
  setupForm: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: 'var(--text-secondary)' },
  
  chatLayout: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px', flex: 1, minHeight: 0 },
  sidebar: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  sideTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '4px' },
  sideText: { fontSize: '14px', color: 'var(--text-secondary)' },
  divider: { height: '1px', background: 'var(--border)' },
  tip: { fontSize: '12px', fontStyle: 'italic', color: 'var(--primary)', lineHeight: 1.5 },
  endBtn: { 
    marginTop: 'auto', padding: '10px', background: 'rgba(255,100,100,0.1)', 
    border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '8px', cursor: 'pointer' 
  },

  chatBox: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' },
  messageList: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' },
  userMsgRow: { display: 'flex', justifyContent: 'flex-end' },
  botMsgRow: { display: 'flex', justifyContent: 'flex-start', gap: '12px' },
  botAvatar: { 
    width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 
  },
  userBubble: { 
    maxWidth: '70%', padding: '12px 18px', background: 'var(--primary)', 
    color: 'white', borderRadius: '18px 18px 2px 18px', fontSize: '14px', lineHeight: 1.5 
  },
  botBubble: { 
    maxWidth: '70%', padding: '12px 18px', background: 'rgba(255,255,255,0.05)', 
    color: 'var(--text-primary)', border: '1px solid var(--border)', 
    borderRadius: '18px 18px 18px 2px', fontSize: '14px', lineHeight: 1.5 
  },
  inputArea: { padding: '16px 24px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '12px' },
  textInput: { flex: 1 },
  sendBtn: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }
}

export default InterviewPage
