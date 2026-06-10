const GlobalAddon = require('../models/GlobalAddon');
const { formatValidationError, sendError, sendSuccess } = require('../utils/controllerHelpers');

// @desc    Get all global addons
// @route   GET /api/cms/global-addons
// @access  Public
const buildGlobalAddonFilter = (query) => {
  if (query.includeInactive === 'true') {
    return {};
  }

  if (query.active === 'false') {
    return { active: false };
  }

  return { active: true };
};

exports.getGlobalAddons = async (req, res) => {
  try {
    const addons = await GlobalAddon.find(buildGlobalAddonFilter(req.query)).sort({ order: 1, name: 1 });

    sendSuccess(res, 200, {
      count: addons.length,
      data: addons,
    });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

// @desc    Get single global addon
// @route   GET /api/cms/global-addons/:id
// @access  Public
exports.getGlobalAddon = async (req, res) => {
  try {
    const addon = await GlobalAddon.findById(req.params.id);

    if (!addon) {
      return sendError(res, 404, 'Global addon not found');
    }

    sendSuccess(res, 200, { data: addon });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

// @desc    Create global addon
// @route   POST /api/cms/global-addons
// @access  Private (Admin only)
exports.createGlobalAddon = async (req, res) => {
  try {
    const addon = await GlobalAddon.create(req.body);
    sendSuccess(res, 201, { data: addon });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

// @desc    Update global addon
// @route   PUT /api/cms/global-addons/:id
// @access  Private (Admin only)
exports.updateGlobalAddon = async (req, res) => {
  try {
    const addon = await GlobalAddon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!addon) {
      return sendError(res, 404, 'Global addon not found');
    }

    sendSuccess(res, 200, { data: addon });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

// @desc    Delete global addon
// @route   DELETE /api/cms/global-addons/:id
// @access  Private (Admin only)
exports.deleteGlobalAddon = async (req, res) => {
  try {
    const addon = await GlobalAddon.findById(req.params.id);

    if (!addon) {
      return sendError(res, 404, 'Global addon not found');
    }

    await addon.deleteOne();
    sendSuccess(res, 200, { message: 'Global addon deleted successfully' });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};
