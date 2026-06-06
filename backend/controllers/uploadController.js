const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const { cloudinary } = require('../config/cloudinary');

const uploadAvatar = asyncHandler(async (req, res) => {
  console.log('Upload avatar called')
  console.log('File:', req.file)
  console.log('User:', req.user._id)

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const avatarUrl = req.file.path

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  ).select('-password');

  res.json({ success: true, avatarUrl, user });
});

const uploadResume = asyncHandler(async (req, res) => {
  console.log('Upload resume called')
  console.log('File:', req.file)

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const resumeUrl = req.file.path

  await FreelancerProfile.findOneAndUpdate(
    { user: req.user._id },
    { resumeUrl }
  );

  res.json({ success: true, resumeUrl });
});

const uploadPortfolioImage = asyncHandler(async (req, res) => {
  console.log('Upload portfolio called')
  console.log('File:', req.file)

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  res.json({ success: true, imageUrl: req.file.path });
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.avatar) {
    try {
      const urlParts = user.avatar.split('/')
      const publicIdWithExt = urlParts.slice(-2).join('/')
      const publicId = publicIdWithExt.split('.')[0]
      await cloudinary.uploader.destroy(publicId)
    } catch (err) {
      console.error('Delete avatar error:', err)
    }
    user.avatar = '';
    await user.save();
  }
  res.json({ success: true, message: 'Avatar removed' });
});

module.exports = { uploadAvatar, uploadResume, uploadPortfolioImage, deleteAvatar };