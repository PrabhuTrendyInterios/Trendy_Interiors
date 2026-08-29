const express = require('express');
const ActivityLog = require('../../models/ActivityLog');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/cms/activity-logs
// @desc    List recent admin activity (most recent first)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 300);
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
