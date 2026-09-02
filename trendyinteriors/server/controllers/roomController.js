const Room = require('../models/Room');
const mongoose = require('mongoose');
const { formatValidationError, sendError, sendSuccess } = require('../utils/controllerHelpers');
const { formatRoomResponse } = require('../utils/formatRoomResponse');
const { validateRoomLayoutConfigurations } = require('../utils/layoutMaterials');

const buildRoomFilter = (query) => {
  if (query.includeInactive === 'true') {
    return {};
  }

  if (query.status === 'active' || query.status === 'inactive') {
    return { status: query.status };
  }

  return {
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  };
};

/**
 * Replaces nested arrays during update
 * When an array is provided in the request, it completely replaces the existing array
 * @param {Array} incomingArray - New array from request
 * @param {Function} normalizer - Function to normalize/validate items
 * @returns {Array} Normalized array
 */
const mergeNestedArray = (incomingArray = [], normalizer = (x) => x) => {
  if (!Array.isArray(incomingArray)) {
    return [];
  }

  // Normalize incoming items
  return incomingArray.map(normalizer);
};

/**
 * Normalizes and validates dimension data
 */
const normalizeDimension = (item = {}) => ({
  ...(item._id ? { _id: item._id } : {}),
  name: String(item.name || item.label || '').trim(),
  length: Number(item.length) || 0,
  width: Number(item.width) || 0,
  height: Number(item.height) || 0,
  packageComponents: Array.isArray(item.packageComponents)
    ? item.packageComponents.map((component) => ({
        ...(component._id ? { _id: component._id } : {}),
        name: String(component.name || '').trim(),
        size: String(component.size || '').trim(),
        description: String(component.description || '').trim(),
        price: Number(component.price) || 0,
        mandatory: Boolean(component.mandatory),
        displayOrder: Number(component.displayOrder) || 0,
      }))
    : [],
});

/**
 * Normalizes and validates layout data
 */
const normalizeLayoutMaterial = (material = {}) => ({
  ...(material._id ? { _id: material._id } : {}),
  name: String(material.name || '').trim(),
  size: String(material.size || '').trim(),
  price: Number(material.price) || 0,
  mandatory: Boolean(material.mandatory),
});

const normalizeLayoutConfiguration = (config = {}) => ({
  ...(config._id ? { _id: config._id } : {}),
  dimensionId: config.dimensionId,
  materials: Array.isArray(config.materials)
    ? config.materials.map(normalizeLayoutMaterial)
    : [],
});

const normalizeLayout = (item = {}) => ({
  ...(item._id ? { _id: item._id } : {}),
  name: String(item.name || '').trim(),
  imageUrl: String(item.imageUrl || item.image || '').trim(),
  description: String(item.description || '').trim(),
  fixedPrice: Number(item.fixedPrice ?? item.price) || 0,
  hasLayoutMaterials: Boolean(item.hasLayoutMaterials),
  configurations: Array.isArray(item.configurations)
    ? item.configurations.map(normalizeLayoutConfiguration)
    : [],
});

/**
 * Normalizes and validates addon data
 */
const normalizeAddon = (item = {}) => ({
  ...(item._id ? { _id: item._id } : {}),
  name: String(item.name || '').trim(),
  imageUrl: String(item.imageUrl || item.image || '').trim(),
  description: String(item.description || '').trim(),
  price: Number(item.price) || 0,
});

// Helper to convert various falsy representations to boolean
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() !== 'false' && value !== '0' && value !== '';
  return Boolean(value);
};

const getLegacyRoomLimit = (roomName = '') =>
  String(roomName).toLowerCase().includes('bedroom') ? 6 : 2;

const normalizeMaxSelectableRooms = (value, roomName = '') => {
  const parsed = Number(value);
  const fallback = getLegacyRoomLimit(roomName);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(20, Math.max(1, Math.trunc(parsed)));
};

