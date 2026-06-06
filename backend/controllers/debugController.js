const asyncHandler = require('express-async-handler');
const { cloudinary } = require('../config/cloudinary');

const checkCloudinary = asyncHandler(async (req, res) => {
  const envVars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
  };

  const missing = Object.entries(envVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    return res.status(500).json({
      success: false,
      message: 'Missing Cloudinary environment variables',
      missing,
      envVars
    });
  }

  const pingResponse = await new Promise((resolve, reject) => {
    cloudinary.api.ping((error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });

  res.json({
    success: true,
    message: 'Cloudinary is reachable',
    envVars,
    pingResponse
  });
});

module.exports = { checkCloudinary };
