const express = require("express");
const Estimator = require("../models/Estimator");
const EstimatorConfig = require("../models/EstimatorConfig");
const GlobalAddon = require("../models/GlobalAddon");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateQuotationPDF } = require("../utils/quotationPDF");

const router = express.Router();

const DEFAULT_ROOM_MULTIPLIER = {
  Hall: 1.15,
  Bedroom: 1,
  Kitchen: 1.35,
  'Pooja Room': 1.2,
  Bathroom: 1.25,
  'Home Office': 1.1,
  'Dining Room': 1.05,
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getRoomType = (roomName = "") => {
  const lower = String(roomName).toLowerCase();

  if (lower.includes("kitchen")) return "Kitchen";
  if (lower.includes("bedroom")) return "Bedroom";
  if (lower.includes("hall")) return "Hall";
  if (lower.includes("pooja")) return "Pooja Room";

  return "General";
};

const getCanonicalRoomName = (roomName = "") => {
  const type = getRoomType(roomName);
  return type === "General" ? String(roomName || "General").trim() || "General" : type;
};

const roomSupportsLayout = (roomName = "") => {
  const type = getRoomType(roomName);
  return type === "Kitchen" || type === "Bedroom";
};

const roomNeedsAddons = (roomName = "") => {
  const type = getRoomType(roomName);
  return type === "Kitchen" || type === "Bedroom" || type === "Hall";
};

const buildRoomInstances = (rooms) =>
  Object.entries(rooms || {}).flatMap(([roomName, count]) => {
    const quantity = Number(count) || 0;
    const canonicalRoomName = getCanonicalRoomName(roomName);

    return Array.from({ length: quantity }, (_, index) => ({
      id: `${canonicalRoomName}-${index + 1}`,
      originalRoomName: roomName,
      roomName: canonicalRoomName,
      label: quantity > 1 ? `${canonicalRoomName} ${index + 1}` : canonicalRoomName,
      roomType: getRoomType(roomName),
      supportsLayout: roomSupportsLayout(roomName),
      needsAddons: roomNeedsAddons(roomName),
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
    roomType: room.roomType,
  };
};

const normalizeRoomsObject = (rooms = {}) => {
  const normalized = {};

  Object.entries(rooms || {}).forEach(([roomName, count]) => {
    const canonicalRoomName = getCanonicalRoomName(roomName);
    normalized[canonicalRoomName] = (Number(normalized[canonicalRoomName]) || 0) + (Number(count) || 0);
  });

  return normalized;
};

const validateEstimatorPayload = (payload, options = {}) => {
  const { requireCompleteRooms = false, requireBudgetPlan = true } = options;
  const errors = [];

  const rooms = normalizeRoomsObject(payload?.rooms || {});
  const budgetPlan = payload?.budgetPlan;
  const selectedRoomForDimensions = payload?.selectedRoomForDimensions || "";
  const roomDimensionsByRoom = payload?.roomDimensionsByRoom || {};

  if (!payload?.rooms || typeof payload.rooms !== "object" || Array.isArray(payload.rooms)) {
    errors.push("rooms must be an object of room names and quantities.");
  }

  const roomInstances = buildRoomInstances(rooms);

  if (roomInstances.length === 0) {
    errors.push("At least one room must be selected.");
  }

  if (requireBudgetPlan && false) {
    // Budget plan validation removed - no longer required
  }

  const normalizedDimensions = {};

  roomInstances.forEach((room) => {
    const dimensions = getDimensionsForRoom(roomDimensionsByRoom, room);

    const length = toPositiveNumber(dimensions.length);
    const width = toPositiveNumber(dimensions.width);
    const height = toPositiveNumber(dimensions.height);

    const selectedDesignIdea = normalizeSelectedDesign(
      dimensions.selectedDesignIdea,
      room,
      budgetPlan
    );

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
    budgetPlan,
    selectedRoomForDimensions: normalizedSelectedRoom,
    customerInfo: payload?.customerInfo || {},
    extraAddons: Array.isArray(payload?.extraAddons) ? payload.extraAddons : [],
  };
};

const getDesignCost = (selectedDesignIdea = {}, room, estimatorConfig = {}) => {
  let cost = 0;
  const roomConfig = estimatorConfig.rooms?.[room.roomType] || {};

  // Add layout cost from database
  if (room.supportsLayout && selectedDesignIdea.layout && roomConfig.layouts) {
    const layout = roomConfig.layouts.find(l => l.name === selectedDesignIdea.layout && l.active);
    cost += layout ? layout.price : 0;
  }

  // Add individual room-specific add-on costs
  if (room.needsAddons && Array.isArray(selectedDesignIdea.addons) && roomConfig.addons) {
    selectedDesignIdea.addons.forEach((addonName) => {
      const addon = roomConfig.addons.find(a => a.name === addonName && a.active);
      cost += addon ? addon.price : 0;
    });
  }

  return cost;
};

const calculateQuote = (roomInstances, normalizedDimensions, extraAddons = [], estimatorConfig = {}, globalAddons = []) => {
  const roomMultipliers = estimatorConfig.roomMultipliers || DEFAULT_ROOM_MULTIPLIER;
  const baseRate = 1000;

  const lineItems = roomInstances
    .map((room) => {
      const dimensions = normalizedDimensions[room.id] || {};
      const areaSqFt = Number(((dimensions.length || 0) * (dimensions.width || 0)).toFixed(2));

      if (areaSqFt <= 0) return null;

      const selectedDesignIdea = dimensions.selectedDesignIdea || {};
      const roomMultiplier = roomMultipliers[room.roomType] || 1;
      const ratePerSqFt = Number((baseRate * roomMultiplier).toFixed(2));
      
      // Calculate base cost
      const baseCost = Number((areaSqFt * ratePerSqFt).toFixed(2));
      
      // Calculate layout cost from database
      let layoutCost = 0;
      if (room.supportsLayout && selectedDesignIdea.layout) {
        const roomConfig = estimatorConfig.rooms?.[room.roomType] || {};
        const layout = roomConfig.layouts?.find(l => l.name === selectedDesignIdea.layout && l.active);
        layoutCost = layout ? layout.price : 0;
      }
      
      // Calculate room-specific addons cost from database
      let addonsCost = 0;
      if (room.needsAddons && Array.isArray(selectedDesignIdea.addons)) {
        const roomConfig = estimatorConfig.rooms?.[room.roomType] || {};
        selectedDesignIdea.addons.forEach((addonName) => {
          const addon = roomConfig.addons?.find(a => a.name === addonName && a.active);
          addonsCost += addon ? addon.price : 0;
        });
      }

      return {
        roomId: room.id,
        roomName: room.roomName,
        label: room.label,
        areaSqFt,
        ratePerSqFt,
        roomMultiplier,
        layout: selectedDesignIdea.layout || "",
        addons: selectedDesignIdea.addons || [],
        baseCost,
        layoutCost,
        addonsCost,
        estimatedCost: Number((baseCost + layoutCost + addonsCost).toFixed(2)),
      };
    })
    .filter(Boolean);

  // Calculate global add-ons cost from database
  let globalAddonsCost = 0;
  const selectedGlobalAddons = [];
  
  if (Array.isArray(extraAddons) && extraAddons.length > 0 && globalAddons.length > 0) {
    extraAddons.forEach((addonId) => {
      const addon = globalAddons.find(a => a._id?.toString() === addonId || a.name === addonId);
      if (addon && addon.active) {
        globalAddonsCost += addon.price || 0;
        selectedGlobalAddons.push(addon.name);
      }
    });
  }

  // Add global add-ons as a line item if any were selected
  if (globalAddonsCost > 0 && selectedGlobalAddons.length > 0) {
    lineItems.push({
      roomId: "global-addons",
      roomName: "Global Add-ons",
      label: "Premium Add-ons",
      areaSqFt: 0,
      ratePerSqFt: 0,
      roomMultiplier: 1,
      layout: "",
      addons: selectedGlobalAddons,
      baseCost: 0,
      layoutCost: 0,
      addonsCost: globalAddonsCost,
      estimatedCost: globalAddonsCost,
    });
  }

  const totalAreaSqFt = Number(lineItems.filter(item => item.areaSqFt > 0).reduce((sum, item) => sum + item.areaSqFt, 0).toFixed(2));
  const estimatedAmount = Number(lineItems.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(2));

  return {
    totalAreaSqFt,
    estimatedAmount,
    currency: "INR",
    lineItems,
  };
};

router.post("/calculate", async (req, res) => {
  try {
    const validation = validateEstimatorPayload(req.body, { requireCompleteRooms: false, requireBudgetPlan: false });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    // Fetch estimator config and global addons from database
    let estimatorConfig = await EstimatorConfig.findOne();
    if (!estimatorConfig) {
      estimatorConfig = await EstimatorConfig.create({});
    }

    const globalAddons = await GlobalAddon.find({ active: true });

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.extraAddons,
      estimatorConfig,
      globalAddons
    );

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
    const validation = validateEstimatorPayload(req.body, { requireCompleteRooms: true });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    // Fetch estimator config and global addons from database
    let estimatorConfig = await EstimatorConfig.findOne();
    if (!estimatorConfig) {
      estimatorConfig = await EstimatorConfig.create({});
    }

    const globalAddons = await GlobalAddon.find({ active: true });

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.extraAddons,
      estimatorConfig,
      globalAddons
    );

    const estimator = await Estimator.create({
      rooms: validation.rooms,
      budgetPlan: validation.budgetPlan,
      selectedRoomForDimensions: validation.selectedRoomForDimensions,
      roomDimensionsByRoom: validation.normalizedDimensions,
      customerInfo: validation.customerInfo,
      extraAddons: validation.extraAddons,
      quoteSummary,
      status: "submitted",
    });

    req.app.get("io")?.emit("admin:newEstimator", {
      id: estimator._id,
      budgetPlan: estimator.budgetPlan,
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
