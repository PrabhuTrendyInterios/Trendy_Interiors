const express = require('express');
const Estimator = require('../../models/Estimator');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/cms/estimators
// @desc    Get all estimators for admin
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const estimators = await Estimator.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: estimators });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/cms/estimators/:id
// @desc    Get estimator details for admin
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const estimator = await Estimator.findById(req.params.id);

    if (!estimator) {
      return res.status(404).json({ success: false, message: 'Estimator not found' });
    }

    return res.status(200).json({ success: true, data: estimator });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
