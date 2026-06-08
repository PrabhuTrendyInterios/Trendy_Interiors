const Room = require('../models/Room');
const { formatValidationError, sendError, sendSuccess } = require('../utils/controllerHelpers');

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
 * Intelligently merges nested arrays during update
 * Preserves existing items by _id if they're not being explicitly updated
 * @param {Array} existingArray - Current array from database
 * @param {Array} incomingArray - New array from request
 * @param {Function} normalizer - Function to normalize/validate items
 * @returns {Array} Merged array
 */
const mergeNestedArray = (existingArray = [], incomingArray = [], normalizer = (x) => x) => {
  if (!Array.isArray(incomingArray)) {
    return existingArray;
  }

  if (incomingArray.length === 0) {
    return [];
  }

  // Normalize incoming items
  const normalizedIncoming = incomingArray.map(normalizer);

  // If no existing items, return all incoming
  if (!Array.isArray(existingArray) || existingArray.length === 0) {
    return normalizedIncoming;
  }

  // Merge: for each incoming item, use it if _id matches, otherwise create new
  const incomingByIdSet = new Set(
    normalizedIncoming
      .filter((item) => item._id)
      .map((item) => item._id.toString())
  );

  // Preserve existing items that aren't being updated
  const preserved = existingArray.filter(
    (existing) => existing._id && !incomingByIdSet.has(existing._id.toString())
  );

  return [...normalizedIncoming, ...preserved];
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
const normalizeLayout = (item = {}) => ({
  ...(item._id ? { _id: item._id } : {}),
  name: String(item.name || '').trim(),
  imageUrl: String(item.imageUrl || item.image || '').trim(),
  description: String(item.description || '').trim(),
  fixedPrice: Number(item.fixedPrice ?? item.price) || 0,
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

const normalizeRoomPayload = (body = {}) => ({
  name: body.name?.trim(),
  description: body.description?.trim() || '',
  imageUrl: body.imageUrl?.trim() || '',
  pricePerSqFt: Number(body.pricePerSqFt) || 0,
  status: body.status === 'inactive' ? 'inactive' : 'active',
  dimensions: Array.isArray(body.dimensions)
    ? body.dimensions.map(normalizeDimension)
    : [],
  layouts: Array.isArray(body.layouts)
    ? body.layouts.map(normalizeLayout)
    : [],
  addons: Array.isArray(body.addons)
    ? body.addons.map(normalizeAddon)
    : [],
});

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(buildRoomFilter(req.query)).sort({ name: 1 });

    sendSuccess(res, 200, {
      count: rooms.length,
      data: rooms,
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

    sendSuccess(res, 200, { data: room });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

exports.createRoom = async (req, res) => {
  try {
    const payload = normalizeRoomPayload(req.body);
    
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
    sendSuccess(res, 201, { data: room });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
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
    };

    // Intelligently merge nested arrays
    // If dimensions/layouts/addons are provided in request, use them; otherwise preserve existing
    if (Array.isArray(req.body.dimensions)) {
      updates.dimensions = mergeNestedArray(
        existingRoom.dimensions,
        req.body.dimensions,
        normalizeDimension
      );
      console.log(`[updateRoom] Dimensions: merged ${updates.dimensions.length} items (${existingRoom.dimensions.length} existing + updates)`);
    }

    if (Array.isArray(req.body.layouts)) {
      updates.layouts = mergeNestedArray(
        existingRoom.layouts,
        req.body.layouts,
        normalizeLayout
      );
      console.log(`[updateRoom] Layouts: merged ${updates.layouts.length} items (${existingRoom.layouts.length} existing + updates)`);
    }

    if (Array.isArray(req.body.addons)) {
      updates.addons = mergeNestedArray(
        existingRoom.addons,
        req.body.addons,
        normalizeAddon
      );
      console.log(`[updateRoom] Addons: merged ${updates.addons.length} items (${existingRoom.addons.length} existing + updates)`);
    }

    // Perform update
    const room = await Room.findByIdAndUpdate(roomId, updates, {
      new: true,
      runValidators: true,
    });

    console.log(`[updateRoom] Room "${room.name}" updated successfully`);
    console.log(`  - Dimensions with packageComponents: ${room.dimensions.filter(d => d.packageComponents?.length > 0).length}`);

    sendSuccess(res, 200, { data: room });
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
