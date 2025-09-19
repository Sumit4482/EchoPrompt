#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing EchoPrompt Application...\n');

// Test backend health
function testBackend() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ Backend Health Check:', health.status);
          console.log('   Mode:', health.mode);
          console.log('   Version:', health.version);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Timeout')));
  });
}

// Test API endpoint
function testAPI() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const api = JSON.parse(data);
          console.log('✅ API Endpoint Check:', api.name);
          console.log('   Description:', api.description);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Timeout')));
  });
}

// Test prompt generation
function testPromptGeneration() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      promptData: {
        role: "Technical Writer",
        task: "Create documentation for a REST API",
        context: "Node.js Express application",
        tone: "Professional",
        outputFormat: "Markdown"
      },
      optimize: true
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/prompts/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Prompt Generation Test: SUCCESS');
            console.log('   Generated prompt length:', result.data.prompt.content.length, 'characters');
            console.log('   Word count:', result.data.metadata.wordCount);
            console.log('   Optimized:', result.data.prompt.metadata.optimized);
          } else {
            throw new Error(result.error || 'Unknown error');
          }
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    req.write(postData);
    req.end();
  });
}

// Test frontend connectivity
function testFrontend() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8080', (res) => {
      console.log('✅ Frontend Server: RUNNING');
      console.log('   Status Code:', res.statusCode);
      console.log('   Content Type:', res.headers['content-type']);
      resolve(true);
    });
    req.on('error', (err) => {
      console.log('⚠️  Frontend Server: NOT ACCESSIBLE');
      console.log('   Error:', err.message);
      console.log('   Make sure to run: npm run dev');
      resolve(false); // Don't reject, just note it's not running
    });
    req.setTimeout(5000, () => {
      console.log('⚠️  Frontend Server: TIMEOUT');
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  try {
    console.log('=== Backend Tests ===');
    await testBackend();
    await testAPI();
    await testPromptGeneration();
    
    console.log('\n=== Frontend Test ===');
    await testFrontend();
    
    console.log('\n🎉 Application Tests Complete!');
    console.log('\n📱 Access your application:');
    console.log('   Frontend: http://localhost:8080');
    console.log('   Backend API: http://localhost:3001/api');
    console.log('   Health Check: http://localhost:3001/health');
    
    console.log('\n🔧 Test the prompt generation:');
    console.log('   1. Open http://localhost:8080 in your browser');
    console.log('   2. Fill in the role and task fields');
    console.log('   3. Click "Generate Optimized Prompt"');
    console.log('   4. See the AI-generated prompt in the preview panel');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure backend is running: cd backend && npm run dev:mock');
    console.log('   • Make sure frontend is running: npm run dev');
    console.log('   • Check that ports 3001 and 5173 are available');
    process.exit(1);
  }
}

runTests();
