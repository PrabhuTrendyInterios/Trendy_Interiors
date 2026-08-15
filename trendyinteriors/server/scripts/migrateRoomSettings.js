require('dotenv').config({ path: `${__dirname}/../.env` });
const mongoose = require('mongoose');
const Room = require('../models/Room');

const POOJA_LAYOUT = {
  name: 'Pooja Unit',
  imageUrl: '/images/estimator/poojaroom.png',
  description: 'A fixed-price traditional or modern prayer unit.',
  fixedPrice: 45000,
  hasLayoutMaterials: false,
  configurations: [],
};

const legacyLimitFor = (roomName = '') =>
  String(roomName).toLowerCase().includes('bedroom') ? 6 : 2;

const connect = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/trendydev';

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri);
      return;
    } catch (error) {
      if (process.env.MONGODB_FALLBACK_LOCAL !== 'true') {
        throw error;
      }
    }
  }

  await mongoose.connect(localUri);
};

const migrateRoomSettings = async () => {
  await connect();
  const rooms = await Room.find({});

  for (const room of rooms) {
    let changed = false;
    const configuredLimit = Number(room.maxSelectableRooms);

    if (!Number.isInteger(configuredLimit) || configuredLimit < 1) {
      room.maxSelectableRooms = legacyLimitFor(room.name);
      changed = true;
    }

    if (String(room.name).trim().toLowerCase() === 'pooja room') {
      if (room.requiresDimensions !== false) {
        room.requiresDimensions = false;
        changed = true;
      }

      if (room.allowCustomDimensions !== false) {
        room.allowCustomDimensions = false;
        changed = true;
      }

      if (room.dimensions.length > 0) {
        room.dimensions = [];
        changed = true;
      }

      if (room.layouts.length === 0) {
        room.layouts = [POOJA_LAYOUT];
        changed = true;
      }
    }

    if (changed) {
      await room.save();
      console.log(`Updated room settings: ${room.name}`);
    }
  }

  console.log(`Room settings migration complete (${rooms.length} rooms checked).`);
};

if (require.main === module) {
  migrateRoomSettings()
    .then(() => mongoose.connection.close())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('Room settings migration failed:', error);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      process.exit(1);
    });
}

module.exports = migrateRoomSettings;
