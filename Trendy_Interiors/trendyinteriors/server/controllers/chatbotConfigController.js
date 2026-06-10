const ChatbotConfig = require('../models/ChatbotConfig');

// Get chatbot configuration (public - no auth required)
exports.getChatbotConfig = async (req, res) => {
  try {
    let config = await ChatbotConfig.findOne({});

    if (!config) {
      config = await ChatbotConfig.create({});
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unable to fetch chatbot configuration',
    });
  }
};

// Update chatbot configuration (admin only)
exports.updateChatbotConfig = async (req, res) => {
  try {
    const {
      enabled,
      creativeMode,
      systemPromptOverride,
      model,
      temperature,
      maxTokens,
      meetingEmailTo,
      allowFileUpload,
      maxFileSize,
      cacheContextTTL,
    } = req.body;

    let config = await ChatbotConfig.findOne({});

    if (!config) {
      config = await ChatbotConfig.create({});
    }

    // Update only provided fields
    if (enabled !== undefined) config.enabled = enabled;
    if (creativeMode !== undefined) config.creativeMode = creativeMode;
    if (systemPromptOverride !== undefined) config.systemPromptOverride = systemPromptOverride;
    if (model !== undefined) config.model = model;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens !== undefined) config.maxTokens = maxTokens;
    if (meetingEmailTo !== undefined) config.meetingEmailTo = meetingEmailTo;
    if (allowFileUpload !== undefined) config.allowFileUpload = allowFileUpload;
    if (maxFileSize !== undefined) config.maxFileSize = maxFileSize;
    if (cacheContextTTL !== undefined) config.cacheContextTTL = cacheContextTTL;

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Chatbot configuration updated successfully',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unable to update chatbot configuration',
    });
  }
};

// Reset to defaults (admin only)
exports.resetChatbotConfig = async (req, res) => {
  try {
    await ChatbotConfig.deleteMany({});
    const config = await ChatbotConfig.create({});

    res.status(200).json({
      success: true,
      message: 'Chatbot configuration reset to defaults',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unable to reset chatbot configuration',
    });
  }
};
