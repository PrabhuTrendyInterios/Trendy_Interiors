const express = require('express');
const {
  getChatbotConfig,
  updateChatbotConfig,
  resetChatbotConfig,
} = require('../../controllers/chatbotConfigController');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getChatbotConfig);
router.put('/', protect, authorize('admin'), updateChatbotConfig);
router.post('/reset', protect, authorize('admin'), resetChatbotConfig);

module.exports = router;
