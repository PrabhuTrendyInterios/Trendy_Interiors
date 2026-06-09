import { API_BASE_URL, publicGet } from './publicApi';

export { API_BASE_URL };

export const fetchEstimatorRooms = () => publicGet('/api/cms/rooms?status=active');

export const fetchGlobalAddons = () => publicGet('/api/cms/global-addons?active=true');

export const slugifyRoomName = (name = '') =>
  String(name)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80';

const normalizeLayoutConfiguration = (config = {}) => ({
  ...(config._id ? { _id: config._id } : {}),
  dimensionId: config.dimensionId,
  materials: (config.materials || []).map((material) => ({
    ...(material._id ? { _id: material._id } : {}),
    name: material.name || '',
    price: Number(material.price) || 0,
    mandatory: material.mandatory ?? false,
  })),
});

export const normalizeEstimatorRoom = (room) => ({
  _id: room._id,
  id: slugifyRoomName(room.name),
  name: room.name,
  description: room.description || '',
  image: room.imageUrl || DEFAULT_ROOM_IMAGE,
  pricePerSqFt: Number(room.pricePerSqFt) || 0,
  dimensions: (room.dimensions || []).map((dim) => ({
    _id: dim._id,
    id: dim._id || dim.name,
    name: dim.name,
    label: dim.name,
    length: Number(dim.length) || 0,
    width: Number(dim.width) || 0,
    height: Number(dim.height) || 0,
  })),
  layouts: (room.layouts || []).map((layout) => ({
    ...(layout._id ? { _id: layout._id } : {}),
    label: layout.name,
    name: layout.name,
    image: layout.imageUrl || '',
    price: Number(layout.fixedPrice) || 0,
    fixedPrice: Number(layout.fixedPrice) || 0,
    description: layout.description || '',
    hasLayoutMaterials: layout.hasLayoutMaterials ?? false,
    configurations: Array.isArray(layout.configurations)
      ? layout.configurations.map(normalizeLayoutConfiguration)
      : [],
  })),
  addons: (room.addons || []).map((addon) => ({
    label: addon.name,
    name: addon.name,
    image: addon.imageUrl || '',
    price: Number(addon.price) || 0,
    description: addon.description || '',
  })),
});

export const findRoomByName = (roomsCatalog = [], roomName = '') =>
  roomsCatalog.find((room) => room.name === roomName) || null;

export const matchDimensionFromSizeCategory = (dimensions = [], sizeCategory = '') => {
  if (!sizeCategory) return null;

  const normalizedCategory = String(sizeCategory).toLowerCase().trim();

  return (
    dimensions.find((dim) => {
      const dimId = dim._id?.toString() || dim.id?.toString();
      const dimName = dim.name?.toLowerCase().trim();

      return (
        dimId === String(sizeCategory) ||
        dim.id === sizeCategory ||
        dim.name === sizeCategory ||
        dimName === normalizedCategory
      );
    }) || null
  );
};

export const getLayoutMaterialsForRoom = ({
  room,
  layoutName = '',
  sizeCategory = '',
}) => {
  if (!room || !layoutName) {
    return { layoutName: layoutName || '', hasLayoutMaterials: false, materials: [] };
  }

  const layout = (room.layouts || []).find((entry) => entry.name === layoutName);
  if (!layout) {
    return { layoutName, hasLayoutMaterials: false, materials: [] };
  }

  if (!layout.hasLayoutMaterials) {
    return { layoutName: layout.name, hasLayoutMaterials: false, materials: [] };
  }

  const dimension = matchDimensionFromSizeCategory(room.dimensions, sizeCategory);
  const dimensionId = dimension?._id?.toString() || dimension?.id?.toString() || sizeCategory;

  const configuration = (layout.configurations || []).find((config) => {
    if (!config.dimensionId) return false;

    return (
      String(config.dimensionId) === String(dimensionId) ||
      String(config.dimensionId) === String(sizeCategory)
    );
  });

  const materials = (configuration?.materials || []).map((material, index) => ({
    id: material._id?.toString() || `${layoutName}-${dimensionId}-${index}`,
    name: material.name || '',
    price: Number(material.price) || 0,
    mandatory: Boolean(material.mandatory),
  }));

  return {
    layoutName: layout.name,
    hasLayoutMaterials: true,
    materials,
  };
};

/** roomId -> { materialId: boolean } — all true by default */
export const buildDefaultLayoutMaterialSelection = (materials = []) =>
  materials.reduce((selection, material) => {
    if (material.id) {
      selection[material.id] = true;
    }
    return selection;
  }, {});

export const isLayoutMaterialSelected = (roomSelection = {}, materialId, mandatory = false) => {
  if (mandatory) {
    return true;
  }

  if (roomSelection[materialId] === undefined) {
    return true;
  }

  return Boolean(roomSelection[materialId]);
};

export const toggleLayoutMaterialSelection = (roomSelection = {}, materialId) => {
  const currentValue = roomSelection[materialId] !== undefined ? roomSelection[materialId] : true;

  return {
    ...roomSelection,
    [materialId]: !currentValue,
  };
};

export const reloadLayoutMaterialSelection = ({
  roomsCatalog = [],
  roomName = '',
  layoutName = '',
  sizeCategory = '',
}) => {
  if (!layoutName) {
    return null;
  }

  const room = findRoomByName(roomsCatalog, roomName);
  const layoutData = getLayoutMaterialsForRoom({ room, layoutName, sizeCategory });

  if (layoutData.materials.length === 0) {
    return null;
  }

  return buildDefaultLayoutMaterialSelection(layoutData.materials);
};

export const getLayoutMaterialsTotal = (materials = [], roomSelection = {}) =>
  materials.reduce((sum, material) => {
    if (!material.id) {
      return sum;
    }

    const isMandatory = Boolean(material.mandatory);
    const isSelected =
      roomSelection[material.id] === undefined ? true : Boolean(roomSelection[material.id]);

    if (isMandatory || isSelected) {
      return sum + (Number(material.price) || 0);
    }

    return sum;
  }, 0);

export const formatGlobalAddonForCard = (addon) => ({
  id: addon._id,
  _id: addon._id,
  name: addon.name,
  description: addon.description || '',
  image: addon.imageUrl || '',
  price: Number(addon.price) || 0,
  priceHint: addon.price
    ? `From ₹${Number(addon.price).toLocaleString('en-IN')}`
    : 'Premium selection',
});

export const buildRoomInstances = (rooms = {}) =>
  Object.entries(rooms).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    })),
  );
