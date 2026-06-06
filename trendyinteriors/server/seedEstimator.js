require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Room = require('./models/Room');
const GlobalAddon = require('./models/GlobalAddon');
const Settings = require('./models/Settings');
const { roomsCatalog, globalAddonsCatalog } = require('./seeds/estimatorCatalog');

const connectDB = async () => {
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

const seedEstimator = async () => {
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
    }
    console.log(`✓ Seeded ${roomsCatalog.length} rooms`);

    for (const addonData of globalAddonsCatalog) {
      await GlobalAddon.findOneAndUpdate({ name: addonData.name }, addonData, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      });
    }
    console.log(`✓ Seeded ${globalAddonsCatalog.length} global addons`);

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
      console.log('✓ Created default settings');
    } else {
      console.log('✓ Settings already exist');
    }

    console.log('\n✅ Estimator CMS seed complete');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding estimator data:', error);
    process.exit(1);
  }
};

seedEstimator();
