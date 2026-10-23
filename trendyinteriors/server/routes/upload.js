const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Store files in memory so we can stream them to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/upload?folder=<name> — upload a single image to Cloudinary (admin only)
// Supported folder values: projects, team-members
router.post('/', protect, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Invalid file' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
      }

      const folderName = req.query.folder || '';

      const { fileId, url } = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        folderName
      );

      res.status(201).json({ success: true, data: { fileId, url } });
    } catch (uploadErr) {
      console.error('[Upload] Error uploading to Cloudinary:', uploadErr.message);
      res.status(500).json({ success: false, error: uploadErr.message || 'Upload failed' });
    }
  });
});

module.exports = router;
