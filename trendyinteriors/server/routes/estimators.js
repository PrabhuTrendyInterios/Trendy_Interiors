const express = require("express");
const Estimator = require("../models/Estimator");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateQuotationPDF } = require("../utils/quotationPDF");

const router = express.Router();

const VALID_PLANS = ["starter", "budgetFriendly", "premium", "signature"];

// Base rates per sq. ft in INR (realistic interior design pricing)
const PLAN_BASE_RATE = {
  starter: 250,      // Basic designs, budget-conscious
  budgetFriendly: 500,   // Standard quality designs
  premium: 1000,     // Premium designs with more features
  signature: 1500,   // Luxury/signature tier designs
};

const ROOM_MULTIPLIER = {
  "Living Room": 1.15,
  Bedroom: 1,
  Kitchen: 1.35,
  Bathroom: 1.25,
  "Home Office": 1.1,
  "Dining Room": 1.05,
  General: 1,
};

// Layout costs in INR
const LAYOUT_COSTS = {
  "L Shape": 15000,
  "U Shape": 20000,
  "Straight": 12000,
  "Island": 25000,
  "Sliding Wardrobe": 18000,
  "Hinged Wardrobe": 15000,
};

// Add-on costs in INR
const ADDON_COSTS = {
  "Chimney": 25000,
  "Tall Unit": 22000,
  "Bed Storage": 20000,
  "Dressing Unit": 25000,
  "Study Unit": 18000,
  "Loft": 30000,
  "TV Unit": 28000,
  "Sofa Setup": 35000,
  "False Ceiling": 40000,
};

// Extra/Global add-on costs (applied to overall project)
const EXTRA_ADDONS_COSTS = {
  "lighting": 15000,           // Lighting Package
  "wallpaper": 12000,          // Wallpaper / Panels
  "pooja": 18000,              // Pooja Unit
  "ceiling": 25000,            // False Ceiling (additional)
  "flooring": 35000,           // Luxury Flooring
  "curtains": 10000,           // Curtains & Blinds
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getRoomType = (roomName = "") => {
  const lower = String(roomName).toLowerCase();

  if (lower.includes("kitchen")) return "Kitchen";
  if (lower.includes("bedroom")) return "Bedroom";
  if (lower.includes("living") || lower.includes("hall")) return "Living Room";
  if (lower.includes("bathroom")) return "Bathroom";
  if (lower.includes("dining")) return "Dining Room";
  if (lower.includes("office")) return "Home Office";

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
  return type === "Kitchen" || type === "Bedroom" || type === "Living Room";
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

const normalizeSelectedDesign = (selectedDesignIdea, room, budgetPlan) => {
  const rawDesign =
    selectedDesignIdea && typeof selectedDesignIdea === "object" ? selectedDesignIdea : {};

  return {
    layout: typeof rawDesign.layout === "string" ? rawDesign.layout.trim() : "",
    addons: Array.isArray(rawDesign.addons) ? rawDesign.addons : [],
    room: room.roomName,
    roomType: room.roomType,
    planTier: budgetPlan || "",
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

  if (requireBudgetPlan && !VALID_PLANS.includes(budgetPlan)) {
    errors.push(`budgetPlan must be one of: ${VALID_PLANS.join(", ")}.`);
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

const getDesignCost = (selectedDesignIdea = {}, room) => {
  let cost = 0;

  // Add layout cost
  if (room.supportsLayout && selectedDesignIdea.layout) {
    cost += LAYOUT_COSTS[selectedDesignIdea.layout] || 15000;
  }

  // Add individual add-on costs
  if (room.needsAddons && Array.isArray(selectedDesignIdea.addons)) {
    selectedDesignIdea.addons.forEach((addon) => {
      cost += ADDON_COSTS[addon] || 15000;
    });
  }

  return cost;
};

const calculateQuote = (roomInstances, normalizedDimensions, budgetPlan, extraAddons = []) => {
  const baseRate = PLAN_BASE_RATE[budgetPlan] || 0;

  const lineItems = roomInstances
    .map((room) => {
      const dimensions = normalizedDimensions[room.id] || {};
      const areaSqFt = Number(((dimensions.length || 0) * (dimensions.width || 0)).toFixed(2));

      if (areaSqFt <= 0) return null;

      const selectedDesignIdea = dimensions.selectedDesignIdea || {};
      const roomMultiplier = ROOM_MULTIPLIER[room.roomType] || 1;
      const ratePerSqFt = Number((baseRate * roomMultiplier).toFixed(2));
      
      // Calculate base cost
      const baseCost = Number((areaSqFt * ratePerSqFt).toFixed(2));
      
      // Calculate layout cost
      let layoutCost = 0;
      if (room.supportsLayout && selectedDesignIdea.layout) {
        layoutCost = LAYOUT_COSTS[selectedDesignIdea.layout] || 15000;
      }
      
      // Calculate addons cost
      let addonsCost = 0;
      if (room.needsAddons && Array.isArray(selectedDesignIdea.addons)) {
        selectedDesignIdea.addons.forEach((addon) => {
          addonsCost += ADDON_COSTS[addon] || 15000;
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

  // Calculate extra add-ons cost
  let extraAddonsCost = 0;
  if (Array.isArray(extraAddons) && extraAddons.length > 0) {
    extraAddons.forEach((addonId) => {
      extraAddonsCost += EXTRA_ADDONS_COSTS[addonId] || 0;
    });
  }

  // Add extra add-ons as a line item if any were selected
  if (extraAddonsCost > 0 && extraAddons.length > 0) {
    lineItems.push({
      roomId: "extra-addons",
      roomName: "Extra Add-ons",
      label: "Premium Add-ons",
      areaSqFt: 0,
      ratePerSqFt: 0,
      roomMultiplier: 1,
      layout: "",
      addons: extraAddons,
      baseCost: 0,
      layoutCost: 0,
      addonsCost: extraAddonsCost,
      estimatedCost: extraAddonsCost,
    });
  }

  const totalAreaSqFt = Number(lineItems.filter(item => item.areaSqFt > 0).reduce((sum, item) => sum + item.areaSqFt, 0).toFixed(2));
  const estimatedAmount = Number((lineItems.reduce((sum, item) => sum + item.estimatedCost, 0) + extraAddonsCost).toFixed(2));

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

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.budgetPlan,
      validation.extraAddons
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

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.budgetPlan,
      validation.extraAddons
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

// ── Generate & download quotation as PDF ──────────────────────────────────────
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const estimator = await Estimator.findById(req.params.id);

    if (!estimator) {
      return res.status(404).json({ success: false, message: "Estimator not found" });
    }

    // Convert Mongoose document to plain object
    const plainEstimator = estimator.toObject ? estimator.toObject() : estimator;

    // Generate PDF and send response
    await generateQuotationPDF(plainEstimator, res, (err) => {
      if (err) {
        console.error("❌ PDF generation callback error:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Error generating PDF: " + err.message });
        }
      }
    });
  } catch (error) {
    console.error("❌ PDF generation caught error:", error.message, error.stack);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Error generating PDF: " + error.message });
    }
    console.error("PDF route error:", error);
  }
});

module.exports = router;
