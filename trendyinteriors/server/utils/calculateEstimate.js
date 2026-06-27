const {
  formatLayoutMaterials,
  getLayoutMaterialsTotal,
  resolveLayoutMaterials,
} = require('./layoutMaterials');

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const calcArea = (length, width) =>
  roundMoney((Number(length) || 0) * (Number(width) || 0));

const findRoomCatalogEntry = (roomsCatalog = [], roomName = '') =>
  roomsCatalog.find((room) => room.name === roomName) || null;

const getLayoutPrice = (roomDoc, layoutName = '') => {
  if (!layoutName || !roomDoc?.layouts?.length) return 0;

  const normalized = String(layoutName).trim().toLowerCase();

  const layout = roomDoc.layouts.find((item) => {
    if (!item) return false;
    // id match
    if (String(item._id) === String(layoutName)) return true;

    const itemName = item.name ? String(item.name).trim().toLowerCase() : '';
    const itemLabel = item.label ? String(item.label).trim().toLowerCase() : '';

    return itemName === normalized || itemLabel === normalized;
  });

  if (!layout) return 0;

  return Number(layout.fixedPrice ?? layout.price) || 0;
};

const getRoomAddonsTotal = (roomDoc, addonNames = []) => {
  if (!Array.isArray(addonNames) || !roomDoc?.addons?.length) return 0;

  return addonNames.reduce((sum, addonName) => {
    const addon = roomDoc.addons.find((item) => item.name === addonName);
    return sum + (addon ? Number(addon.price) || 0 : 0);
  }, 0);
};

const getPackageComponentsTotal = (packageComponents = [], selectedComponentIds = []) => {
  if (!Array.isArray(packageComponents) || packageComponents.length === 0) return 0;

  // Sum components that are either:
  // 1. Mandatory (always included), OR
  // 2. In the selectedComponentIds array (explicitly selected by user)
  return packageComponents.reduce((sum, component) => {
    const componentId = component._id?.toString() || component.id || '';
    const isMandatory = Boolean(component.mandatory);
    const isSelected = selectedComponentIds.includes(componentId);
    
    // Include if mandatory OR explicitly selected
    if (isMandatory || isSelected) {
      return sum + (Number(component.price) || 0);
    }
    return sum;
  }, 0);
};

const getPackageComponentsForDimension = (roomDoc, sizeCategory = '') => {
  if (!roomDoc?.dimensions || !Array.isArray(roomDoc.dimensions)) {
    console.warn('[getPackageComponentsForDimension] Room has no dimensions array');
    return [];
  }
  
  // Enhanced matching: _id, id, name (case-insensitive)
  const matchedDimension = roomDoc.dimensions.find((dim) => {
    const dimIdString = dim._id?.toString();
    const dimIdField = dim.id;
    const dimNameNormalized = dim.name?.toLowerCase().trim();
    const sizeCategoryNormalized = sizeCategory?.toLowerCase().trim();
    
    const isMatch = 
      dimIdString === sizeCategory || 
      dimIdField === sizeCategory || 
      dim.name === sizeCategory || 
      dimNameNormalized === sizeCategoryNormalized;
    
    return isMatch;
  });

  if (!matchedDimension) {
    console.warn(`[getPackageComponentsForDimension] No dimension matched for sizeCategory: "${sizeCategory}" in room: "${roomDoc.name}"`);
    return [];
  }
  
  const packageComponents = matchedDimension?.packageComponents || [];
  console.log(`[getPackageComponentsForDimension] Found ${packageComponents.length} components for room "${roomDoc.name}" size "${sizeCategory}"`);
  
  return packageComponents;
};

const formatPackageComponents = (packageComponents = []) => {
  return packageComponents.map((component) => ({
    id: component._id?.toString() || component.id || '',
    name: component.name || '',
    description: component.description || '',
    price: Number(component.price) || 0,
    mandatory: Boolean(component.mandatory),
  }));
};

const resolveGlobalAddon = (globalAddons = [], addonId) =>
  globalAddons.find(
    (addon) =>
      addon._id?.toString() === String(addonId) ||
      addon.name === addonId
  );

const normalizeExtraAddonIds = (extraAddons = []) => {
  const seen = new Set();

  return (Array.isArray(extraAddons) ? extraAddons : [])
    .map((addonId) => (addonId != null ? String(addonId).trim() : ''))
    .filter((addonId) => {
      if (!addonId || seen.has(addonId)) {
        return false;
      }

      seen.add(addonId);
      return true;
    });
};

/**
 * Pricing rules:
 * - Area = Length × Width (height is informational only)
 * - Room Base Cost = Area × Room pricePerSqFt
 * - Package Components Total = Sum of selected component prices
 * - Room Total = Base Cost + Package Components Total + Layout Price + Room Addons Total
 * - Grand Total = Sum of all Room Totals + Global Addons Total
 */
