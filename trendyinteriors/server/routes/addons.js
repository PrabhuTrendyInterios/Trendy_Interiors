const express = require('express');
const GlobalAddon = require('../models/GlobalAddon');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all active addons (public - for estimator frontend)
router.get('/', async (req, res) => {
  try {
    const addons = await GlobalAddon.find({ active: true }).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      message: 'Global addons retrieved successfully',
      data: addons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving addons',
      error: error.message,
    });
  }
});

// Get all addons including inactive (admin only)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const addons = await GlobalAddon.find({}).sort({ order: 1, name: 1 });
    res.status(200).json({
      success: true,
      message: 'All global addons retrieved successfully',
      data: addons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving addons',
      error: error.message,
    });
  }
});

// Get single addon
router.get('/:id', async (req, res) => {
  try {
    const addon = await GlobalAddon.findById(req.params.id);
    if (!addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon not found',
      });
    }
    res.status(200).json({
      success: true,
      data: addon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving addon',
      error: error.message,
    });
  }
});

// Create new global addon (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, price, description, applicableRooms, active, order } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    const addon = new GlobalAddon({
      name,
      price,
      description,
      applicableRooms: applicableRooms || ['General'],
      active: active !== undefined ? active : true,
      order: order || 0,
    });

    await addon.save();
    res.status(201).json({
      success: true,
      message: 'Global addon created successfully',
      data: addon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Addon with this name already exists',
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Update global addon (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, price, description, applicableRooms, active, order } = req.body;

    const addon = await GlobalAddon.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(price !== undefined && { price }),
          ...(description && { description }),
          ...(applicableRooms && { applicableRooms }),
          ...(active !== undefined && { active }),
          ...(order !== undefined && { order }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Addon updated successfully',
      data: addon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Addon with this name already exists',
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete global addon (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const addon = await GlobalAddon.findByIdAndDelete(req.params.id);

    if (!addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Addon deleted successfully',
      data: addon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
