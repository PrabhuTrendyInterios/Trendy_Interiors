const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  reorderRooms,
  updateRoom,
  deleteRoom,
} = require('../../controllers/roomController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getRooms);
router.put('/reorder', protect, authorize('admin'), reorderRooms);
router.get('/:id', getRoom);
router.post('/', protect, authorize('admin'), createRoom);
router.put('/:id', protect, authorize('admin'), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);

module.exports = router;
