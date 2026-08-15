require('dotenv').config({ path: `${__dirname}/../.env` });

const mongoose = require('mongoose');
const GlobalAddon = require('../models/GlobalAddon');
const Room = require('../models/Room');
const { globalAddonsCatalog, roomsCatalog } = require('../seeds/estimatorCatalog');
const { validateRoomLayoutConfigurations } = require('../utils/layoutMaterials');

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

const replaceQuoteCatalog = async ({ closeConnection = true } = {}) => {
  await connectDB();

  for (const catalogRoom of roomsCatalog) {
    const errors = validateRoomLayoutConfigurations(catalogRoom.dimensions, catalogRoom.layouts);
    if (errors.length > 0) {
      throw new Error(`${catalogRoom.name}: ${errors.join(' ')}`);
    }

    const room = await Room.findOne({ name: catalogRoom.name });
    if (!room) {
      await Room.create(catalogRoom);
      continue;
    }

    room.requiresDimensions = catalogRoom.requiresDimensions !== false;
    room.allowCustomDimensions = Boolean(catalogRoom.allowCustomDimensions);
    room.displayOrder = Number(catalogRoom.displayOrder) || 0;
    room.dimensions = catalogRoom.dimensions;
    room.layouts = catalogRoom.layouts;
    room.addons = catalogRoom.addons;
    await room.save();
  }

  await GlobalAddon.deleteMany({});
  await GlobalAddon.insertMany(globalAddonsCatalog);

  console.log(
    `TS Web Quote catalog installed: ${roomsCatalog.length} rooms and ` +
      `${globalAddonsCatalog.length} unique additional items.`
  );

  if (closeConnection && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  replaceQuoteCatalog()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('TS Web Quote catalog replacement failed:', error);
      process.exit(1);
    });
}

module.exports = replaceQuoteCatalog;
