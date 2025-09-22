#!/usr/bin/env node

/**
 * Quick Test Script for Contractors Module
 * This script helps verify that the contractors module is working correctly
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(test, passed, details = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${test}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
  TEST_RESULTS.push({ test, passed, details });
}

function makeRequest(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testFileExists(filePath, description) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const exists = fs.existsSync(fullPath);
    logResult(`File exists: ${description}`, exists, filePath);
    return exists;
  } catch (error) {
    logResult(`File exists: ${description}`, false, error.message);
    return false;
  }
}

async function testApiEndpoint(endpoint, description, expectedStatus = 200) {
  try {
    const response = await makeRequest(endpoint, expectedStatus);
    const passed = response.statusCode === expectedStatus;
    logResult(`API ${description}`, passed, `${endpoint} → ${response.statusCode}`);
    return { passed, response };
  } catch (error) {
    logResult(`API ${description}`, false, `${endpoint} → ${error.message}`);
    return { passed: false, error };
  }
}

async function testHealthEndpoint() {
  try {
    const { passed, response } = await testApiEndpoint('/api/contractors/health', 'Health Check');
    if (passed && response) {
      try {
        const healthData = JSON.parse(response.data);
        logResult('Health JSON Parse', true, `Status: ${healthData.status}`);
        
        if (healthData.checks && healthData.checks.length > 0) {
          const passedChecks = healthData.checks.filter(c => c.status === 'pass').length;
          logResult('Health Checks', passedChecks > 0, `${passedChecks}/${healthData.checks.length} checks passing`);
        }
        
        if (healthData.performance) {
          logResult('Performance Metrics', true, `${healthData.performance.operations.totalOperations} operations tracked`);
        }
      } catch (error) {
        logResult('Health JSON Parse', false, error.message);
      }
    }
  } catch (error) {
    logResult('Health Check', false, error.message);
  }
}

async function runTests() {
  log('\n🚀 Starting Contractors Module Tests\n', 'blue');
  log('=' .repeat(50), 'cyan');

  // Test 1: File Structure
  log('\n📁 Testing File Structure:', 'yellow');
  await testFileExists('pages/contractors.tsx', 'Main contractors page');
  await testFileExists('src/modules/contractors/ContractorsDashboard.tsx', 'Contractors dashboard component');
  await testFileExists('src/services/contractor/monitoring/performanceMonitor.ts', 'Performance monitor service');
  await testFileExists('pages/api/contractors/health.ts', 'Health check API');
  await testFileExists('src/modules/contractors/docs/API_DOCUMENTATION.md', 'API documentation');
  await testFileExists('src/modules/contractors/docs/RAG_SCORING_DOCUMENTATION.md', 'RAG scoring documentation');

  // Test 2: API Endpoints
  log('\n🌐 Testing API Endpoints:', 'yellow');
  await testApiEndpoint('/api/contractors/health', 'Health Check Endpoint');
  await testApiEndpoint('/api/contractors', 'Contractors List API', 200);
  
  // Test 3: Health Check Details
  log('\n🏥 Testing Health Check Details:', 'yellow');
  await testHealthEndpoint();

  // Test 4: Basic Page Access
  log('\n📱 Testing Page Access:', 'yellow');
  await testApiEndpoint('/contractors', 'Contractors Page', 200);

  // Summary
  log('\n' + '=' .repeat(50), 'cyan');
  const passed = TEST_RESULTS.filter(r => r.passed).length;
  const total = TEST_RESULTS.length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`\n📊 Test Summary:`, 'blue');
  log(`   Passed: ${passed}/${total} (${percentage}%)`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All tests passed! Your contractors module is ready to use.', 'green');
    log('\n🔗 Next steps:', 'cyan');
    log('   1. Open http://localhost:3000/contractors in your browser', 'white');
    log('   2. Try creating a new contractor', 'white');
    log('   3. Test the import/export functionality', 'white');
    log('   4. Check the performance monitoring dashboard', 'white');
  } else {
    log('\n⚠️  Some tests failed. Please check the details above.', 'yellow');
    log('\n🔧 Troubleshooting tips:', 'cyan');
    log('   1. Make sure your Next.js dev server is running (npm run dev)', 'white');
    log('   2. Check for any console errors in your browser', 'white');
    log('   3. Verify your database connection is working', 'white');
    log('   4. Review the failed tests above for specific issues', 'white');
  }

  log('\n📚 Documentation available at:', 'cyan');
  log('   • API Docs: src/modules/contractors/docs/API_DOCUMENTATION.md', 'white');
  log('   • RAG Scoring: src/modules/contractors/docs/RAG_SCORING_DOCUMENTATION.md', 'white');
  log('   • Testing Guide: src/modules/contractors/docs/TESTING_AND_USAGE_GUIDE.md', 'white');
  
  log('\n🌟 Happy testing!', 'magenta');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});