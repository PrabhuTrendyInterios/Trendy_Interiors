import { API_BASE_URL, publicGet } from './publicApi';

export { API_BASE_URL };

export const fetchEstimatorRooms = () => publicGet('/api/cms/rooms?status=active');

export const fetchGlobalAddons = () => publicGet('/api/cms/global-addons?active=true');

export const DIMENSIONLESS_LAYOUT_CONFIG_ID = '__dimensionless__';

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
    size: material.size || '',
    price: Number(material.price) || 0,
    mandatory: material.mandatory ?? false,
  })),
});

const normalizePackageComponent = (component = {}) => ({
  ...(component._id ? { _id: component._id } : {}),
  id: component._id ? String(component._id) : component.id || '',
  name: component.name || '',
  description: component.description || '',
  price: Number(component.price) || 0,
  mandatory: component.mandatory ?? false,
  displayOrder: Number(component.displayOrder) || 0,
});

export const normalizeEstimatorRoom = (room) => ({
  _id: room._id,
  id: slugifyRoomName(room.name),
  name: room.name,
  description: room.description || '',
  image: room.imageUrl || DEFAULT_ROOM_IMAGE,
  pricePerSqFt: Number(room.pricePerSqFt) || 0,
  allowCustomDimensions: room.allowCustomDimensions ?? false,
  requiresDimensions: room.requiresDimensions ?? true,
  maxSelectableRooms: Math.max(1, Number(room.maxSelectableRooms) || (
    String(room.name || '').toLowerCase().includes('bedroom') ? 6 : 2
  )),
  dimensions: (room.dimensions || []).map((dim) => ({
    _id: dim._id,
    id: dim._id || dim.name,
    name: dim.name,
    label: dim.name,
    length: Number(dim.length) || 0,
    width: Number(dim.width) || 0,
    height: Number(dim.height) || 0,
    packageComponents: (dim.packageComponents || [])
      .map(normalizePackageComponent)
      .sort((a, b) => a.displayOrder - b.displayOrder),
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
  const dimensionName = dimension?.name ? String(dimension.name).trim().toLowerCase() : '';
  const isDimensionlessRoom = room.requiresDimensions === false || (room.dimensions || []).length === 0;

  const configuration = (layout.configurations || []).find((config) => {
    if (!config.dimensionId) return false;

    if (isDimensionlessRoom) {
      const normalizedConfigDimension = String(config.dimensionId).trim().toLowerCase();
      return (
        normalizedConfigDimension === DIMENSIONLESS_LAYOUT_CONFIG_ID ||
        normalizedConfigDimension === 'default'
      );
    }

    return (
      String(config.dimensionId) === String(dimensionId) ||
      String(config.dimensionId) === String(sizeCategory) ||
      (dimensionName && String(config.dimensionId).trim().toLowerCase() === dimensionName)
    );
  }) || (isDimensionlessRoom ? (layout.configurations || [])[0] : null);

  const materials = (configuration?.materials || []).map((material, index) => ({
    id: material._id?.toString() || `${layoutName}-${dimensionId || DIMENSIONLESS_LAYOUT_CONFIG_ID}-${index}`,
    name: material.name || '',
    size: material.size || '',
    price: Number(material.price) || 0,
    mandatory: Boolean(material.mandatory),
  }));

  return {
    layoutName: layout.name,
    hasLayoutMaterials: true,
    materials,
  };
};

/** roomId -> { materialId: boolean } — available materials are selected by default */
export const buildDefaultLayoutMaterialSelection = (materials = []) =>
  materials.reduce((selection, material) => {
    if (material.id) {
      selection[material.id] = true;
    }
    return selection;
  }, {});

export const normalizeLayoutMaterialSelection = (selectionByRoom = {}) =>
  Object.entries(selectionByRoom).reduce((normalizedRooms, [roomId, roomSelection]) => {
    if (!roomSelection || typeof roomSelection !== 'object' || Array.isArray(roomSelection)) {
      return normalizedRooms;
    }

    const normalizedSelection = Object.entries(roomSelection).reduce(
      (selection, [materialId, selected]) => {
        if (selected === true || selected === false) {
          selection[materialId] = selected;
        }
        return selection;
      },
      {},
    );

    if (Object.keys(normalizedSelection).length > 0) {
      normalizedRooms[roomId] = normalizedSelection;
    }

    return normalizedRooms;
  }, {});

export const isLayoutMaterialSelected = (roomSelection = {}, materialId, mandatory = false) => {
  if (mandatory) {
    return true;
  }

  return Boolean(roomSelection[materialId]);
};

export const toggleLayoutMaterialSelection = (roomSelection = {}, materialId) => {
  const nextSelection = { ...roomSelection };
  nextSelection[materialId] = !Boolean(nextSelection[materialId]);

  return nextSelection;
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
    const isSelected = Boolean(roomSelection[material.id]);

    if (isMandatory || isSelected) {
      return sum + (Number(material.price) || 0);
    }

    return sum;
  }, 0);

export const normalizeGlobalAddonId = (id) => {
  if (id == null || id === '') {
    return '';
  }

  if (typeof id === 'object') {
    if (id.$oid) {
      return String(id.$oid);
    }

    if (typeof id.toString === 'function' && id.toString() !== '[object Object]') {
      return String(id);
    }

    return '';
  }

  return String(id);
};

export const normalizeSelectedGlobalAddons = (selectedIds = []) => {
  const seen = new Set();

  return (Array.isArray(selectedIds) ? selectedIds : [])
    .map((entry) => normalizeGlobalAddonId(entry?.id || entry?._id || entry))
    .filter((id) => {
      if (!id || seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
};

export const normalizeSelectedGlobalAddonEntries = (selectedAddons = []) => {
  const seen = new Set();

  return (Array.isArray(selectedAddons) ? selectedAddons : [])
    .map((entry) => {
      const id = normalizeGlobalAddonId(entry?.id || entry?._id || entry);
      const count = Math.max(0, Number(entry?.count ?? 1) || 0);
      const size = typeof entry?.size === 'string' ? entry.size.trim() : '';

      return { id, count, size };
    })
    .filter((entry) => {
      if (!entry.id || seen.has(entry.id) || entry.count <= 0) {
        return false;
      }

      seen.add(entry.id);
      return true;
    });
};

export const isGlobalAddonSelected = (selectedIds = [], addonId) => {
  const normalizedTarget = normalizeGlobalAddonId(addonId);
  if (!normalizedTarget) {
    return false;
  }

  return normalizeSelectedGlobalAddonEntries(selectedIds).some((entry) => entry.id === normalizedTarget);
};

export const toggleGlobalAddonSelection = (selectedIds = [], addonId) => {
  const normalizedTarget = normalizeGlobalAddonId(addonId);
  if (!normalizedTarget) {
    return normalizeSelectedGlobalAddonEntries(selectedIds);
  }

  const normalizedSelected = normalizeSelectedGlobalAddonEntries(selectedIds);

  if (normalizedSelected.some((entry) => entry.id === normalizedTarget)) {
    return normalizedSelected.filter((entry) => entry.id !== normalizedTarget);
  }

  return [...normalizedSelected, { id: normalizedTarget, count: 1, size: '' }];
};

export const updateGlobalAddonQuantity = (selectedIds = [], addonId, delta = 0) => {
  const normalizedTarget = normalizeGlobalAddonId(addonId);
  if (!normalizedTarget) {
    return normalizeSelectedGlobalAddonEntries(selectedIds);
  }

  const normalizedSelected = normalizeSelectedGlobalAddonEntries(selectedIds);
  const existing = normalizedSelected.find((entry) => entry.id === normalizedTarget);

  if (!existing && delta > 0) {
    return [...normalizedSelected, { id: normalizedTarget, count: delta, size: '' }];
  }

  return normalizedSelected
    .map((entry) =>
      entry.id === normalizedTarget
        ? { ...entry, count: Math.max(0, (Number(entry.count) || 0) + delta) }
        : entry,
    )
    .filter((entry) => entry.count > 0);
};

export const getSelectedGlobalAddonEntry = (selectedIds = [], addonId) => {
  const normalizedTarget = normalizeGlobalAddonId(addonId);
  return normalizeSelectedGlobalAddonEntries(selectedIds).find((entry) => entry.id === normalizedTarget) || null;
};

export const formatGlobalAddonForCard = (addon) => {
  const id = normalizeGlobalAddonId(addon._id || addon.id);

  return {
    id,
    _id: id,
    name: addon.name || '',
    description: addon.description || '',
    image: addon.imageUrl || '',
    size: addon.size || '',
    price: Number(addon.price) || 0,
    priceHint: addon.price
      ? `From ₹${Number(addon.price).toLocaleString('en-IN')}`
      : 'Premium selection',
  };
};

export const buildGlobalAddonDetails = (selectedIds = [], addonsCatalog = []) => {
  const catalog = (Array.isArray(addonsCatalog) ? addonsCatalog : []).map(formatGlobalAddonForCard);
  const selectedEntries = normalizeSelectedGlobalAddonEntries(selectedIds);

  return selectedEntries
    .map((selectedEntry) => {
      const addon = catalog.find((catalogAddon) => catalogAddon.id === selectedEntry.id);
      if (!addon) {
        return null;
      }

      const count = Math.max(1, Number(selectedEntry.count) || 1);
      const price = Number(addon.price) || 0;

      return {
        id: addon.id,
        name: addon.name,
        size: selectedEntry.size || addon.size || '',
        count,
        price,
        totalPrice: price * count,
      };
    })
    .filter(Boolean);
};

export const getGlobalAddonsTotal = (selectedIds = [], addonsCatalog = []) =>
  buildGlobalAddonDetails(selectedIds, addonsCatalog).reduce(
    (sum, addon) => sum + (Number(addon.totalPrice ?? addon.price) || 0),
    0,
  );

export const buildRoomInstances = (rooms = {}) =>
  Object.entries(rooms).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    })),
  );
