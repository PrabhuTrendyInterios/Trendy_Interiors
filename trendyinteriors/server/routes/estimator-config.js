const express = require('express');
const EstimatorConfig = require('../models/EstimatorConfig');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_ROOMS = ['Kitchen', 'Bedroom', 'Hall', 'Pooja Room', 'Bathroom', 'Home Office', 'Dining Room'];

// Get estimator configuration (public - for estimator frontend)
router.get('/', async (req, res) => {
  try {
    let config = await EstimatorConfig.findOne();

    if (!config) {
      // Create default config if it doesn't exist
      config = await EstimatorConfig.create({
        rooms: {},
        roomMultipliers: {
          Hall: 1.15,
          Bedroom: 1,
          Kitchen: 1.35,
          'Pooja Room': 1.2
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Estimator config retrieved successfully',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving config',
      error: error.message,
    });
  }
});

// Get single room configuration
router.get('/room/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    const roomConfig = config.rooms?.[roomName] || {};

    res.status(200).json({
      success: true,
      data: roomConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving room config',
      error: error.message,
    });
  }
});

// ================ ADMIN OPERATIONS ================

// Add or update shape for a room (admin only)
router.post('/admin/room/:roomName/shape', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName } = req.params;
    const { name, multiplier, description, active, order } = req.body;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    if (!name || multiplier === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and multiplier are required',
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    // Ensure room config exists
    if (!config.rooms[roomName]) {
      config.rooms[roomName] = { shapes: [], layouts: [], hingeTypes: [], addons: [] };
    }

    // Check if shape already exists
    const existingIndex = config.rooms[roomName].shapes.findIndex(s => s.name === name);

    if (existingIndex >= 0) {
      // Update existing
      config.rooms[roomName].shapes[existingIndex] = {
        name,
        multiplier,
        description,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : config.rooms[roomName].shapes[existingIndex].order,
      };
    } else {
      // Add new
      config.rooms[roomName].shapes.push({
        name,
        multiplier,
        description,
        active: active !== undefined ? active : true,
        order: order || 0,
      });
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Shape added/updated successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete shape from room (admin only)
router.delete('/admin/room/:roomName/shape/:shapeName', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName, shapeName } = req.params;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config || !config.rooms[roomName]) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found',
      });
    }

    config.rooms[roomName].shapes = config.rooms[roomName].shapes.filter(s => s.name !== shapeName);
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Shape deleted successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add or update layout for a room (admin only)
router.post('/admin/room/:roomName/layout', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName } = req.params;
    const { name, price, description, active, order } = req.body;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    if (!config.rooms[roomName]) {
      config.rooms[roomName] = { shapes: [], layouts: [], hingeTypes: [], addons: [] };
    }

    const existingIndex = config.rooms[roomName].layouts.findIndex(l => l.name === name);

    if (existingIndex >= 0) {
      config.rooms[roomName].layouts[existingIndex] = {
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : config.rooms[roomName].layouts[existingIndex].order,
      };
    } else {
      config.rooms[roomName].layouts.push({
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order || 0,
      });
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Layout added/updated successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete layout from room (admin only)
router.delete('/admin/room/:roomName/layout/:layoutName', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName, layoutName } = req.params;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config || !config.rooms[roomName]) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found',
      });
    }

    config.rooms[roomName].layouts = config.rooms[roomName].layouts.filter(l => l.name !== layoutName);
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Layout deleted successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add or update hinge type for a room (admin only)
router.post('/admin/room/:roomName/hinge', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName } = req.params;
    const { name, price, description, active, order } = req.body;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    if (!config.rooms[roomName]) {
      config.rooms[roomName] = { shapes: [], layouts: [], hingeTypes: [], addons: [] };
    }

    const existingIndex = config.rooms[roomName].hingeTypes.findIndex(h => h.name === name);

    if (existingIndex >= 0) {
      config.rooms[roomName].hingeTypes[existingIndex] = {
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : config.rooms[roomName].hingeTypes[existingIndex].order,
      };
    } else {
      config.rooms[roomName].hingeTypes.push({
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order || 0,
      });
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Hinge type added/updated successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete hinge type from room (admin only)
router.delete('/admin/room/:roomName/hinge/:hingeName', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName, hingeName } = req.params;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config || !config.rooms[roomName]) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found',
      });
    }

    config.rooms[roomName].hingeTypes = config.rooms[roomName].hingeTypes.filter(h => h.name !== hingeName);
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Hinge type deleted successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add or update room-specific addon (admin only)
router.post('/admin/room/:roomName/addon', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName } = req.params;
    const { name, price, description, active, order } = req.body;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    if (!config.rooms[roomName]) {
      config.rooms[roomName] = { shapes: [], layouts: [], hingeTypes: [], addons: [] };
    }

    const existingIndex = config.rooms[roomName].addons.findIndex(a => a.name === name);

    if (existingIndex >= 0) {
      config.rooms[roomName].addons[existingIndex] = {
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : config.rooms[roomName].addons[existingIndex].order,
      };
    } else {
      config.rooms[roomName].addons.push({
        name,
        price,
        description,
        active: active !== undefined ? active : true,
        order: order || 0,
      });
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Room addon added/updated successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete room-specific addon (admin only)
router.delete('/admin/room/:roomName/addon/:addonName', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomName, addonName } = req.params;

    if (!VALID_ROOMS.includes(roomName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid room name. Valid rooms: ${VALID_ROOMS.join(', ')}`,
      });
    }

    let config = await EstimatorConfig.findOne();

    if (!config || !config.rooms[roomName]) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found',
      });
    }

    config.rooms[roomName].addons = config.rooms[roomName].addons.filter(a => a.name !== addonName);
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Room addon deleted successfully',
      data: config.rooms[roomName],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update room multipliers (admin only)
router.put('/admin/rates', protect, authorize('admin'), async (req, res) => {
  try {
    const { roomMultipliers } = req.body;

    let config = await EstimatorConfig.findOne();

    if (!config) {
      config = await EstimatorConfig.create({});
    }

    if (roomMultipliers) {
      config.roomMultipliers = { ...config.roomMultipliers, ...roomMultipliers };
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Room multipliers updated successfully',
      data: {
        roomMultipliers: config.roomMultipliers,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
