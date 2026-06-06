const express = require('express');
const {
  getSettings,
  updateSettings,
  resetSettings,
} = require('../../controllers/settingsController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/reset', protect, authorize('admin'), resetSettings);

module.exports = router;
