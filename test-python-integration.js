#!/usr/bin/env node
/**
 * Test Python Backend Integration
 * Tests the /api/foto/evaluate endpoint with Python backend
 */

const http = require('http');

const BASE_URL = 'http://localhost:3005';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testPythonIntegration() {
  console.log('\n🧪 Python Backend Integration Test');
  console.log('=' .repeat(60));

  // Test 1: Mock evaluation (Python disabled)
  console.log('\n📝 Test 1: Mock Evaluation (Python backend disabled)');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/evaluate', {
      dr_number: 'DR7777777',
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ PASS - Mock evaluation successful');
      console.log(`DR Number: ${response.data.data.dr_number}`);
      console.log(`Overall Status: ${response.data.data.overall_status}`);
      console.log(`Average Score: ${response.data.data.average_score}/10`);
      console.log(`Passed Steps: ${response.data.data.passed_steps}/${response.data.data.total_steps}`);
      console.log(`Message: ${response.data.message}`);
    } else {
      console.log('❌ FAIL - Unexpected status code');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 2: Verify evaluation was saved to database
  console.log('\n📝 Test 2: Verify Evaluation Saved to Database');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('GET', '/api/foto/evaluation/DR7777777');

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ PASS - Evaluation retrieved from database');
      console.log(`DR Number: ${response.data.data.dr_number}`);
      console.log(`Overall Status: ${response.data.data.overall_status}`);
    } else {
      console.log('❌ FAIL - Could not retrieve evaluation');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 3: Error handling - missing DR number
  console.log('\n📝 Test 3: Error Handling - Missing DR Number');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/evaluate', {});

    console.log(`Status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ PASS - Correctly rejected missing DR number');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ FAIL - Should return 400 for missing DR');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 4: Python backend info (check if enabled)
  console.log('\n📝 Test 4: Python Backend Configuration');
  console.log('-'.repeat(60));
  const pythonEnabled = process.env.USE_PYTHON_BACKEND === 'true';
  const pythonPath = process.env.PYTHON_SCRIPT_PATH || '/home/louisdup/VF/agents/foto/foto-evaluator-ach/evaluate_dr.py';

  console.log(`USE_PYTHON_BACKEND: ${pythonEnabled ? '✅ Enabled' : '❌ Disabled (using mock data)'}`);
  console.log(`PYTHON_SCRIPT_PATH: ${pythonPath}`);

  if (!pythonEnabled) {
    console.log('\n💡 To enable Python backend:');
    console.log('   1. Set environment variable: USE_PYTHON_BACKEND=true');
    console.log('   2. Ensure Python script exists at: ' + pythonPath);
    console.log('   3. Configure required environment variables:');
    console.log('      - OPENAI_API_KEY');
    console.log('      - NEON_DB_HOST, NEON_DB_USER, NEON_DB_PASSWORD');
    console.log('      - BOSS_VPS_API_URL');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Python Integration Tests Complete');
  console.log('=' + '='.repeat(59));
}

// Run tests
testPythonIntegration().catch(console.error);