const normalizeRoomPayload = (body = {}) => {
  const requiresDimensions = body.requiresDimensions !== undefined ? toBoolean(body.requiresDimensions) : true;

  return {
    name: body.name?.trim(),
    description: body.description?.trim() || '',
    imageUrl: body.imageUrl?.trim() || '',
    pricePerSqFt: Number(body.pricePerSqFt) || 0,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    displayOrder: Number(body.displayOrder) || 0,
    allowCustomDimensions: requiresDimensions ? toBoolean(body.allowCustomDimensions) : false,
    requiresDimensions,
    maxSelectableRooms: normalizeMaxSelectableRooms(body.maxSelectableRooms, body.name),
    dimensions: requiresDimensions && Array.isArray(body.dimensions)
      ? body.dimensions.map(normalizeDimension)
      : [],
    layouts: Array.isArray(body.layouts)
      ? body.layouts.map(normalizeLayout)
      : [],
    addons: Array.isArray(body.addons)
      ? body.addons.map(normalizeAddon)
      : [],
  };
};

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(buildRoomFilter(req.query)).sort({ displayOrder: 1, name: 1 });

    sendSuccess(res, 200, {
      count: rooms.length,
      data: rooms.map(formatRoomResponse),
    });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return sendError(res, 404, 'Room not found');
    }

    // Debug: Log room structure
    console.log(`[getRoom] Retrieved: ${room.name}`);
    console.log(`  - Dimensions: ${room.dimensions?.length || 0}`);
    room.dimensions?.forEach((dim, idx) => {
      console.log(`    [${idx}] "${dim.name}": ${dim.packageComponents?.length || 0} packageComponents`);
      if (dim.packageComponents?.length > 0) {
        dim.packageComponents.forEach((comp, cidx) => {
          console.log(`      [${cidx}] "${comp.name}" (₹${comp.price}, mandatory: ${comp.mandatory})`);
        });
      }
    });

    sendSuccess(res, 200, { data: formatRoomResponse(room) });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

const toPlainNestedDoc = (item) => (item?.toObject ? item.toObject() : item);

