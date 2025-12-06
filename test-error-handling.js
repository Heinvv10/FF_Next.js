/**
 * Test error handling and standardized responses across all foto APIs
 * Verifies:
 * - Proper error catching
 * - Standard JSON response format
 * - Appropriate HTTP status codes
 * - User-friendly error messages
 * - No stack traces in production
 */

const API_BASE = 'http://localhost:3005/api/foto';

/**
 * Test invalid inputs for each endpoint
 */
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===\n');

  const tests = [
    {
      name: 'POST /api/foto/evaluate - Missing DR number',
      url: `${API_BASE}/evaluate`,
      method: 'POST',
      body: {},
      expectedStatus: 400,
    },
    {
      name: 'POST /api/foto/evaluate - Invalid DR format',
      url: `${API_BASE}/evaluate`,
      method: 'POST',
      body: { dr_number: 'INVALID123' },
      expectedStatus: 400,
    },
    {
      name: 'POST /api/foto/evaluate - SQL injection attempt',
      url: `${API_BASE}/evaluate`,
      method: 'POST',
      body: { dr_number: "DR1234567' OR '1'='1" },
      expectedStatus: 400,
    },
    {
      name: 'GET /api/foto/evaluation/[dr] - Invalid DR format',
      url: `${API_BASE}/evaluation/INVALID`,
      method: 'GET',
      expectedStatus: 400,
    },
    {
      name: 'GET /api/foto/evaluation/[dr] - Non-existent DR',
      url: `${API_BASE}/evaluation/DR9999999`,
      method: 'GET',
      expectedStatus: 404,
    },
    {
      name: 'POST /api/foto/feedback - Missing DR number',
      url: `${API_BASE}/feedback`,
      method: 'POST',
      body: {},
      expectedStatus: 400,
    },
    {
      name: 'POST /api/foto/feedback - Unevaluated DR',
      url: `${API_BASE}/feedback`,
      method: 'POST',
      body: { dr_number: 'DR9999999' },
      expectedStatus: 404,
    },
    {
      name: 'GET /api/foto/photos - Invalid date format',
      url: `${API_BASE}/photos?startDate=invalid-date`,
      method: 'GET',
      expectedStatus: 400,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      // Check status code
      const statusOk = response.status === test.expectedStatus;

      // Check for valid JSON
      const validJson = typeof data === 'object' && data !== null;

      // Check for error property
      const hasError = data.error || data.message;

      // Check no stack trace
      const noStackTrace = !data.stack && !JSON.stringify(data).includes('at ');

      // Check user-friendly message
      const userFriendly = hasError && typeof hasError === 'string' && hasError.length > 0;

      if (statusOk && validJson && hasError && noStackTrace && userFriendly) {
        console.log(`✓ ${test.name}`);
        console.log(`  Status: ${response.status}, Error: ${data.error || data.message}`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        if (!statusOk) console.log(`  Expected ${test.expectedStatus}, got ${response.status}`);
        if (!validJson) console.log(`  Response is not valid JSON`);
        if (!hasError) console.log(`  Missing error message`);
        if (!noStackTrace) console.log(`  Stack trace leaked to client`);
        if (!userFriendly) console.log(`  Error message not user-friendly`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Exception: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: tests.length };
}

/**
 * Test standardized response format
 */
async function testStandardizedResponses() {
  console.log('\n=== Testing Standardized Responses ===\n');

  const tests = [
    {
      name: 'POST /api/foto/evaluate - Success response',
      url: `${API_BASE}/evaluate`,
      method: 'POST',
      body: { dr_number: `DR${Date.now().toString().slice(-8)}` },
      expectSuccess: true,
    },
    {
      name: 'GET /api/foto/photos - Success response',
      url: `${API_BASE}/photos`,
      method: 'GET',
      expectSuccess: true,
    },
    {
      name: 'POST /api/foto/evaluate - Error response',
      url: `${API_BASE}/evaluate`,
      method: 'POST',
      body: { dr_number: 'INVALID' },
      expectSuccess: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      // Check valid JSON
      const validJson = typeof data === 'object' && data !== null;

      let formatOk = false;
      if (test.expectSuccess) {
        // Success responses should have 'success: true' and 'data' property
        formatOk = data.success === true && data.data !== undefined;
      } else {
        // Error responses should have 'error' property
        formatOk = data.error !== undefined || data.message !== undefined;
      }

      if (validJson && formatOk) {
        console.log(`✓ ${test.name}`);
        if (test.expectSuccess) {
          console.log(`  Format: { success: true, data: {...} }`);
        } else {
          console.log(`  Format: { error: '...', message: '...' }`);
        }
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        if (!validJson) console.log(`  Not valid JSON`);
        if (!formatOk) console.log(`  Response format incorrect: ${JSON.stringify(data).slice(0, 100)}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Exception: ${error.message}`);
      failed++;
    }
  }

  return { passed, failed, total: tests.length };
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('==================================================');
  console.log('Foto API Error Handling & Standardized Responses');
  console.log('==================================================');

  const errorResults = await testErrorHandling();
  const responseResults = await testStandardizedResponses();

  console.log('\n==================================================');
  console.log('Test Results Summary');
  console.log('==================================================');
  console.log(`Error Handling:         ${errorResults.passed}/${errorResults.total} passed`);
  console.log(`Standardized Responses: ${responseResults.passed}/${responseResults.total} passed`);

  const totalPassed = errorResults.passed + responseResults.passed;
  const totalTests = errorResults.total + responseResults.total;

  console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed`);
  console.log('==================================================\n');

  process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run tests
runAllTests();
