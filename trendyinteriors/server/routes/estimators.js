const express = require('express');
const Estimator = require('../models/Estimator');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_PLANS = ['starter', 'budgetFriendly', 'premium', 'signature'];

const PLAN_BASE_RATE = {
  starter: 7,
  budgetFriendly: 12,
  premium: 20,
  signature: 35,
};

const ROOM_MULTIPLIER = {
  'Living Room': 1.15,
  Bedroom: 1,
  Kitchen: 1.35,
  Bathroom: 1.25,
  'Home Office': 1.1,
  'Dining Room': 1.05,
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const buildRoomInstances = (rooms) =>
  Object.entries(rooms || {}).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    }))
  );

const validateEstimatorPayload = (payload, options = {}) => {
  const { requireCompleteRooms = false } = options;
  const errors = [];

  const rooms = payload?.rooms || {};
  const budgetPlan = payload?.budgetPlan;
  const selectedRoomForDimensions = payload?.selectedRoomForDimensions || '';
  const roomDimensionsByRoom = payload?.roomDimensionsByRoom || {};

  if (!rooms || typeof rooms !== 'object' || Array.isArray(rooms)) {
    errors.push('rooms must be an object of room names and quantities.');
  }

  const roomInstances = buildRoomInstances(rooms);
  if (roomInstances.length === 0) {
    errors.push('At least one room must be selected.');
  }

  if (!VALID_PLANS.includes(budgetPlan)) {
    errors.push(`budgetPlan must be one of: ${VALID_PLANS.join(', ')}.`);
  }

  if (
    selectedRoomForDimensions &&
    roomInstances.length > 0 &&
    !roomInstances.some((room) => room.id === selectedRoomForDimensions)
  ) {
    errors.push('selectedRoomForDimensions must match one generated room instance ID.');
  }

  const normalizedDimensions = {};

  roomInstances.forEach((room) => {
    const dimensions = roomDimensionsByRoom[room.id] || {};
    const length = toPositiveNumber(dimensions.length);
    const width = toPositiveNumber(dimensions.width);
    const height = toPositiveNumber(dimensions.height);
    const selectedDesignIdea = dimensions.selectedDesignIdea || null;

    normalizedDimensions[room.id] = {
      length,
      width,
      height,
      selectedDesignIdea,
    };

    if (requireCompleteRooms) {
      if (!length || !width || !height) {
        errors.push(`Missing or invalid dimensions for room: ${room.id}.`);
      }

      if (!selectedDesignIdea || !selectedDesignIdea.id) {
        errors.push(`selectedDesignIdea is required for room: ${room.id}.`);
      }

      if (selectedDesignIdea?.planTier && selectedDesignIdea.planTier !== budgetPlan) {
        errors.push(`selectedDesignIdea.planTier must match budgetPlan for room: ${room.id}.`);
      }
    }
  });

  return {
    errors,
    roomInstances,
    normalizedDimensions,
    rooms,
    budgetPlan,
    selectedRoomForDimensions,
    customerInfo: payload?.customerInfo || {},
    extraAddons: Array.isArray(payload?.extraAddons) ? payload.extraAddons : [],
  };
};

const calculateQuote = (roomInstances, normalizedDimensions, budgetPlan) => {
  const baseRate = PLAN_BASE_RATE[budgetPlan] || 0;

  const lineItems = roomInstances
    .map((room) => {
      const dimensions = normalizedDimensions[room.id] || {};
      const length = dimensions.length || 0;
      const width = dimensions.width || 0;
      const areaSqFt = Number((length * width).toFixed(2));

      if (areaSqFt <= 0) {
        return null;
      }

      const roomMultiplier = ROOM_MULTIPLIER[room.roomName] || 1;
      const ratePerSqFt = Number((baseRate * roomMultiplier).toFixed(2));
      const estimatedCost = Number((areaSqFt * ratePerSqFt).toFixed(2));

      return {
        roomId: room.id,
        roomName: room.roomName,
        label: room.label,
        areaSqFt,
        ratePerSqFt,
        roomMultiplier,
        estimatedCost,
      };
    })
    .filter(Boolean);

  const totalAreaSqFt = Number(
    lineItems.reduce((sum, item) => sum + item.areaSqFt, 0).toFixed(2)
  );
  const estimatedAmount = Number(
    lineItems.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(2)
  );

  return {
    totalAreaSqFt,
    estimatedAmount,
    currency: 'USD',
    lineItems,
  };
};

// Validate payload and return quote preview (public)
router.post('/calculate', async (req, res) => {
  try {
    const validation = validateEstimatorPayload(req.body, { requireCompleteRooms: false });

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.budgetPlan
    );

    return res.status(200).json({
      success: true,
      message: 'Estimate preview calculated successfully',
      data: {
        quoteSummary,
        completion: {
          totalRooms: validation.roomInstances.length,
          roomsWithMeasurements: validation.roomInstances.filter((room) => {
            const dims = validation.normalizedDimensions[room.id];
            return dims?.length && dims?.width && dims?.height;
          }).length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create estimator submission (public)
router.post('/', async (req, res) => {
  try {
    const validation = validateEstimatorPayload(req.body, { requireCompleteRooms: true });

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.budgetPlan
    );

    const estimator = await Estimator.create({
      rooms: validation.rooms,
      budgetPlan: validation.budgetPlan,
      selectedRoomForDimensions: validation.selectedRoomForDimensions,
      roomDimensionsByRoom: validation.normalizedDimensions,
      customerInfo: validation.customerInfo,
      extraAddons: validation.extraAddons,
      quoteSummary,
      status: 'submitted',
    });

    req.app
      .get('io')
      ?.emit('admin:newEstimator', {
        id: estimator._id,
        budgetPlan: estimator.budgetPlan,
        estimatedAmount: estimator.quoteSummary?.estimatedAmount || 0,
        createdAt: estimator.createdAt,
      });

    return res.status(201).json({
      success: true,
      message: 'Estimator submitted successfully',
      data: estimator,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all estimators (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.budgetPlan) {
      filter.budgetPlan = req.query.budgetPlan;
    }

    const total = await Estimator.countDocuments(filter);
    const estimators = await Estimator.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: estimators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get single estimator (admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const estimator = await Estimator.findById(req.params.id);

    if (!estimator) {
      return res.status(404).json({ success: false, message: 'Estimator not found' });
    }

    return res.status(200).json({ success: true, data: estimator });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
