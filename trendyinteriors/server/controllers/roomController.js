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

const normalizeRoomPayload = (body = {}) => ({
  name: body.name?.trim(),
  description: body.description?.trim() || '',
  imageUrl: body.imageUrl?.trim() || '',
  pricePerSqFt: Number(body.pricePerSqFt) || 0,
  status: body.status === 'inactive' ? 'inactive' : 'active',
  dimensions: Array.isArray(body.dimensions)
    ? body.dimensions.map((item) => ({
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
      }))
    : [],
  layouts: Array.isArray(body.layouts)
    ? body.layouts.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        name: String(item.name || '').trim(),
        imageUrl: String(item.imageUrl || item.image || '').trim(),
        description: String(item.description || '').trim(),
        fixedPrice: Number(item.fixedPrice ?? item.price) || 0,
      }))
    : [],
  addons: Array.isArray(body.addons)
    ? body.addons.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        name: String(item.name || '').trim(),
        imageUrl: String(item.imageUrl || item.image || '').trim(),
        description: String(item.description || '').trim(),
        price: Number(item.price) || 0,
      }))
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

    sendSuccess(res, 200, { data: room });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(normalizeRoomPayload(req.body));
    sendSuccess(res, 201, { data: room });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, normalizeRoomPayload(req.body), {
      new: true,
      runValidators: true,
    });

    if (!room) {
      return sendError(res, 404, 'Room not found');
    }

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
