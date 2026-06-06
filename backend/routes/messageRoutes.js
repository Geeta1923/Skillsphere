const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  searchUsers,
  uploadFile
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatAttachment } = require('../config/cloudinary');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/users/search', searchUsers);
router.post('/upload', uploadChatAttachment.single('file'), uploadFile);
router.get('/:userId', getMessages);
router.post('/:userId', sendMessage);

module.exports = router;