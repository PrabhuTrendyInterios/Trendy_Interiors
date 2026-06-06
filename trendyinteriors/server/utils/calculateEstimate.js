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
 * - Room Total = Base Cost + Layout Price + Room Addons Total
 * - Grand Total = Sum of all Room Totals + Global Addons Total
 */
const calculateEstimate = ({
  roomInstances = [],
  normalizedDimensions = {},
  extraAddons = [],
  roomsCatalog = [],
  globalAddons = [],
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
    const roomDoc = findRoomCatalogEntry(roomsCatalog, room.roomName);
    const ratePerSqFt = Number(roomDoc?.pricePerSqFt) || 0;
    const baseCost = roundMoney(areaSqFt * ratePerSqFt);
    const layoutCost = roundMoney(getLayoutPrice(roomDoc, selectedDesignIdea.layout));
    const addonsCost = roundMoney(getRoomAddonsTotal(roomDoc, selectedDesignIdea.addons));
    const estimatedCost = roundMoney(baseCost + layoutCost + addonsCost);

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
};
