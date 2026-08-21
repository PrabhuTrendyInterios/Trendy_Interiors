#!/usr/bin/env node

/**
 * Quick diagnostic script to test Groq API connection
 * Run: node testGroqAPI.js
 */

require('dotenv').config({ path: __dirname + '/.env', override: true });
const axios = require('axios');

const testGroqAPI = async () => {
  console.log('🧪 Testing Groq API Connection...\n');

  // Check if API key exists
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in .env file');
    process.exit(1);
  }

  const apiKey = process.env.GROQ_API_KEY;
  console.log(`✓ GROQ_API_KEY found (length: ${apiKey.length} chars)`);
  console.log(`✓ Key format: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log('✅ SUCCESS! Groq API is working correctly.\n');
    console.log('📝 Response:', response.data?.choices?.[0]?.message?.content);
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED! Groq API Error:\n');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify your GROQ_API_KEY in .env file');
    console.error('2. Get a new key from: https://console.groq.com/');
    console.error('3. Make sure the key is valid and not expired');
    console.error('4. Check Groq API status: https://status.groq.com/');
    process.exit(1);
  }
};

testGroqAPI();
