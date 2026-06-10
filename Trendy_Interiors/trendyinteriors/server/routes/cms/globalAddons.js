const express = require('express');
const {
  getGlobalAddons,
  getGlobalAddon,
  createGlobalAddon,
  updateGlobalAddon,
  deleteGlobalAddon,
} = require('../../controllers/globalAddonController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getGlobalAddons);
router.get('/:id', getGlobalAddon);
router.post('/', protect, authorize('admin'), createGlobalAddon);
router.put('/:id', protect, authorize('admin'), updateGlobalAddon);
router.delete('/:id', protect, authorize('admin'), deleteGlobalAddon);

module.exports = router;
