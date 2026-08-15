require('dotenv').config({ path: `${__dirname}/../.env` });

const mongoose = require('mongoose');
const Room = require('../models/Room');
const { roomsCatalog } = require('../seeds/estimatorCatalog');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/trendydev';

  try {
    if (!primaryUri) throw new Error('No primary MongoDB URI configured');
    await mongoose.connect(primaryUri);
  } catch (error) {
    if (process.env.MONGODB_FALLBACK_LOCAL !== 'true') throw error;
    await mongoose.connect(localUri);
  }
};

const migratePackageComponents = async ({ closeConnection = true } = {}) => {
  await connectDB();

  let updatedDimensions = 0;
  let removedDimensionPackages = 0;
  let addedLayoutConfigurations = 0;

  for (const catalogRoom of roomsCatalog) {
    const room = await Room.findOne({ name: catalogRoom.name });
    if (!room || !Array.isArray(room.dimensions)) continue;

    let roomChanged = false;
    const usesLayoutScopedMaterials = (catalogRoom.layouts || []).some(
      (layout) => layout.hasLayoutMaterials && layout.configurations?.length > 0
    );

    room.dimensions.forEach((dimension) => {
      const template = (catalogRoom.dimensions || []).find(
        (item) => String(item.name).trim().toLowerCase() === String(dimension.name).trim().toLowerCase()
      );

      if (usesLayoutScopedMaterials && dimension.packageComponents?.length > 0) {
        dimension.packageComponents = [];
        removedDimensionPackages += 1;
        roomChanged = true;
        return;
      }

      if (dimension.packageComponents?.length > 0) return;
      if (!template?.packageComponents?.length) return;

      dimension.packageComponents = template.packageComponents.map((component) => ({ ...component }));
      updatedDimensions += 1;
      roomChanged = true;
    });

    room.layouts.forEach((layout) => {
      const template = (catalogRoom.layouts || []).find(
        (item) => String(item.name).trim().toLowerCase() === String(layout.name).trim().toLowerCase()
      );

      if (!template?.hasLayoutMaterials || !template.configurations?.length) return;

      const getDimensionKey = (dimensionId) => {
        const dimension = room.dimensions.find(
          (item) => String(item._id) === String(dimensionId) || String(item.name) === String(dimensionId)
        );
        return String(dimension?.name || dimensionId).trim().toLowerCase();
      };
      const configuredDimensions = new Set(
        (layout.configurations || []).map((configuration) => getDimensionKey(configuration.dimensionId))
      );
      const missingConfigurations = template.configurations.filter(
        (configuration) => !configuredDimensions.has(getDimensionKey(configuration.dimensionId))
      );

      if (missingConfigurations.length > 0) {
        layout.configurations.push(...missingConfigurations.map((configuration) => ({
          ...configuration,
          materials: configuration.materials.map((material) => ({ ...material })),
        })));
        addedLayoutConfigurations += missingConfigurations.length;
        roomChanged = true;
      }

      if (!layout.hasLayoutMaterials) {
        layout.hasLayoutMaterials = true;
        roomChanged = true;
      }
    });

    if (roomChanged) await room.save();
  }

  console.log(
    `Material migration complete: ${updatedDimensions} dimension package(s) added, ` +
      `${removedDimensionPackages} misplaced dimension package(s) removed, ` +
      `${addedLayoutConfigurations} layout configuration(s) added.`
  );

  if (closeConnection && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }

  return { updatedDimensions, removedDimensionPackages, addedLayoutConfigurations };
};

if (require.main === module) {
  migratePackageComponents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Package component migration failed:', error);
      process.exit(1);
    });
}

module.exports = migratePackageComponents;
