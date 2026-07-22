const formatLayoutMaterial = (material = {}) => ({
  ...(material._id ? { _id: material._id } : {}),
  name: material.name || '',
  price: Number(material.price) || 0,
  mandatory: Boolean(material.mandatory),
});

const formatLayoutConfiguration = (config = {}) => ({
  ...(config._id ? { _id: config._id } : {}),
  dimensionId: config.dimensionId,
  materials: Array.isArray(config.materials)
    ? config.materials.map(formatLayoutMaterial)
    : [],
});

const formatLayoutResponse = (layout = {}) => ({
  ...(layout._id ? { _id: layout._id } : {}),
  name: layout.name || '',
  imageUrl: layout.imageUrl || '',
  description: layout.description || '',
  fixedPrice: Number(layout.fixedPrice) || 0,
  hasLayoutMaterials: Boolean(layout.hasLayoutMaterials),
  configurations: Array.isArray(layout.configurations)
    ? layout.configurations.map(formatLayoutConfiguration)
    : [],
});

const formatRoomResponse = (room) => {
  const doc = room?.toObject ? room.toObject() : { ...room };
  const legacyLimit = String(doc.name || '').toLowerCase().includes('bedroom') ? 6 : 2;
  const configuredLimit = Number(doc.maxSelectableRooms);

  return {
    ...doc,
    allowCustomDimensions: doc.allowCustomDimensions ?? false,
    requiresDimensions: doc.requiresDimensions ?? true,
    maxSelectableRooms: Number.isInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : legacyLimit,
    layouts: (doc.layouts || []).map(formatLayoutResponse),
  };
};

module.exports = {
  formatLayoutMaterial,
  formatLayoutConfiguration,
  formatLayoutResponse,
  formatRoomResponse,
};