const calculateEstimate = ({
  roomInstances = [],
  normalizedDimensions = {},
  extraAddons = [],
  roomsCatalog = [],
  globalAddons = [],
  selectedPackageComponents = {}, // Maps roomId -> [componentIds]
  selectedLayoutMaterials = {}, // Maps roomId -> { materialId: boolean }
}) => {
  const lineItems = [];
  let totalAreaSqFt = 0;
  let roomTotals = 0;

  roomInstances.forEach((room) => {
    const dimensions = normalizedDimensions[room.id] || {};
    const length = Number(dimensions.length) || 0;
    const width = Number(dimensions.width) || 0;
    const height = Number(dimensions.height) || 0;
    const areaSqFt = calcArea(length, width);
    const selectedDesignIdea = dimensions.selectedDesignIdea || {};
    const sizeCategory = dimensions.sizeCategory || '';
    const roomDoc = findRoomCatalogEntry(roomsCatalog, room.roomName);
    const ratePerSqFt = Number(roomDoc?.pricePerSqFt) || 0;
    const baseCost = roundMoney(areaSqFt * ratePerSqFt);
    const layoutCost = roundMoney(getLayoutPrice(roomDoc, selectedDesignIdea.layout));
    const addonsCost = roundMoney(getRoomAddonsTotal(roomDoc, selectedDesignIdea.addons));

      // Warn when a selected layout exists but didn't resolve to a price
      if (selectedDesignIdea.layout && layoutCost === 0) {
        console.warn(
          `[calculateEstimate] Selected layout "${selectedDesignIdea.layout}" not found or priced as 0 for room "${roomDoc?.name || room.roomName}"`
        );
        try {
          const available = (roomDoc?.layouts || []).map((l) => l.label || l.name || String(l._id));
          console.warn(`[calculateEstimate] Available layouts for ${roomDoc?.name || room.roomName}: ${available.join(', ')}`);
        } catch (err) {
          // ignore
        }
      }
    
    // Get package components for this dimension
    const packageComponentsArray = getPackageComponentsForDimension(roomDoc, sizeCategory);
    const selectedIds = (selectedPackageComponents[room.id] || []);
    const packageComponentsTotal = roundMoney(getPackageComponentsTotal(packageComponentsArray, selectedIds));

    const roomRequiresDimensions = roomDoc?.requiresDimensions !== false;
    const hasSelectedLayout = Boolean(selectedDesignIdea.layout);
    const hasSelectedAddons = Array.isArray(selectedDesignIdea.addons) && selectedDesignIdea.addons.length > 0;
    const hasSelectedPackageComponents = Array.isArray(selectedIds) && selectedIds.length > 0;

    if (
      areaSqFt <= 0 &&
      (roomRequiresDimensions || (!hasSelectedLayout && !hasSelectedAddons && !hasSelectedPackageComponents))
    ) {
      return;
    }
    
    // Debug: Log calculation flow
    console.log(`[calculateEstimate] Room: ${room.roomName}, SizeCategory: ${sizeCategory}`);
    console.log(`  Package Components Retrieved: ${packageComponentsArray.length}`);
    console.log(`  Selected Component IDs: ${selectedIds.length}`, selectedIds);
    console.log(`  Package Components Total: ₹${packageComponentsTotal}`);
    
    const layoutMaterialsResult = resolveLayoutMaterials(
      roomDoc,
      selectedDesignIdea.layout,
      sizeCategory
    );
    const layoutMaterialsArray = layoutMaterialsResult.materials;

    if (layoutMaterialsResult.skipped && layoutMaterialsResult.validationError) {
      console.warn(
        `[calculateEstimate] Layout materials skipped for ${room.label}: ${layoutMaterialsResult.validationError}`
      );
    }

    const layoutMaterialsCost = roundMoney(
      getLayoutMaterialsTotal(layoutMaterialsArray, selectedLayoutMaterials[room.id] || {})
    );

    // New calculation: baseCost + packageComponentsTotal + layoutCost + addonsCost
    const estimatedCost = roundMoney(
      baseCost + packageComponentsTotal + layoutCost + addonsCost + layoutMaterialsCost
    );

    totalAreaSqFt = roundMoney(totalAreaSqFt + areaSqFt);
    roomTotals = roundMoney(roomTotals + estimatedCost);

    lineItems.push({
      roomId: room.id,
      roomName: room.roomName,
      label: room.label,
      length,
      width,
      height,
      areaSqFt,
      ratePerSqFt,
      baseCost,
      layout: selectedDesignIdea.layout || '',
      layoutCost,
      addons: selectedDesignIdea.addons || [],
      addonsCost,
      packageComponents: formatPackageComponents(packageComponentsArray),
      packageComponentsTotal,
      layoutMaterials: formatLayoutMaterials(layoutMaterialsArray),
      layoutMaterialsCost,
      estimatedCost,
    });
  });

  const addonDetails = [];
  let globalAddonsTotal = 0;
  const normalizedExtraAddons = normalizeExtraAddonIds(extraAddons);

  if (normalizedExtraAddons.length > 0) {
    normalizedExtraAddons.forEach((addonId) => {
      const addon = resolveGlobalAddon(globalAddons, addonId);
      if (addon && addon.active !== false) {
        const price = Number(addon.price) || 0;
        globalAddonsTotal = roundMoney(globalAddonsTotal + price);
        addonDetails.push({
          id: addon._id?.toString() || String(addonId),
          name: addon.name,
          price,
        });
      }
    });
  }

  if (globalAddonsTotal > 0) {
    lineItems.push({
      roomId: 'global-addons',
      roomName: 'Global Add-ons',
      label: 'Premium Add-ons',
      areaSqFt: 0,
      ratePerSqFt: 0,
      baseCost: 0,
      layout: '',
      layoutCost: 0,
      addons: addonDetails.map((addon) => addon.name),
      addonDetails,
      addonsCost: globalAddonsTotal,
      estimatedCost: globalAddonsTotal,
    });
  }

  return {
    totalAreaSqFt,
    roomTotals,
    globalAddonsTotal,
    estimatedAmount: roundMoney(roomTotals + globalAddonsTotal),
    currency: 'INR',
    lineItems,
  };
};

module.exports = {
  calculateEstimate,
  calcArea,
  findRoomCatalogEntry,
  getLayoutPrice,
  getRoomAddonsTotal,
  getPackageComponentsTotal,
  getPackageComponentsForDimension,
  formatPackageComponents,
};
