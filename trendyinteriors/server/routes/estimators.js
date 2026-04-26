const express = require("express");
const Estimator = require("../models/Estimator");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const VALID_PLANS = ["starter", "budgetFriendly", "premium", "signature"];

const PLAN_BASE_RATE = {
  starter: 700,
  budgetFriendly: 1200,
  premium: 2000,
  signature: 3500,
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
  const { requireCompleteRooms = false } = options;
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

  if (!VALID_PLANS.includes(budgetPlan)) {
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

  if (room.supportsLayout && selectedDesignIdea.layout) {
    cost += 2500;
  }

  if (room.needsAddons && Array.isArray(selectedDesignIdea.addons)) {
    cost += selectedDesignIdea.addons.length * 1500;
  }

  return cost;
};

const calculateQuote = (roomInstances, normalizedDimensions, budgetPlan) => {
  const baseRate = PLAN_BASE_RATE[budgetPlan] || 0;

  const lineItems = roomInstances
    .map((room) => {
      const dimensions = normalizedDimensions[room.id] || {};
      const areaSqFt = Number(((dimensions.length || 0) * (dimensions.width || 0)).toFixed(2));

      if (areaSqFt <= 0) return null;

      const selectedDesignIdea = dimensions.selectedDesignIdea || {};
      const roomMultiplier = ROOM_MULTIPLIER[room.roomType] || 1;
      const ratePerSqFt = Number((baseRate * roomMultiplier).toFixed(2));
      const designCost = getDesignCost(selectedDesignIdea, room);

      return {
        roomId: room.id,
        roomName: room.roomName,
        label: room.label,
        areaSqFt,
        ratePerSqFt,
        roomMultiplier,
        layout: selectedDesignIdea.layout || "",
        addons: selectedDesignIdea.addons || [],
        estimatedCost: Number((areaSqFt * ratePerSqFt + designCost).toFixed(2)),
      };
    })
    .filter(Boolean);

  return {
    totalAreaSqFt: Number(lineItems.reduce((sum, item) => sum + item.areaSqFt, 0).toFixed(2)),
    estimatedAmount: Number(lineItems.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(2)),
    currency: "INR",
    lineItems,
  };
};

router.post("/calculate", async (req, res) => {
  try {
    const validation = validateEstimatorPayload(req.body, { requireCompleteRooms: false });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const quoteSummary = calculateQuote(
      validation.roomInstances,
      validation.normalizedDimensions,
      validation.budgetPlan
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

module.exports = router;
