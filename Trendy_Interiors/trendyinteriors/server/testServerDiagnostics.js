#!/usr/bin/env node

/**
 * Comprehensive server diagnostics
 * Run: node testServerDiagnostics.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const diagnostics = async () => {
  const baseUrl = 'http://localhost:5000';
  const results = {
    passed: [],
    failed: []
  };

  console.log('🔍 TrendyInterios Server Diagnostics\n');
  console.log('═'.repeat(50));

  // Test 1: Server Health
  console.log('\n1️⃣  Testing server health...');
  try {
    const res = await axios.get(`${baseUrl}/api/health`, { timeout: 5000 });
    console.log('✅ Server is running on port 5000');
    results.passed.push('Server health check');
  } catch (error) {
    console.error('❌ Server not responding on port 5000');
    console.error(`   Make sure to run: cd server && npm start`);
    results.failed.push('Server health check: ' + error.message);
  }

  // Test 2: Settings API
  console.log('\n2️⃣  Testing /api/settings endpoint...');
  try {
    const res = await axios.get(`${baseUrl}/api/settings`, { timeout: 5000 });
    if (res.data?.success) {
      console.log('✅ Settings API is working');
      results.passed.push('Settings API');
    } else {
      console.warn('⚠️  Settings API returned but data is invalid');
      results.failed.push('Settings API: Invalid response format');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server. Is it running on port 5000?');
    } else {
      console.error('❌ Settings API failed:', error.message);
    }
    results.failed.push('Settings API: ' + error.message);
  }

  // Test 3: Chatbot Config API
  console.log('\n3️⃣  Testing /api/cms/chatbot-config endpoint...');
  try {
    const res = await axios.get(`${baseUrl}/api/cms/chatbot-config`, { timeout: 5000 });
    if (res.data?.success) {
      console.log('✅ Chatbot config API is working');
      console.log(`   Model: ${res.data.data?.model}`);
      console.log(`   Enabled: ${res.data.data?.enabled}`);
      results.passed.push('Chatbot config API');
    } else {
      console.warn('⚠️  Chatbot config API returned but success=false');
    }
  } catch (error) {
    console.error('❌ Chatbot config API failed:', error.message);
    results.failed.push('Chatbot config API: ' + error.message);
  }

  // Test 4: Groq API Key
  console.log('\n4️⃣  Checking Groq API configuration...');
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not set in .env');
    results.failed.push('Groq API Key: not configured');
  } else {
    console.log('✅ GROQ_API_KEY is configured');
    console.log(`   Length: ${process.env.GROQ_API_KEY.length} characters`);
    results.passed.push('Groq API Key configuration');
  }

  // Test 5: MongoDB Connection
  console.log('\n5️⃣  Checking MongoDB configuration...');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI;
  if (mongoUri) {
    console.log('✅ MongoDB URI is configured');
    console.log(`   URI: ${mongoUri.substring(0, 50)}...`);
    results.passed.push('MongoDB configuration');
  } else {
    console.error('❌ MongoDB URI not configured');
    results.failed.push('MongoDB: not configured');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.passed.length > 0) {
    console.log('\n✅ Passed checks:');
    results.passed.forEach(p => console.log(`   • ${p}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed checks:');
    results.failed.forEach(f => console.log(`   • ${f}`));
  }

  console.log('\n' + '═'.repeat(50));

  if (results.failed.length === 0) {
    console.log('\n🎉 All diagnostics passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
};

diagnostics();
