#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES\n');
console.log('Current working directory:', process.cwd());
console.log('Script directory (__dirname):', __dirname);

// Check .env file directly
const envPath = path.join(__dirname, '.env');
console.log('\n📄 Checking .env file:');
console.log('Path:', envPath);
console.log('Exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const groqLine = lines.find(line => line.startsWith('GROQ_API_KEY'));
  console.log('GROQ_API_KEY line:', groqLine);
  
  if (groqLine) {
    const key = groqLine.split('=')[1];
    console.log('Extracted key:', key);
    console.log('Key length:', key.length);
    console.log('First 20 chars:', key.substring(0, 20));
    console.log('Last 10 chars:', key.substring(key.length - 10));
  }
}

// Check current process.env before dotenv
console.log('\n🔄 Before dotenv.config():');
console.log('process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 20)}...` : 'NOT SET');

// Load dotenv
console.log('\n📦 Loading dotenv...');
require('dotenv').config({ path: envPath });

// Check process.env after dotenv
console.log('\n🔄 After dotenv.config():');
console.log('process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 20)}...${process.env.GROQ_API_KEY.substring(process.env.GROQ_API_KEY.length - 10)}` : 'NOT SET');
console.log('Key length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 'N/A');

// Check system environment variable
console.log('\n🖥️  System Environment Variable:');
const sysVar = process.env.GROQ_API_KEY;
console.log('Current process.env.GROQ_API_KEY:', sysVar ? `${sysVar.substring(0, 10)}...${sysVar.substring(sysVar.length - 5)}` : 'NOT SET');
