const ActivityLog = require('../models/ActivityLog');

const RESOURCE_LABELS = {
  projects: 'Project',
  'team-members': 'Team Member',
  rooms: 'Room',
  'global-addons': 'Global Addon',
  settings: 'Settings',
  'chatbot-config': 'Chatbot Config',
  'meeting-requests': 'Meeting Request',
  estimators: 'Estimate',
  'admin-users': 'Admin User',
  auth: 'Account',
};

const ACTION_LABELS = {
  POST: 'created',
  PUT: 'updated',
  PATCH: 'updated',
  DELETE: 'deleted',
};

const describeRequest = (req) => {
  const segments = req.baseUrl
    .replace(/^\/api\/(cms\/)?/, '')
    .split('/')
    .filter(Boolean);
  const resourceKey = segments[0] || 'resource';
  const resource = RESOURCE_LABELS[resourceKey] || resourceKey;

  const fullPath = `${req.baseUrl}${req.path}`;
  let action = ACTION_LABELS[req.method] || 'modified';

  if (fullPath.includes('/login')) action = 'logged in';
  else if (fullPath.includes('/register')) action = 'registered';
  else if (fullPath.includes('/status')) action = 'status updated';
  else if (fullPath.includes('/reorder')) action = 'reordered';
  else if (fullPath.includes('change-password') || fullPath.includes('reset-password')) action = 'password changed';
  else if (fullPath.includes('forgot-password')) return null; // pre-auth, no identified user yet

  return { resource, action };
};

// Mount early in the router chain (e.g. router.use(trackActivity) before sub-routes).
// Reads req.user lazily on 'finish' so it works regardless of where `protect` runs.
const trackActivity = (req, res, next) => {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (mutating) {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      if (!req.user) return; // skip unauthenticated/public mutations

      const described = describeRequest(req);
      if (!described) return;

      ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: described.action,
        resource: described.resource,
        method: req.method,
        path: `${req.baseUrl}${req.path}`,
        statusCode: res.statusCode,
      }).catch((err) => console.error('[ActivityLog] Failed to record activity:', err.message));
    });
  }

  next();
};

module.exports = { trackActivity };
