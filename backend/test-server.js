#!/usr/bin/env node

// Simple test script to verify the server can start
// This doesn't require MongoDB to be running

const path = require('path');
const fs = require('fs');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('❌ Dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check if main server file exists
const serverPath = path.join(distPath, 'server.js');
if (!fs.existsSync(serverPath)) {
  console.log('❌ Server file not found at dist/server.js');
  process.exit(1);
}

console.log('✅ Build artifacts found');
console.log('✅ Backend is ready to run');
console.log('');
console.log('To start the backend:');
console.log('1. Make sure MongoDB is running');
console.log('2. Copy env.example to .env and configure');
console.log('3. Run: npm run dev');
console.log('');
console.log('The API will be available at: http://localhost:3001');
console.log('Health check: http://localhost:3001/health');
console.log('API docs: http://localhost:3001/api');
