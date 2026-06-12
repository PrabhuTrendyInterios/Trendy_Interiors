#!/usr/bin/env node

/**
 * Direct test with the new API key
 */

const axios = require('axios');

const testNewKey = async () => {
  const newKey = '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';

  console.log('🧪 Testing NEW Groq API Key directly...\n');
  console.log(`Key: ${newKey.substring(0, 10)}...${newKey.substring(newKey.length - 5)}\n`);

  try {
    console.log('📡 Sending test request to Groq API...');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Say hello'
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${newKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log('✅ SUCCESS! Your new Groq API key works!\n');
    console.log('📝 Response:', response.data?.choices?.[0]?.message?.content);
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED! Groq API Error:\n');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
};

testNewKey();
