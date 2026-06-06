const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure ONLY when called — not on import
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

// Call it immediately — dotenv should already be loaded by server.js
configureCloudinary();

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'skillsphere/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
    public_id: `avatar_${req.user._id}_${Date.now()}`
  })
});

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'skillsphere/resumes',
    resource_type: 'raw',
    public_id: `resume_${req.user._id}_${Date.now()}`
  })
});

const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'skillsphere/portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill' }],
    public_id: `portfolio_${Date.now()}`
  })
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images allowed!'), false)
    }
  }
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images allowed!'), false)
    }
  }
});

const disputeEvidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'skillsphere/dispute_evidence',
      resource_type: isImage ? 'image' : 'raw', 
      public_id: `evidence_${Date.now()}_${file.originalname.split('.')[0]}`
    };
  }
});

const uploadDisputeEvidence = multer({
  storage: disputeEvidenceStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const chatAttachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'skillsphere/chat_attachments',
      resource_type: isImage ? 'image' : 'raw', 
      public_id: `chat_${Date.now()}_${file.originalname.split('.')[0]}`
    };
  }
});

const uploadChatAttachment = multer({
  storage: chatAttachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const gigDocStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'skillsphere/gig_docs',
      resource_type: isImage ? 'image' : 'raw', 
      public_id: `doc_${Date.now()}_${file.originalname.split('.')[0]}`
    };
  }
});

const uploadDocs = multer({
  storage: gigDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = { 
  cloudinary, 
  uploadAvatar, 
  uploadResume, 
  uploadPortfolio,
  uploadDisputeEvidence,
  uploadChatAttachment,
  uploadDocs
};