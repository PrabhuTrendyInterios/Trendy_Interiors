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

  const layout = roomDoc.layouts.find((item) => item.name === layoutName);
  return layout ? Number(layout.fixedPrice) || 0 : 0;
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

  // If selectedComponentIds is empty, include all mandatory components and assume optional ones are selected
  if (selectedComponentIds.length === 0) {
    return packageComponents.reduce((sum, component) => {
      return sum + (Number(component.price) || 0);
    }, 0);
  }

  // Otherwise, only sum components that are in the selectedComponentIds array
  return packageComponents.reduce((sum, component) => {
    const componentId = component._id?.toString() || component.id;
    if (selectedComponentIds.includes(componentId)) {
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
  
  // Debug: Log room info
  console.log('================================ DEBUG: getPackageComponentsForDimension ================================');
  console.log('Room:', roomDoc.name || 'UNKNOWN');
  console.log('Size Category:', sizeCategory);
  console.log('Dimensions available:', roomDoc.dimensions.length);
  console.log('Dimensions:', JSON.stringify(
    roomDoc.dimensions.map(d => ({
      id: d._id?.toString(),
      name: d.name,
      componentCount: d.packageComponents?.length || 0
    })),
    null,
    2
  ));
  
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
    
    if (isMatch) {
      console.log(`✓ Matched dimension: name="${dim.name}", id="${dimIdString}", componentCount=${dim.packageComponents?.length || 0}`);
    }
    
    return isMatch;
  });

  // Debug: Log matched dimension
  if (!matchedDimension) {
    console.warn(`✗ No dimension matched for sizeCategory: "${sizeCategory}"`);
  } else {
    console.log(`Matched Dimension: ${matchedDimension.name}`);
    console.log(`Package Components Count: ${matchedDimension.packageComponents?.length || 0}`);
    if (matchedDimension.packageComponents?.length > 0) {
      console.log('Package Components:', JSON.stringify(
        matchedDimension.packageComponents.map(c => ({
          id: c._id?.toString(),
          name: c.name,
          price: c.price,
          mandatory: c.mandatory
        })),
        null,
        2
      ));
    }
  }
  console.log('================================ END DEBUG ================================');
  
  const packageComponents = matchedDimension?.packageComponents || [];
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

    if (areaSqFt <= 0) return;

    const selectedDesignIdea = dimensions.selectedDesignIdea || {};
    const sizeCategory = dimensions.sizeCategory || '';
    const roomDoc = findRoomCatalogEntry(roomsCatalog, room.roomName);
    const ratePerSqFt = Number(roomDoc?.pricePerSqFt) || 0;
    const baseCost = roundMoney(areaSqFt * ratePerSqFt);
    const layoutCost = roundMoney(getLayoutPrice(roomDoc, selectedDesignIdea.layout));
    const addonsCost = roundMoney(getRoomAddonsTotal(roomDoc, selectedDesignIdea.addons));
    
    // Get package components for this dimension
    const packageComponentsArray = getPackageComponentsForDimension(roomDoc, sizeCategory);
    const selectedIds = (selectedPackageComponents[room.id] || []);
    const packageComponentsTotal = roundMoney(getPackageComponentsTotal(packageComponentsArray, selectedIds));
    
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

  if (Array.isArray(extraAddons) && extraAddons.length > 0) {
    extraAddons.forEach((addonId) => {
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
