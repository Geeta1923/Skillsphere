const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// GET /api/notifications  ← get my notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id
  })
    .sort({ createdAt: -1 })
    .limit(20);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  res.json({ success: true, notifications, unreadCount });
});

// PUT /api/notifications/read-all  ← mark all as read
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

// PUT /api/notifications/:id/read  ← mark one as read
const markOneRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

// Helper to create + send notification via socket
const createNotification = async (io, onlineUsers, {
  recipientId, type, title, message, link, data
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type, title, message,
      link: link || '',
      data: data || {}
    });

    // Send real-time if user is online
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) {
      io.to(socketId).emit('newNotification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Notification error:', error);
  }
};

module.exports = { getNotifications, markAllRead, markOneRead, createNotification };