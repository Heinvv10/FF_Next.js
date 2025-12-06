/**
 * Test Script: DR Number Validation
 * Tests API endpoint input validation and SQL injection prevention
 */

const BASE_URL = 'http://localhost:3005';

async function testDrValidation() {
  console.log('🧪 DR NUMBER VALIDATION TESTS\n');
  console.log('============================================================');

  const testCases = [
    {
      name: 'Valid DR number',
      drNumber: 'DR1234567',
      expectedStatus: 404, // No evaluation exists, but validation should pass
      shouldPass: true,
    },
    {
      name: 'Valid DR number (uppercase)',
      drNumber: 'DR7654321',
      expectedStatus: 404,
      shouldPass: true,
    },
    {
      name: 'Valid DR number (10 digits)',
      drNumber: 'DR1765044553',
      expectedStatus: 404,
      shouldPass: true,
    },
    {
      name: 'Invalid format - no DR prefix',
      drNumber: '1234567',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Invalid format - too few digits',
      drNumber: 'DR123',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Invalid format - too many digits',
      drNumber: 'DR12345678901',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Invalid format - contains letters',
      drNumber: 'DR123ABC7',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'SQL injection - single quote',
      drNumber: "DR1234567' OR '1'='1",
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'SQL injection - UNION attack',
      drNumber: "DR1234567 UNION SELECT * FROM users",
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'SQL injection - comment',
      drNumber: "DR1234567--",
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'SQL injection - semicolon',
      drNumber: "DR1234567; DROP TABLE users;",
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Empty string',
      drNumber: '',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Whitespace only',
      drNumber: '   ',
      expectedStatus: 400,
      shouldPass: false,
    },
    {
      name: 'Null (undefined in POST body)',
      drNumber: undefined,
      expectedStatus: 400,
      shouldPass: false,
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\nTEST: ${testCase.name}`);
    console.log(`DR Number: ${JSON.stringify(testCase.drNumber)}`);
    console.log('------------------------------------------------------------');

    try {
      const response = await fetch(`${BASE_URL}/api/foto/evaluation/${encodeURIComponent(testCase.drNumber || '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data, null, 2).substring(0, 200)}`);

      // Check if status matches expected
      if (response.status === testCase.expectedStatus) {
        console.log('✅ PASS - Status code matches expected');

        // For validation errors, check that error message is descriptive
        if (response.status === 400 && !testCase.shouldPass) {
          if (data.message && data.message.includes('DR')) {
            console.log('✅ PASS - Error message is descriptive');
            passedTests++;
          } else {
            console.log('❌ FAIL - Error message not descriptive enough');
            failedTests++;
          }
        } else {
          passedTests++;
        }
      } else {
        console.log(`❌ FAIL - Expected status ${testCase.expectedStatus}, got ${response.status}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n============================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  // Test POST /api/foto/evaluate endpoint
  console.log('\n============================================================');
  console.log('TESTING POST /api/foto/evaluate VALIDATION');
  console.log('============================================================\n');

  const postTestCases = [
    {
      name: 'Valid DR in POST body',
      drNumber: 'DR9876543',
      expectedStatus: 200,
    },
    {
      name: 'Invalid DR in POST body',
      drNumber: "DR123' OR '1'='1",
      expectedStatus: 400,
    },
  ];

  for (const testCase of postTestCases) {
    console.log(`\nTEST: ${testCase.name}`);
    console.log(`DR Number: ${JSON.stringify(testCase.drNumber)}`);
    console.log('------------------------------------------------------------');

    try {
      const response = await fetch(`${BASE_URL}/api/foto/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dr_number: testCase.drNumber }),
      });

      const data = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data, null, 2).substring(0, 200)}`);

      if (response.status === testCase.expectedStatus) {
        console.log('✅ PASS');
      } else {
        console.log(`❌ FAIL - Expected ${testCase.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n============================================================');
  console.log('✅ ALL VALIDATION TESTS COMPLETED');
  console.log('============================================================\n');
}

// Run tests
testDrValidation().catch(console.error);
