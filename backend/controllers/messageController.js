const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// GET /api/messages/conversations  ← get all conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id
  })
    .populate('participants', 'name avatar role')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  res.json({ success: true, conversations });
});

// GET /api/messages/:userId  ← get messages with a specific user
const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId] }
  });

  if (!conversation) {
    return res.json({ success: true, messages: [], conversation: null });
  }

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ]
  })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    { sender: userId, receiver: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, messages, conversation });
});

// POST /api/messages/:userId  ← send a message (REST fallback)
const sendMessage = asyncHandler(async (req, res) => {
  const { content, gigId } = req.body;
  const { userId } = req.params;

  if (!content?.trim()) {
    res.status(400);
    throw new Error('Message content required');
  }

  // Create message
  const message = await Message.create({
    sender: req.user._id,
    receiver: userId,
    content,
    gig: gigId || null
  });

  await message.populate('sender', 'name avatar');

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, userId],
      gig: gigId || null,
      lastMessage: message._id,
      lastMessageAt: new Date()
    });
  } else {
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }

  res.status(201).json({ success: true, message });
});

// GET /api/messages/users/search  ← search users to start chat
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) return res.json({ success: true, users: [] });

  const users = await User.find({
    _id: { $ne: req.user._id },
    name: { $regex: query, $options: 'i' }
  }).select('name email avatar role').limit(10);

  res.json({ success: true, users });
});

// POST /api/messages/upload  ← upload file for chat
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  res.json({
    success: true,
    fileUrl: req.file.path,
    fileName: req.file.originalname,
    messageType: 'file'
  });
});

module.exports = { 
  getConversations, getMessages, sendMessage, 
  searchUsers, uploadFile 
};