const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getMeetingRequests,
  getMeetingRequestById,
  updateMeetingRequestStatus,
} = require('../../controllers/meetingRequestController');

const router = express.Router();

router.get('/', protect, authorize('admin'), getMeetingRequests);
router.get('/:id', protect, authorize('admin'), getMeetingRequestById);
router.put('/:id/status', protect, authorize('admin'), updateMeetingRequestStatus);

module.exports = router;
