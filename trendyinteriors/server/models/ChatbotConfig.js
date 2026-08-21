const mongoose = require('mongoose');

const chatbotConfigSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    creativeMode: {
      type: Boolean,
      default: true,
      description: 'Enable vivid and imaginative design answers',
    },
    systemPromptOverride: {
      type: String,
      trim: true,
      default: '',
      description: 'Custom system prompt to override the default built prompt',
    },
    model: {
      type: String,
      default: 'llama-3.3-70b-versatile',
      description: 'Groq model to use for responses',
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
      description: 'Temperature for creative responses (0.0 = deterministic, 2.0 = very creative)',
    },
    maxTokens: {
      type: Number,
      default: 256,
      min: 50,
      max: 2000,
      description: 'Maximum tokens in response',
    },
    meetingEmailTo: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'trendyadmin123@gmail.com',
      description: 'Email address to send meeting requests to',
    },
    allowFileUpload: {
      type: Boolean,
      default: true,
      description: 'Allow floor plan PDF and image uploads',
    },
    maxFileSize: {
      type: Number,
      default: 10485760,
      min: 1048576,
      description: 'Maximum file size in bytes (default 10MB)',
    },
    cacheContextTTL: {
      type: Number,
      default: 300,
      min: 60,
      description: 'Cache TTL for chatbot context data in seconds',
    },
  },
  { timestamps: true }
);

chatbotConfigSchema.pre('save', async function enforceSingleton(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      return next(new Error('Only one ChatbotConfig document is allowed'));
    }
  }
  next();
});

module.exports = mongoose.model('ChatbotConfig', chatbotConfigSchema);
