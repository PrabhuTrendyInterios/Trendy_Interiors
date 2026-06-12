const express = require('express');
const {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../../controllers/teamMemberController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);
router.post('/', protect, authorize('admin'), createTeamMember);
router.put('/:id', protect, authorize('admin'), updateTeamMember);
router.delete('/:id', protect, authorize('admin'), deleteTeamMember);

module.exports = router;
