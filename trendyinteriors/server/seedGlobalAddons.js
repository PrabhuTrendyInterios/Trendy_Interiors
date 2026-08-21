require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const GlobalAddon = require('./models/GlobalAddon');
const { globalAddonsCatalog } = require('./seeds/estimatorCatalog');

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

const seedGlobalAddons = async ({ closeConnection = true } = {}) => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    for (const addonData of globalAddonsCatalog) {
      await GlobalAddon.findOneAndUpdate({ name: addonData.name }, addonData, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      });
      console.log(`✓ Global addon seeded: ${addonData.name}`);
    }

    const count = await GlobalAddon.countDocuments();
    console.log(`\n✅ Global addons seed complete (${count} addons in database)`);
    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('❌ Error seeding global addons:', error);
    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

if (require.main === module) {
  seedGlobalAddons()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedGlobalAddons;
