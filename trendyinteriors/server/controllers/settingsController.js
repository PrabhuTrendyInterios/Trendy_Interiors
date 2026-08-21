const Settings = require('../models/Settings');
const { formatValidationError, sendError, sendSuccess } = require('../utils/controllerHelpers');

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  return settings;
};

// @desc    Get application settings
// @route   GET /api/cms/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    sendSuccess(res, 200, { data: settings });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

// @desc    Update application settings (singleton upsert)
// @route   PUT /api/cms/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
      return sendSuccess(res, 201, { data: settings });
    }

    Object.assign(settings, req.body);
    await settings.save();

    sendSuccess(res, 200, { data: settings });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' ? 400 : 500, formatValidationError(err));
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/cms/settings/reset
// @access  Private (Admin only)
exports.resetSettings = async (req, res) => {
  try {
    const existing = await Settings.findOne();

    if (existing) {
      await existing.deleteOne();
    }

    const settings = await Settings.create({});
    sendSuccess(res, 200, { data: settings, message: 'Settings reset to defaults' });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};
