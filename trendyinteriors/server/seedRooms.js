require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Room = require('./models/Room');
const { roomsCatalog } = require('./seeds/estimatorCatalog');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/trendydev';
  const fallbackToLocal = process.env.MONGODB_FALLBACK_LOCAL === 'true';

  try {
    if (uri) {
      await mongoose.connect(uri);
    } else {
      throw new Error('No MongoDB URI configured');
    }
  } catch (error) {
    if (fallbackToLocal) {
      console.log('Attempting fallback to local MongoDB at', localUri);
      await mongoose.connect(localUri);
    } else {
      throw error;
    }
  }
};

const seedRooms = async ({ closeConnection = true } = {}) => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    for (const roomData of roomsCatalog) {
      await Room.findOneAndUpdate({ name: roomData.name }, roomData, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      });
      console.log(`✓ Room seeded: ${roomData.name}`);
    }

    const count = await Room.countDocuments();
    console.log(`\n✅ Rooms seed complete (${count} rooms in database)`);
    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

if (require.main === module) {
  seedRooms()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedRooms;
