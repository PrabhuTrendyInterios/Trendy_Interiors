const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getMeetingRequests,
  getMeetingRequestById,
  updateMeetingRequestStatus,
  deleteMeetingRequest,
} = require('../../controllers/meetingRequestController');

const router = express.Router();

router.get('/', protect, authorize('admin'), getMeetingRequests);
router.get('/:id', protect, authorize('admin'), getMeetingRequestById);
router.put('/:id/status', protect, authorize('admin'), updateMeetingRequestStatus);
router.delete('/:id', protect, authorize('admin'), deleteMeetingRequest);

module.exports = router;
