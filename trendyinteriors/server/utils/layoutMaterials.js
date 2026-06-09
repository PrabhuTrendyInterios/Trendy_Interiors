const matchDimensionFromSizeCategory = (dimensions = [], sizeCategory = '') => {
  if (!sizeCategory) return null;

  const normalizedCategory = String(sizeCategory).toLowerCase().trim();

  return (
    dimensions.find((dim) => {
      const dimId = dim?._id?.toString() || dim?.id?.toString();
      const dimName = dim?.name?.toLowerCase().trim();

      return (
        dimId === String(sizeCategory) ||
        dim?.id === sizeCategory ||
        dim?.name === sizeCategory ||
        dimName === normalizedCategory
      );
    }) || null
  );
};

const findLayoutByName = (roomDoc, layoutName = '') => {
  if (!roomDoc?.layouts?.length || !layoutName) {
    return null;
  }

  return roomDoc.layouts.find((entry) => entry?.name === layoutName) || null;
};

const findLayoutConfiguration = (layout, dimension, sizeCategory = '') => {
  const configurations = Array.isArray(layout?.configurations) ? layout.configurations : [];
  if (configurations.length === 0) {
    return null;
  }

  const dimensionId = dimension?._id?.toString() || dimension?.id?.toString() || '';

  return (
    configurations.find((config) => {
      if (!config?.dimensionId) {
        return false;
      }

      const configDimensionId = String(config.dimensionId);

      return (
        (dimensionId && configDimensionId === dimensionId) ||
        (sizeCategory && configDimensionId === String(sizeCategory))
      );
    }) || null
  );
};

/**
 * Resolves layout materials for a room/layout/dimension context.
 * On validation failure sets skipped=true and returns empty materials (no throw).
 */
const resolveLayoutMaterials = (roomDoc, layoutName = '', sizeCategory = '') => {
  const result = {
    layout: null,
    dimension: null,
    configuration: null,
    materials: [],
    skipped: false,
    validationError: null,
  };

  if (!layoutName) {
    return result;
  }

  const roomName = roomDoc?.name || 'Unknown';
  const layout = findLayoutByName(roomDoc, layoutName);

  if (!layout) {
    result.skipped = true;
    result.validationError = `Layout "${layoutName}" was not found for room "${roomName}".`;
    return result;
  }

  result.layout = layout;

  if (!layout.hasLayoutMaterials) {
    return result;
  }

  const dimensions = Array.isArray(roomDoc?.dimensions) ? roomDoc.dimensions : [];
  const dimension = matchDimensionFromSizeCategory(dimensions, sizeCategory);

  if (!dimension && !sizeCategory) {
    result.skipped = true;
    result.validationError = `A dimension selection is required for layout "${layoutName}" materials in room "${roomName}".`;
    return result;
  }

  const configuration = findLayoutConfiguration(layout, dimension, sizeCategory);

  if (!configuration) {
    result.skipped = true;
    result.validationError = `No layout materials are configured for layout "${layoutName}" and the selected dimension in room "${roomName}".`;
    return result;
  }

  result.dimension = dimension;
  result.configuration = configuration;
  result.materials = Array.isArray(configuration.materials) ? configuration.materials : [];
  return result;
};

const getLayoutMaterialsForRoom = (roomDoc, layoutName = '', sizeCategory = '') =>
  resolveLayoutMaterials(roomDoc, layoutName, sizeCategory).materials;

const getLayoutMaterialsTotal = (materials = [], roomSelection = {}) =>
  (Array.isArray(materials) ? materials : []).reduce((sum, material) => {
    const materialId = material?._id?.toString() || material?.id;
    if (!materialId) {
      return sum;
    }

    const isMandatory = Boolean(material.mandatory);
    const isSelected =
      roomSelection[materialId] === undefined ? true : Boolean(roomSelection[materialId]);

    if (isMandatory || isSelected) {
      return sum + (Number(material.price) || 0);
    }

    return sum;
  }, 0);

const formatLayoutMaterials = (materials = []) =>
  (Array.isArray(materials) ? materials : []).map((material, index) => ({
    id: material?._id?.toString() || material?.id || `material-${index}`,
    name: material?.name || '',
    price: Number(material?.price) || 0,
    mandatory: Boolean(material?.mandatory),
  }));

const collectDimensionIds = (dimensions = []) => {
  const ids = new Set();

  (Array.isArray(dimensions) ? dimensions : []).forEach((dim) => {
    if (dim?._id) {
      ids.add(String(dim._id));
    }
  });

  return ids;
};

const validateRoomLayoutConfigurations = (dimensions = [], layouts = []) => {
  const errors = [];
  const dimensionIds = collectDimensionIds(dimensions);

  (Array.isArray(layouts) ? layouts : []).forEach((layout) => {
    if (!layout?.hasLayoutMaterials) {
      return;
    }

    const layoutName = layout?.name || 'Unnamed layout';
    const configurations = Array.isArray(layout.configurations) ? layout.configurations : [];

    if (configurations.length === 0) {
      errors.push(`Layout "${layoutName}" has materials enabled but no dimension configurations.`);
      return;
    }

    configurations.forEach((config, index) => {
      if (!config?.dimensionId) {
        errors.push(`Layout "${layoutName}" configuration ${index + 1} is missing dimensionId.`);
        return;
      }

      if (!dimensionIds.has(String(config.dimensionId))) {
        errors.push(
          `Layout "${layoutName}" configuration ${index + 1} references an unknown dimension.`
        );
      }
    });
  });

  return errors;
};

module.exports = {
  matchDimensionFromSizeCategory,
  findLayoutByName,
  findLayoutConfiguration,
  resolveLayoutMaterials,
  getLayoutMaterialsForRoom,
  getLayoutMaterialsTotal,
  formatLayoutMaterials,
  validateRoomLayoutConfigurations,
};
