const express = require('express');
const router = express.Router();
const {
  uploadAvatar,
  uploadResume,
  uploadPortfolioImage,
  deleteAvatar
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadAvatar: avatarUpload,
  uploadResume: resumeUpload,
  uploadPortfolio: portfolioUpload,
  uploadDocs: docsUpload
} = require('../config/cloudinary');

router.use(protect);

router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.post('/resume', resumeUpload.single('resume'), uploadResume);
router.post('/portfolio', portfolioUpload.single('image'), uploadPortfolioImage);
router.post('/docs', docsUpload.single('file'), (req, res) => {
  res.json({ success: true, url: req.file.path, name: req.file.originalname });
});
router.delete('/avatar', deleteAvatar);

module.exports = router;