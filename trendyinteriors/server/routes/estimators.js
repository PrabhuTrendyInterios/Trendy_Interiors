const express = require("express");
const Estimator = require("../models/Estimator");
const Room = require("../models/Room");
const GlobalAddon = require("../models/GlobalAddon");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateQuotationPDF } = require("../utils/quotationPDF");
const { calculateEstimate } = require("../utils/calculateEstimate");

const router = express.Router();

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const buildRoomInstances = (rooms) =>
  Object.entries(rooms || {}).flatMap(([roomName, count]) => {
    const quantity = Number(count) || 0;

    return Array.from({ length: quantity }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      originalRoomName: roomName,
      roomName,
      label: quantity > 1 ? `${roomName} ${index + 1}` : roomName,
    }));
  });

const getDimensionsForRoom = (roomDimensionsByRoom = {}, room) => {
  return (
    roomDimensionsByRoom[room.id] ||
    roomDimensionsByRoom[`${room.originalRoomName}-1`] ||
    roomDimensionsByRoom[room.originalRoomName] ||
    roomDimensionsByRoom[room.roomName] ||
    {}
  );
};

const normalizeSelectedDesign = (selectedDesignIdea, room) => {
  const rawDesign =
    selectedDesignIdea && typeof selectedDesignIdea === "object" ? selectedDesignIdea : {};

  return {
    layout: typeof rawDesign.layout === "string" ? rawDesign.layout.trim() : "",
    addons: Array.isArray(rawDesign.addons) ? rawDesign.addons : [],
    room: room.roomName,
  };
};

const validateEstimatorPayload = (payload, roomsCatalog = [], options = {}) => {
  const { requireCompleteRooms = false } = options;
  const errors = [];

  const rooms = payload?.rooms || {};
  const selectedRoomForDimensions = payload?.selectedRoomForDimensions || "";
  const roomDimensionsByRoom = payload?.roomDimensionsByRoom || {};
  const activeRoomNames = roomsCatalog.map((room) => room.name);

  if (!payload?.rooms || typeof payload.rooms !== "object" || Array.isArray(payload.rooms)) {
    errors.push("rooms must be an object of room names and quantities.");
  }

  const roomInstances = buildRoomInstances(rooms);

  if (roomInstances.length === 0) {
    errors.push("At least one room must be selected.");
  }

  if (activeRoomNames.length > 0) {
    Object.keys(rooms).forEach((roomName) => {
      if (!activeRoomNames.includes(roomName)) {
        errors.push(`Room "${roomName}" is not available.`);
      }
    });
  }

  const normalizedDimensions = {};

  roomInstances.forEach((room) => {
    const dimensions = getDimensionsForRoom(roomDimensionsByRoom, room);

    const length = toPositiveNumber(dimensions.length);
    const width = toPositiveNumber(dimensions.width);
    const height = toPositiveNumber(dimensions.height);

    const selectedDesignIdea = normalizeSelectedDesign(dimensions.selectedDesignIdea, room);

    normalizedDimensions[room.id] = {
      length: length || 0,
      width: width || 0,
      height: height || 0,
      selectedDesignIdea,
    };

    if (requireCompleteRooms && (!length || !width || !height)) {
      errors.push(`Missing or invalid dimensions for room: ${room.label}.`);
    }
  });

  const normalizedSelectedRoom = roomInstances.some((room) => room.id === selectedRoomForDimensions)
    ? selectedRoomForDimensions
    : roomInstances[0]?.id || "";

  return {
    errors,
    roomInstances,
    normalizedDimensions,
    rooms,
    selectedRoomForDimensions: normalizedSelectedRoom,
    customerInfo: payload?.customerInfo || {},
    extraAddons: Array.isArray(payload?.extraAddons) ? payload.extraAddons : [],
  };
};

const loadEstimatorData = async () => {
  const [roomsCatalog, globalAddons] = await Promise.all([
    Room.find({ status: 'active' }).sort({ name: 1 }),
    GlobalAddon.find({ active: true }).sort({ order: 1, name: 1 }),
  ]);

  return { roomsCatalog, globalAddons };
};

router.post("/calculate", async (req, res) => {
  try {
    const { roomsCatalog, globalAddons } = await loadEstimatorData();
    const validation = validateEstimatorPayload(req.body, roomsCatalog, { requireCompleteRooms: false });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const quoteSummary = calculateEstimate({
      roomInstances: validation.roomInstances,
      normalizedDimensions: validation.normalizedDimensions,
      extraAddons: validation.extraAddons,
      roomsCatalog,
      globalAddons,
    });

    return res.status(200).json({
      success: true,
      message: "Estimate preview calculated successfully",
      data: { quoteSummary },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { roomsCatalog, globalAddons } = await loadEstimatorData();
    const validation = validateEstimatorPayload(req.body, roomsCatalog, { requireCompleteRooms: true });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const quoteSummary = calculateEstimate({
      roomInstances: validation.roomInstances,
      normalizedDimensions: validation.normalizedDimensions,
      extraAddons: validation.extraAddons,
      roomsCatalog,
      globalAddons,
    });

    const estimator = await Estimator.create({
      rooms: validation.rooms,
      selectedRoomForDimensions: validation.selectedRoomForDimensions,
      roomDimensionsByRoom: validation.normalizedDimensions,
      customerInfo: validation.customerInfo,
      extraAddons: validation.extraAddons,
      quoteSummary,
      status: "submitted",
    });

    req.app.get("io")?.emit("admin:newEstimator", {
      id: estimator._id,
      estimatedAmount: estimator.quoteSummary?.estimatedAmount || 0,
      createdAt: estimator.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: "Estimator submitted successfully",
      data: estimator,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const estimators = await Estimator.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: estimators });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const estimator = await Estimator.findById(req.params.id);

    if (!estimator) {
      return res.status(404).json({ success: false, message: "Estimator not found" });
    }

    return res.status(200).json({ success: true, data: estimator });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Generate and download quotation as PDF
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const estimator = await Estimator.findById(req.params.id);

    if (!estimator) {
      return res.status(404).json({ success: false, message: "Estimator not found" });
    }

    // Pass error handler callback to PDF generator
    generateQuotationPDF(estimator, res, (err) => {
      if (err) {
        console.error('PDF generation failed:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error generating PDF' });
        }
      }
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
    console.error('PDF route error:', error);
  }
});

module.exports = router;
