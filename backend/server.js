const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('./config/passport');

const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');



const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();


// ===== CREATE HTTP SERVER =====
// We wrap express in http.createServer so Socket.IO can use the same port
const server = http.createServer(app);

// ===== SOCKET.IO SETUP =====
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ===== MIDDLEWARE =====
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());


// ===== ROUTES =====
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const gigRoutes = require('./routes/gigRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');



app.get('/', (req, res) => {
  res.json({ message: 'SkillSphere API is running! 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/mentorship', mentorshipRoutes);

// ===== SOCKET.IO EVENTS =====
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

// Store online users: userId -> socketId
const onlineUsers = new Map();
// After: const onlineUsers = new Map();
app.set('io', io);
app.set('onlineUsers', onlineUsers);

io.use((socket, next) => {
  try {
    // Get JWT from cookie
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.jwt;

    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.userId}`);

  // Add to online users
  onlineUsers.set(socket.userId, socket.id);

  // Broadcast online users list
  io.emit('onlineUsers', Array.from(onlineUsers.keys()));

  // ===== JOIN ROOM =====
  socket.on('joinRoom', (userId) => {
    if (!userId) return;
    const roomId = [socket.userId, userId].sort().join('_');
    socket.join(roomId);
  });

  // ===== SEND MESSAGE =====
  socket.on('sendMessage', async ({ receiverId, content, gigId, messageType, fileUrl }) => {
    try {
      // Save to DB
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content: content || (messageType === 'file' ? 'Shared a file' : ''),
        gig: gigId || null,
        messageType: messageType || 'text',
        fileUrl: fileUrl || ''
      });

      await message.populate('sender', 'name avatar');

      // Update conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [socket.userId, receiverId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [socket.userId, receiverId],
          gig: gigId || null,
          lastMessage: message._id,
          lastMessageAt: new Date()
        });
      } else {
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();
      }

      // Send to room (both users)
      const roomId = [socket.userId, receiverId].sort().join('_');
      io.to(roomId).emit('newMessage', message);

      // Send notification to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageNotification', {
          senderId: socket.userId,
          message: messageType === 'file' ? '📁 Shared a file' : content,
          messageType
        });
      }
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // ===== VIDEO CALL EVENTS =====
  socket.on('callUser', ({ receiverId, roomName }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incomingCall', {
        from: socket.userId,
        roomName
      });
    }
  });

  // ===== TYPING INDICATOR =====
  socket.on('typing', ({ receiverId }) => {
    const roomId = [socket.userId, receiverId].sort().join('_');
    socket.to(roomId).emit('userTyping', { userId: socket.userId });
  });

  socket.on('stopTyping', ({ receiverId }) => {
    const roomId = [socket.userId, receiverId].sort().join('_');
    socket.to(roomId).emit('userStopTyping', { userId: socket.userId });
  });

  // ===== DISCONNECT =====
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('🔴 ERROR:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// ===== DATABASE + START =====
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing. Check backend/.env and make sure it is loaded.');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

// Handle Multer errors
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  next(err);
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

app.get('/test-email', async (req, res) => {
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  try {
    await transporter.verify()
    res.json({ success: true, message: 'Email config working!' })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})