require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const GlobalAddon = require('./models/GlobalAddon');
const { globalAddonsCatalog } = require('./seeds/estimatorCatalog');

const seedGlobalAddons = async () => {
  try {
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
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding global addons:', error);
    process.exit(1);
  }
};

seedGlobalAddons();