exports.createRoom = async (req, res) => {
  try {
    const payload = normalizeRoomPayload(req.body);

    if (payload.displayOrder <= 0) {
      const lastRoom = await Room.findOne({}).sort({ displayOrder: -1 }).select('displayOrder');
      payload.displayOrder = (Number(lastRoom?.displayOrder) || 0) + 1;
    }

    const layoutErrors = validateRoomLayoutConfigurations(payload.dimensions, payload.layouts);
    if (layoutErrors.length > 0) {
      return sendError(res, 400, layoutErrors.join(' '));
    }
    
    // Debug: Log packageComponents structure
    console.log(`[createRoom] Creating room: ${payload.name}`);
    console.log(`  - Dimensions: ${payload.dimensions.length}`);
    payload.dimensions.forEach((dim, idx) => {
      console.log(`    [${idx}] "${dim.name}": ${dim.packageComponents?.length || 0} components`);
      if (dim.packageComponents?.length > 0) {
        dim.packageComponents.forEach((comp, cidx) => {
          console.log(`      [${cidx}] "${comp.name}" (₹${comp.price}, mandatory: ${comp.mandatory})`);
        });
      }
    });

    const room = await Room.create(payload);
    
    console.log(`✓ Room created successfully: ${room.name}`);
    sendSuccess(res, 201, { data: formatRoomResponse(room) });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

exports.reorderRooms = async (req, res) => {
  try {
    const orderedRoomIds = Array.isArray(req.body?.orderedRoomIds)
      ? req.body.orderedRoomIds.map((id) => String(id))
      : [];
    const uniqueIds = new Set(orderedRoomIds);

    if (
      orderedRoomIds.length === 0 ||
      uniqueIds.size !== orderedRoomIds.length ||
      orderedRoomIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return sendError(res, 400, 'A unique orderedRoomIds array is required.');
    }

    const [roomCount, matchedRoomCount] = await Promise.all([
      Room.countDocuments({}),
      Room.countDocuments({ _id: { $in: orderedRoomIds } }),
    ]);

    if (orderedRoomIds.length !== roomCount || matchedRoomCount !== roomCount) {
      return sendError(res, 400, 'The room order must include every configured room exactly once.');
    }

    await Room.bulkWrite(
      orderedRoomIds.map((roomId, index) => ({
        updateOne: {
          filter: { _id: roomId },
          update: { $set: { displayOrder: index + 1 } },
        },
      }))
    );

    const rooms = await Room.find({}).sort({ displayOrder: 1, name: 1 });
    return sendSuccess(res, 200, {
      message: 'Room visibility order updated successfully.',
      data: rooms.map(formatRoomResponse),
    });
  } catch (err) {
    return sendError(res, 500, formatValidationError(err));
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    
    // Fetch existing room to intelligently merge nested arrays
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      return sendError(res, 404, 'Room not found');
    }

    // Extract top-level updates
    const updates = {
      name: req.body.name !== undefined ? req.body.name?.trim() : existingRoom.name,
      description: req.body.description !== undefined ? req.body.description?.trim() || '' : existingRoom.description,
      imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl?.trim() || '' : existingRoom.imageUrl,
      pricePerSqFt: req.body.pricePerSqFt !== undefined ? Number(req.body.pricePerSqFt) || 0 : existingRoom.pricePerSqFt,
      status: req.body.status !== undefined ? (req.body.status === 'inactive' ? 'inactive' : 'active') : existingRoom.status,
      allowCustomDimensions: req.body.allowCustomDimensions !== undefined ? toBoolean(req.body.allowCustomDimensions) : existingRoom.allowCustomDimensions,
      requiresDimensions: req.body.requiresDimensions !== undefined ? toBoolean(req.body.requiresDimensions) : existingRoom.requiresDimensions,
      maxSelectableRooms: req.body.maxSelectableRooms !== undefined
        ? normalizeMaxSelectableRooms(req.body.maxSelectableRooms, req.body.name || existingRoom.name)
        : normalizeMaxSelectableRooms(existingRoom.maxSelectableRooms, existingRoom.name),
    };

    console.log(`[updateRoom] Processing updates for "${req.body.name}":`, {
      'req.body.requiresDimensions': req.body.requiresDimensions,
      'typeof': typeof req.body.requiresDimensions,
      'toBoolean(req.body.requiresDimensions)': toBoolean(req.body.requiresDimensions),
      'updates.requiresDimensions': updates.requiresDimensions,
    });

    // Intelligently merge nested arrays
    // If dimensions/layouts/addons are provided in request, use them; otherwise preserve existing
    if (Array.isArray(req.body.dimensions)) {
      updates.dimensions = mergeNestedArray(
        req.body.dimensions,
        normalizeDimension
      );
      console.log(`[updateRoom] Dimensions: updated to ${updates.dimensions.length} items`);
    }

    if (Array.isArray(req.body.layouts)) {
      updates.layouts = mergeNestedArray(
        req.body.layouts,
        normalizeLayout
      );
      console.log(`[updateRoom] Layouts: updated to ${updates.layouts.length} items`);
    }

    if (Array.isArray(req.body.addons)) {
      updates.addons = mergeNestedArray(
        req.body.addons,
        normalizeAddon
      );
      console.log(`[updateRoom] Addons: updated to ${updates.addons.length} items`);
    }

    if (updates.requiresDimensions === false) {
      updates.allowCustomDimensions = false;
      updates.dimensions = [];
    }

    const dimensionsForValidation = Array.isArray(updates.dimensions)
      ? updates.dimensions
      : existingRoom.dimensions;
    const layoutsForValidation = Array.isArray(updates.layouts)
      ? updates.layouts
      : existingRoom.layouts;

    const layoutErrors = validateRoomLayoutConfigurations(
      dimensionsForValidation.map(toPlainNestedDoc),
      layoutsForValidation.map(toPlainNestedDoc)
    );
    if (layoutErrors.length > 0) {
      return sendError(res, 400, layoutErrors.join(' '));
    }

    // Perform update
    const room = await Room.findByIdAndUpdate(roomId, updates, {
      new: true,
      runValidators: true,
    });

    console.log(`[updateRoom] Room "${room.name}" updated successfully`);
    console.log(`  - Actual saved requiresDimensions: ${room.requiresDimensions} (type: ${typeof room.requiresDimensions})`);
    console.log(`  - Actual saved allowCustomDimensions: ${room.allowCustomDimensions} (type: ${typeof room.allowCustomDimensions})`);
    console.log(`  - Dimensions with packageComponents: ${room.dimensions.filter(d => d.packageComponents?.length > 0).length}`);

    sendSuccess(res, 200, { data: formatRoomResponse(room) });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return sendError(res, 404, 'Room not found');
    }

    await room.deleteOne();
    sendSuccess(res, 200, { message: 'Room deleted successfully' });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};
