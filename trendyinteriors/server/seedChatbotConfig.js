require('dotenv').config({ override: true });
const mongoose = require('mongoose');

const ChatbotConfig = require('./models/ChatbotConfig');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trendydev';

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

async function seedChatbotConfig({ closeConnection = true } = {}) {
  try {
    await connectDB();

    const existingConfig = await ChatbotConfig.findOne({});

    if (existingConfig) {
      console.log('✓ ChatbotConfig already exists. Skipping seed.');
      console.log('Current config:', existingConfig);
      if (closeConnection && mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      return;
    }

    const defaultConfig = new ChatbotConfig({
      enabled: true,
      creativeMode: true,
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      maxTokens: 256,
      meetingEmailTo: process.env.MEETING_EMAIL_TO || 'trendyadmin123@gmail.com',
      allowFileUpload: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      cacheContextTTL: 300, // 5 minutes
    });

    await defaultConfig.save();

    console.log('✓ ChatbotConfig seeded successfully!');
    console.log('Default configuration:');
    console.log(JSON.stringify(defaultConfig, null, 2));

    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('✗ Error seeding ChatbotConfig:', error.message);
    if (closeConnection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
}

if (require.main === module) {
  seedChatbotConfig()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedChatbotConfig;
