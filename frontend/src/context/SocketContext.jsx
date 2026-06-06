import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'
import { SocketContext } from './useSocket'

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { user } = useSelector(state => state.auth)

  useEffect(() => {
    if (!user) return

    const newSocket = io('http://localhost:5000', {
      withCredentials: true, // Send cookies for auth
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id)
    })

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users)
    })

    queueMicrotask(() => setSocket(newSocket))

    return () => {
      newSocket.off('connect')
      newSocket.off('onlineUsers')
      newSocket.close()
      setSocket(null)
      setOnlineUsers([])
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}