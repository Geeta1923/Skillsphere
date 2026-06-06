import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../../context/useSocket'
import { useSelector } from 'react-redux'
import API from '../../utils/axios'
import toast from 'react-hot-toast'

const ChatPage = () => {
  const { user } = useSelector(state => state.auth)
  const { socket, onlineUsers } = useSocket()

  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  async function fetchConversations() {
    try {
      const { data } = await API.get('/messages/conversations')
      setConversations(data.conversations)
    } catch {
      toast.error('Failed to load conversations')
    }
  }

  // Fetch conversations on load
  useEffect(() => {
    const loadConversations = async () => {
      await fetchConversations()
    }

    void loadConversations()
  }, [])

  // Socket events
  useEffect(() => {
  if (!socket) return

  socket.on('newMessage', (message) => {
    // Only add if it's relevant to current conversation
    const senderId = message.sender?._id || message.sender
    const isMine = senderId?.toString() === user._id?.toString()
    const isRelevant = isMine
      ? message.receiver?.toString() === selectedUser?._id?.toString()
      : senderId?.toString() === selectedUser?._id?.toString()

    if (isRelevant) {
      setMessages(prev => {
        // Avoid duplicates — remove optimistic message if exists
        const filtered = prev.filter(m =>
          typeof m._id === 'string' ? m._id !== message._id : true
        )
        return [...filtered, message]
      })
    }
    fetchConversations()
  })

    socket.on('userTyping', () => setIsTyping(true))
    socket.on('userStopTyping', () => setIsTyping(false))

    socket.on('incomingCall', ({ from, roomName }) => {
      setIncomingCall({ from, roomName })
      toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p>📞 Incoming video call...</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '4px 12px', fontSize: '12px' }}
              onClick={() => {
                window.open(`https://meet.jit.si/${roomName}`, '_blank')
                toast.dismiss(t.id)
                setIncomingCall(null)
              }}
            >
              Accept
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 12px', fontSize: '12px' }}
              onClick={() => {
                toast.dismiss(t.id)
                setIncomingCall(null)
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ), { duration: 10000, position: 'top-center' })
    })

    return () => {
      socket.off('newMessage')
      socket.off('userTyping')
      socket.off('userStopTyping')
      socket.off('incomingCall')
    }
  }, [socket, selectedUser, user._id])
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectUser = async (chatUser) => {
  // Make sure we have a clean user object with _id
  const targetUser = {
    _id: chatUser._id || chatUser,
    name: chatUser.name,
    avatar: chatUser.avatar,
    role: chatUser.role
  }
  setSelectedUser(targetUser)
  setMessages([])
  setLoading(true)

  // Join socket room
  socket?.emit('joinRoom', targetUser._id)

  try {
    const { data } = await API.get(`/messages/${targetUser._id}`)
    setMessages(data.messages)
  } catch {
    toast.error('Failed to load messages')
  }
  setLoading(false)
}

  const handleSearch = async (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await API.get(`/messages/users/search?query=${query}`)
      setSearchResults(data.users)
    } catch {
      // Ignore search failures silently
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    const messageContent = newMessage
    setNewMessage('') // Clear input immediately

    // Emit via socket only — socket event will add to messages
    socket?.emit('sendMessage', {
      receiverId: selectedUser._id,
      content: messageContent
    })

    // Stop typing indicator
    socket?.emit('stopTyping', { receiverId: selectedUser._id })
  }

  const handleTyping = (e) => {
    const query = e.target.value
    setNewMessage(query)

    if (!selectedUser) return

    socket?.emit('typing', { receiverId: selectedUser._id })

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { receiverId: selectedUser._id })
    }, 2000)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedUser) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await API.post('/messages/upload', formData)
      
      socket?.emit('sendMessage', {
        receiverId: selectedUser._id,
        content: `Sent a file: ${file.name}`,
        messageType: 'file',
        fileUrl: data.fileUrl
      })
      toast.success('File sent!')
    } catch (error) {
      toast.error('Failed to upload file')
    }
    setUploading(false)
  }

  const startVideoCall = () => {
    if (!selectedUser) return
    const roomName = `skillsphere_${user._id.slice(-6)}_${selectedUser._id.slice(-6)}_${Date.now()}`
    
    socket?.emit('callUser', {
      receiverId: selectedUser._id,
      roomName
    })

    window.open(`https://meet.jit.si/${roomName}`, '_blank')
    toast.success('Video call started')
  }

  const isOnline = (userId) => onlineUsers.includes(userId?.toString())

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== user._id)
  }

  return (
    <div style={styles.container}>
      <div style={styles.layout}>

        {/* LEFT — Conversations List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Messages</h3>
          </div>

          {/* Search Users */}
          <div style={styles.searchBox}>
            <input
              className="input"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={handleSearch}
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map(u => (
                <div
                  key={u._id}
                  style={styles.searchItem}
                  onClick={() => {
                    selectUser(u)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                >
                  <div style={styles.avatarSmall}>{u.name?.charAt(0)}</div>
                  <div>
                    <p style={styles.userName}>{u.name}</p>
                    <p style={styles.userRole}>{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conversations */}
          <div style={styles.convList}>
            {conversations.length === 0 && !searchQuery && (
              <div style={styles.emptyConv}>
                <p>💬</p>
                <p>No conversations yet</p>
                <p style={{ fontSize: '12px' }}>Search for a user to start chatting</p>
              </div>
            )}
            {conversations.map(conv => {
              const other = getOtherParticipant(conv)
              if (!other) return null
              return (
                <div
                  key={conv._id}
                  style={{
                    ...styles.convItem,
                    ...(selectedUser?._id === other._id ? styles.convItemActive : {})
                  }}
                  onClick={() => selectUser(other)}
                >
                  <div style={styles.avatarWrapper}>
                    <div style={styles.avatarSmall}>{other.name?.charAt(0)}</div>
                    {isOnline(other._id) && <div style={styles.onlineDot} />}
                  </div>
                  <div style={styles.convInfo}>
                    <p style={styles.convName}>{other.name}</p>
                    <p style={styles.convLast}>
                      {conv.lastMessage?.content?.slice(0, 30) || 'Start a conversation'}
                      {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Chat Window */}
        <div style={styles.chatWindow}>
          {!selectedUser ? (
            <div style={styles.noChat}>
              <p style={{ fontSize: '48px' }}>💬</p>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>Select a conversation</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Search for a user to start chatting
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.avatarWrapper}>
                  <div style={styles.avatarMed}>{selectedUser.name?.charAt(0)}</div>
                  {isOnline(selectedUser._id) && <div style={styles.onlineDot} />}
                </div>
                <div>
                  <p style={styles.chatName}>{selectedUser.name}</p>
                  <p style={styles.chatStatus}>
                    {isOnline(selectedUser._id) ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
                <button 
                  onClick={startVideoCall}
                  style={styles.videoCallBtn}
                  title="Video Call"
                >
                  📹 Video Call
                </button>
              </div>

              {/* Messages */}
              <div style={styles.messages}>
                {loading && (
                  <div style={styles.loadingMsg}>Loading messages...</div>
                )}
{messages.map((msg, i) => {
  // Handle both populated and unpopulated sender
  const senderId = msg.sender?._id || msg.sender
  const isMine = senderId?.toString() === user._id?.toString()

  return (
    <div key={msg._id || i} style={{
      ...styles.msgRow,
      justifyContent: isMine ? 'flex-end' : 'flex-start'
    }}>
      {!isMine && (
        <div style={styles.msgAvatar}>
          {selectedUser?.name?.charAt(0)}
        </div>
      )}
      <div style={{
        ...styles.msgBubble,
        ...(isMine ? styles.msgMine : styles.msgTheirs)
      }}>
        {msg.messageType === 'file' ? (
          <div style={styles.fileMsg}>
            <span style={{ fontSize: '24px' }}>
              {msg.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? '🖼️' : '📄'}
            </span>
            <div style={styles.fileInfo}>
              {msg.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <img 
                  src={msg.fileUrl} 
                  alt="Attachment" 
                  style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                />
              ) : (
                <p style={styles.fileName}>{msg.content || 'Attached File'}</p>
              )}
              <a 
                href={msg.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.downloadLink}
              >
                Download
              </a>
            </div>
          </div>
        ) : (
          <p style={styles.msgContent}>{msg.content}</p>
        )}
        <p style={styles.msgTime}>
          {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
            hour12: false
          })}

          {isMine && (
            <span style={{ marginLeft: '4px' }}>
              {msg.isRead ? ' ✓✓' : ' ✓'}
            </span>
          )}
        </p>
      </div>
    </div>
  )
})}

                {/* Typing Indicator */}
                {isTyping && (
                  <div style={styles.typingIndicator}>
                    <span style={styles.typingDot} />
                    <span style={styles.typingDot} />
                    <span style={styles.typingDot} />
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {selectedUser.name} is typing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.attachBtn}
                  disabled={uploading}
                >
                  {uploading ? '⌛' : '📎'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                
                <input
                  className="input"
                  placeholder={uploading ? "Uploading file..." : `Message ${selectedUser.name}...`}
                  value={newMessage}
                  onChange={handleTyping}
                  style={{ flex: 1, borderRadius: '24px' }}
                  disabled={uploading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || uploading}
                  style={styles.sendBtn}
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { height: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' },
  layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', flex: 1, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' },
  sidebar: { background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '20px 16px', borderBottom: '1px solid var(--border)' },
  sidebarTitle: { fontSize: '18px', fontWeight: 600 },
  searchBox: { padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  searchResults: { background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' },
  searchItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', transition: 'background 0.2s' },
  convList: { flex: 1, overflowY: 'auto' },
  emptyConv: { textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' },
  convItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  convItemActive: { background: 'rgba(108,99,255,0.1)' },
  avatarWrapper: { position: 'relative', flexShrink: 0 },
  avatarSmall: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 },
  avatarMed: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 },
  onlineDot: { position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-card)' },
  convInfo: { flex: 1, minWidth: 0 },
  convName: { fontSize: '14px', fontWeight: 600, marginBottom: '2px' },
  convLast: { fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userName: { fontSize: '14px', fontWeight: 500 },
  userRole: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' },
  chatWindow: { display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', overflow: 'hidden' },
  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  chatHeader: { padding: '16px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' },
  chatName: { fontSize: '15px', fontWeight: 600 },
  chatStatus: { fontSize: '12px', color: 'var(--text-secondary)' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  loadingMsg: { textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  msgAvatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
  msgBubble: { maxWidth: '65%', padding: '10px 14px', borderRadius: '16px' },
  msgMine: { background: 'linear-gradient(135deg, var(--primary), #8b85ff)', borderBottomRightRadius: '4px' },
  msgTheirs: { background: 'var(--bg-card)', borderBottomLeftRadius: '4px' },
  msgContent: { fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' },
  msgTime: { fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', textAlign: 'right' },
  typingIndicator: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 0' },
  typingDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1s infinite' },
  inputArea: { padding: '16px 20px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  attachBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' },
  videoCallBtn: { padding: '8px 16px', background: 'rgba(108,99,255,0.15)', border: '1px solid var(--primary)', borderRadius: '20px', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', marginLeft: 'auto' },
  fileMsg: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  fileInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  fileName: { fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' },
  downloadLink: { fontSize: '11px', color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }
}

export default ChatPage