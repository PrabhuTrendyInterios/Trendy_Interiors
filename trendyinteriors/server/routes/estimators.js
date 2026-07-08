const express = require("express");
const Estimator = require("../models/Estimator");
const Room = require("../models/Room");
const GlobalAddon = require("../models/GlobalAddon");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateQuotationPDF, generateQuotationPDFBuffer } = require("../utils/quotationPDF");
const { sendEmailWithAttachment } = require("../utils/mail");
const { generateQuotationDeliveryHTML } = require("../utils/emailTemplates");
const { calculateEstimate, findRoomCatalogEntry } = require("../utils/calculateEstimate");
const { findLayoutByName, resolveLayoutMaterials } = require("../utils/layoutMaterials");

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
    const sizeCategory = typeof dimensions.sizeCategory === "string" ? dimensions.sizeCategory.trim() : "";

    normalizedDimensions[room.id] = {
      length: length || 0,
      width: width || 0,
      height: height || 0,
      sizeCategory,
      selectedDesignIdea,
    };

    const roomDoc = findRoomCatalogEntry(roomsCatalog, room.roomName);
    const roomRequiresDimensions = roomDoc?.requiresDimensions !== false;

    if (requireCompleteRooms && roomRequiresDimensions && (!length || !width || !height)) {
      errors.push(`Missing or invalid dimensions for room: ${room.label}.`);
    }

    if (selectedDesignIdea.layout) {
      const roomDoc = findRoomCatalogEntry(roomsCatalog, room.roomName);
      const layout = findLayoutByName(roomDoc, selectedDesignIdea.layout);

      if (!layout) {
        if (requireCompleteRooms) {
          errors.push(
            `${room.label}: Layout "${selectedDesignIdea.layout}" is not available for this room.`
          );
        }
      } else if (layout.hasLayoutMaterials) {
        const resolved = resolveLayoutMaterials(
          roomDoc,
          selectedDesignIdea.layout,
          sizeCategory
        );

        if (resolved.validationError && requireCompleteRooms) {
          errors.push(`${room.label}: ${resolved.validationError}`);
        }
      }
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
      console.log('Validation Errors:', validation.errors);
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    console.log('Room Instances:', validation.roomInstances);
    console.log('Normalized Dimensions:', validation.normalizedDimensions);

    const selectedPackageComponents = req.body?.selectedPackageComponents || {};
    const selectedLayoutMaterials = req.body?.selectedLayoutMaterials || {};

    const quoteSummary = calculateEstimate({
      roomInstances: validation.roomInstances,
      normalizedDimensions: validation.normalizedDimensions,
      extraAddons: validation.extraAddons,
      roomsCatalog,
      globalAddons,
      selectedPackageComponents,
      selectedLayoutMaterials,
    });

    // Debug: Log API response structure
    console.log('\n[POST /calculate] API Response Structure:');
    console.log(`  Total Area: ${quoteSummary.totalAreaSqFt} sqft`);
    console.log(`  Line Items: ${quoteSummary.lineItems.length}`);
    quoteSummary.lineItems.forEach((item, idx) => {
      if (item.roomId !== 'global-addons') {
        console.log(`    [${idx}] ${item.roomName}:`);
        console.log(`      - Package Components Count: ${item.packageComponents?.length || 0}`);
        if (item.packageComponents?.length > 0) {
          const compNames = item.packageComponents.map(c => `${c.name}(${c.mandatory ? 'M' : 'O'})`).join(', ');
          console.log(`      - Components: ${compNames}`);
        }
        console.log(`      - Package Components Total: ₹${item.packageComponentsTotal}`);
        console.log(`      - Estimated Cost: ₹${item.estimatedCost}`);
      }
    });
    console.log(`  Estimated Amount: ₹${quoteSummary.estimatedAmount}\n`);

    return res.status(200).json({
      success: true,
      message: "Estimate preview calculated successfully",
      data: { quoteSummary },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/pdf/download", async (req, res) => {
  try {
    const { roomsCatalog, globalAddons } = await loadEstimatorData();
    const validation = validateEstimatorPayload(req.body, roomsCatalog, { requireCompleteRooms: false });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const selectedPackageComponents = req.body?.selectedPackageComponents || {};
    const selectedLayoutMaterials = req.body?.selectedLayoutMaterials || {};

    const quoteSummary = calculateEstimate({
      roomInstances: validation.roomInstances,
      normalizedDimensions: validation.normalizedDimensions,
      extraAddons: validation.extraAddons,
      roomsCatalog,
      globalAddons,
      selectedPackageComponents,
      selectedLayoutMaterials,
    });

    // Debug: Verify packageComponents for PDF
    console.log('[POST /pdf/download] Generating PDF with quoteSummary:');
    console.log(`  Total Amount: ₹${quoteSummary.estimatedAmount}`);
    console.log(`  Rooms: ${quoteSummary.lineItems.filter(item => item.roomId !== 'global-addons').length}`);
    quoteSummary.lineItems.forEach((item) => {
      if (item.roomId !== 'global-addons' && item.packageComponents?.length > 0) {
        console.log(`    - ${item.roomName}: ${item.packageComponents.length} package components included`);
        item.packageComponents.forEach((comp) => {
          console.log(`      • ${comp.name}: ₹${comp.price} ${comp.mandatory ? '(mandatory)' : '(optional)'}`);
        });
      }
    });

    const estimatorPayload = {
      _id: req.body._id || "draft",
      rooms: validation.rooms,
      selectedRoomForDimensions: validation.selectedRoomForDimensions,
      roomDimensionsByRoom: validation.normalizedDimensions,
      customerInfo: validation.customerInfo,
      extraAddons: validation.extraAddons,
      quoteSummary,
      budgetPlan: req.body.budgetPlan || "premium",
    };

    await generateQuotationPDF(estimatorPayload, res, (err) => {
      if (err) {
        console.error("❌ PDF generation callback error:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Error generating PDF: " + err.message });
        }
      }
    });
  } catch (error) {
    console.error("❌ PDF preview download error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Error generating PDF: " + error.message });
    }
  }
});

