require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trendydev';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the ChatbotConfig model
const ChatbotConfig = require('./models/ChatbotConfig');

async function seedChatbotConfig() {
  try {
    // Check if config already exists
    const existingConfig = await ChatbotConfig.findOne({});

    if (existingConfig) {
      console.log('✓ ChatbotConfig already exists. Skipping seed.');
      console.log('Current config:', existingConfig);
      process.exit(0);
    }

    // Create default ChatbotConfig
    const defaultConfig = new ChatbotConfig({
      enabled: true,
      creativeMode: true,
      model: 'llama-3.3-70b-versatile',
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

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding ChatbotConfig:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedChatbotConfig();
