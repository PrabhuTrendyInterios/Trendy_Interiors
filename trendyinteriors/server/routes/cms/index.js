const express = require('express');
const projectRoutes = require('./projects');
const teamMemberRoutes = require('./teamMembers');
const roomRoutes = require('./rooms');
const globalAddonRoutes = require('./globalAddons');
const settingsRoutes = require('./settings');
const chatbotConfigRoutes = require('./chatbotConfig');
const meetingRequestRoutes = require('./meetingRequests');
const estimatorRoutes = require('./estimators');

const router = express.Router();

router.use('/projects', projectRoutes);
router.use('/team-members', teamMemberRoutes);
router.use('/rooms', roomRoutes);
router.use('/global-addons', globalAddonRoutes);
router.use('/settings', settingsRoutes);
router.use('/chatbot-config', chatbotConfigRoutes);
router.use('/meeting-requests', meetingRequestRoutes);
router.use('/estimators', estimatorRoutes);

module.exports = router;
