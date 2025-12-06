#!/usr/bin/env node
/**
 * Test WhatsApp Feedback Integration
 * Tests the /api/foto/feedback endpoint
 */

const http = require('http');

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

async function testWhatsAppFeedback() {
  console.log('\n🧪 WhatsApp Feedback Integration Test');
  console.log('=' .repeat(60));

  // First, create an evaluation to test with
  console.log('\n📝 Setup: Creating test evaluation...');
  const setupResponse = await makeRequest('POST', '/api/foto/evaluate', {
    dr_number: 'DR8888888',
  });

  if (setupResponse.status !== 200) {
    console.log('❌ Failed to create test evaluation');
    return;
  }
  console.log('✅ Test evaluation created for DR8888888');

  // Test 1: Send feedback (mock mode)
  console.log('\n📝 Test 1: Send Feedback (WhatsApp disabled - mock mode)');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/feedback', {
      dr_number: 'DR8888888',
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ PASS - Feedback sent successfully (mock)');
      console.log(`DR Number: ${response.data.data.dr_number}`);
      console.log(`Feedback Sent: ${response.data.data.feedback_sent}`);
      console.log(`Sent At: ${response.data.data.feedback_sent_at}`);
      console.log(`Message: ${response.data.data.message}`);
    } else {
      console.log('❌ FAIL - Unexpected status code');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 2: Try to send feedback again (should fail - already sent)
  console.log('\n📝 Test 2: Prevent Duplicate Feedback');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/feedback', {
      dr_number: 'DR8888888',
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ PASS - Correctly rejected duplicate feedback');
      console.log(`Error: ${response.data.error}`);
      console.log(`Message: ${response.data.message}`);
    } else {
      console.log('❌ FAIL - Should reject duplicate feedback');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 3: Send feedback for non-existent DR
  console.log('\n📝 Test 3: Error Handling - Non-existent DR');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/feedback', {
      dr_number: 'DR9999999',
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 404) {
      console.log('✅ PASS - Correctly returned 404 for non-existent DR');
      console.log(`Error: ${response.data.error}`);
      console.log(`Message: ${response.data.message}`);
    } else {
      console.log('❌ FAIL - Should return 404 for non-existent DR');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAIL - Request failed');
    console.error(error.message);
  }

  // Test 4: Missing DR number
  console.log('\n📝 Test 4: Error Handling - Missing DR Number');
  console.log('-'.repeat(60));
  try {
    const response = await makeRequest('POST', '/api/foto/feedback', {});

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

  // Configuration info
  console.log('\n📝 Test 5: WhatsApp Configuration');
  console.log('-'.repeat(60));
  const whatsappEnabled = process.env.USE_WHATSAPP_FEEDBACK === 'true';

  console.log(`USE_WHATSAPP_FEEDBACK: ${whatsappEnabled ? '✅ Enabled' : '❌ Disabled (using mock)'}`);
  console.log(`WhatsApp Service: http://localhost:8081 (on VPS)`);
  console.log(`Configured Projects: Velo Test, Lawley, Mohadin, Mamelodi`);

  if (!whatsappEnabled) {
    console.log('\n💡 To enable WhatsApp feedback:');
    console.log('   1. Set environment variable: USE_WHATSAPP_FEEDBACK=true');
    console.log('   2. Ensure WhatsApp Sender service running on VPS port 8081');
    console.log('   3. Deploy to VPS (localhost:8081 only works on server)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ WhatsApp Feedback Tests Complete');
  console.log('=' + '='.repeat(59));
}

// Run tests
testWhatsAppFeedback().catch(console.error);
