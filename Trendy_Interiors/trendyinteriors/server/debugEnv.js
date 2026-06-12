#!/usr/bin/env node

require('dotenv').config({ path: __dirname + '/.env' });

console.log('Raw GROQ_API_KEY value:');
console.log(process.env.GROQ_API_KEY);
console.log('\nFull value:');
console.log(`"${process.env.GROQ_API_KEY}"`);
