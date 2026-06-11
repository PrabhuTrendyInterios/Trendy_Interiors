require('dotenv').config({ path: __dirname + '/.env' });
const connectDB = require('./config/db');
const seedAdmin = require('./seedAdmin');
const seedCategories = require('./seedCategories');
const seedChatbotConfig = require('./seedChatbotConfig');
const seedEstimator = require('./seedEstimator');
const seedExpertise = require('./seedExpertise');
const seedGlobalAddons = require('./seedGlobalAddons');
const seedRooms = require('./seedRooms');
const seedServices = require('./seedServices');

const seedAll = async () => {
  console.log('Running server startup seeds...');
  await seedChatbotConfig({ closeConnection: false });
  await seedAdmin({ closeConnection: false });
  await seedCategories({ closeConnection: false });
  await seedExpertise({ closeConnection: false });
  await seedServices({ closeConnection: false });
  await seedRooms({ closeConnection: false });
  await seedGlobalAddons({ closeConnection: false });
  await seedEstimator({ closeConnection: false });
  console.log('Server startup seeding complete.');
};

if (require.main === module) {
  connectDB()
    .then(seedAll)
    .then(() => {
      console.log('startup seed process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Startup seed failed:', error);
      process.exit(1);
    });
}

module.exports = seedAll;
