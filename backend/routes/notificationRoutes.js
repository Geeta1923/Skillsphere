const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAllRead,
  markOneRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);

module.exports = router;