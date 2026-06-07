const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public endpoint to fetch settings
router.get('/', getSettings);

// Admin-only endpoint to update settings
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;
