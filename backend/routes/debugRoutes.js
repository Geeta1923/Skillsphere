const express = require('express');
const router = express.Router();
const { checkCloudinary } = require('../controllers/debugController');

router.get('/cloudinary', checkCloudinary);

module.exports = router;