router.post("/", async (req, res) => {
  try {
    const { roomsCatalog, globalAddons } = await loadEstimatorData();
    const validation = validateEstimatorPayload(req.body, roomsCatalog, { requireCompleteRooms: true });

    if (validation.errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const selectedPackageComponents = req.body?.selectedPackageComponents || {};
    const selectedLayoutMaterials = req.body?.selectedLayoutMaterials || {};

    const quoteSummary = calculateEstimate({
      roomInstances: validation.roomInstances,
      normalizedDimensions: validation.normalizedDimensions,
      extraAddons: validation.extraAddons,
      roomsCatalog,
      globalAddons,
      selectedPackageComponents,
      selectedLayoutMaterials,
    });

    // Debug: Verify packageComponents in response
    console.log('[POST /estimators] Creating estimator with quoteSummary:');
    console.log(`  Total Amount: ₹${quoteSummary.estimatedAmount}`);
    console.log(`  Line Items with packageComponents:`);
    quoteSummary.lineItems.forEach((item) => {
      if (item.roomId !== 'global-addons') {
        console.log(`    - ${item.roomName}: ${item.packageComponents?.length || 0} components (Total: ₹${item.packageComponentsTotal})`);
      }
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

    // ✅ Generate PDF and send email automatically
    const plainEstimator = estimator.toObject ? estimator.toObject() : estimator;
    
    // Generate PDF buffer for email attachment
    generateQuotationPDFBuffer(plainEstimator, async (err, pdfBuffer) => {
      if (err) {
        console.error('[ESTIMATORS] ❌ PDF generation failed:', err.message);
        // PDF generation failed but estimate is saved - don't fail the request
      } else if (pdfBuffer) {
        // Send quotation email with PDF attachment
        const customerEmail = validation.customerInfo?.email;
        if (!customerEmail) {
          console.warn('[ESTIMATORS] ⚠️ Customer email not provided, skipping quotation email');
        } else {
          try {
            const estimatorRef = plainEstimator._id.toString().substring(0, 8).toUpperCase();
            const selectedRooms = Object.keys(validation.rooms || {})
              .filter(room => (validation.rooms[room] || 0) > 0);
            const totalArea = quoteSummary.totalAreaSqFt || 0;
            
            await sendEmailWithAttachment({
              to: customerEmail,
              subject: 'Your Interior Design Quotation - TrendyInterios',
              html: generateQuotationDeliveryHTML({
                customerName: validation.customerInfo?.name || 'Valued Customer',
                customerEmail: customerEmail,
                totalArea: totalArea,
                estimatedAmount: quoteSummary.estimatedAmount,
                referenceNumber: estimatorRef,
                projectRooms: selectedRooms,
              }),
              text: `Your quotation for ₹${quoteSummary.estimatedAmount} (Reference: ${estimatorRef}) is attached.`,
              attachment: {
                content: pdfBuffer,
                filename: `Trendy_Interiors_Quotation_${estimator._id}.pdf`,
              },
            });
            console.log('[ESTIMATORS] ✅ Quotation email sent successfully to:', customerEmail);
          } catch (emailErr) {
            console.error('[ESTIMATORS] ❌ Failed to send quotation email:', emailErr.message);
            // Email failed but estimate is saved - don't fail the request
          }
        }
      }
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
