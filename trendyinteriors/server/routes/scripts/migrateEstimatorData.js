require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Room = require('../models/Room');
const GlobalAddon = require('../models/GlobalAddon');
const Settings = require('../models/Settings');
const { roomsCatalog, globalAddonsCatalog } = require('../seeds/estimatorCatalog');

const LEGACY_COLLECTIONS = ['estimatorconfigs', 'estimatorconfig'];

const migrateEstimatorData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trendyinteriors');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    for (const collectionName of LEGACY_COLLECTIONS) {
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length > 0) {
        await db.dropCollection(collectionName);
        console.log(`✓ Dropped legacy collection: ${collectionName}`);
      }
    }

    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      await Room.insertMany(roomsCatalog);
      console.log(`✓ Migrated ${roomsCatalog.length} rooms into MongoDB`);
    } else {
      console.log(`✓ Rooms collection already has ${roomCount} documents`);
    }

    const addonCount = await GlobalAddon.countDocuments();
    if (addonCount === 0) {
      await GlobalAddon.insertMany(globalAddonsCatalog);
      console.log(`✓ Migrated ${globalAddonsCatalog.length} global addons into MongoDB`);
    } else {
      console.log(`✓ Global addons collection already has ${addonCount} documents`);
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
      console.log('✓ Created default settings document');
    }

    const estimators = mongoose.connection.collection('estimators');
    const estimatorDocs = await estimators.find({}).toArray();
    let normalized = 0;

    for (const doc of estimatorDocs) {
      const updates = { $unset: { budgetPlan: '' } };
      await estimators.updateOne({ _id: doc._id }, updates);
      normalized += 1;
    }

    if (normalized > 0) {
      console.log(`✓ Normalized ${normalized} estimator submission(s) (removed legacy budgetPlan)`);
    }

    console.log('\n✅ Estimator migration complete');
    console.log('Architecture: Admin CMS → MongoDB → API → Estimator → Quotation');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateEstimatorData();
