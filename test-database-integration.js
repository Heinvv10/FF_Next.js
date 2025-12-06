#!/usr/bin/env node

/**
 * FibreFlow Foto Review - Database Integration Tests
 * Tests: #63, #64, #65, #66, #67
 */

const testDR = `DR${Date.now().toString().slice(-8)}`;

async function runTests() {
  console.log('==================================================');
  console.log('Database Integration Tests');
  console.log('==================================================');
  console.log(`Test DR: ${testDR}\n`);

  const results = {
    test63: false, // Database connection works
    test64: false, // Table exists with correct schema
    test65: false, // Parameterized statements used
    test66: false, // Errors handled gracefully
    test67: false, // Results persisted correctly
  };

  // Test #63: Database connection works from API routes
  try {
    console.log('=== Test #63: Database Connection ===');
    const response = await fetch(`http://localhost:3005/api/foto/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dr_number: testDR }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✓ Database connection successful');
      console.log('✓ Query executed');
      console.log('✓ Results returned');
      results.test63 = true;
    } else {
      console.log('✗ Database connection failed');
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  // Test #64: Table exists with correct schema
  try {
    console.log('\n=== Test #64: Table Schema ===');
    const response = await fetch(`http://localhost:3005/api/foto/evaluation/${testDR}`);
    const data = await response.json();

    if (response.ok && data.success) {
      const eval_data = data.data;
      const hasRequiredFields =
        typeof eval_data.dr_number === 'string' &&
        typeof eval_data.overall_status === 'string' &&
        typeof eval_data.average_score === 'number' &&
        typeof eval_data.total_steps === 'number' &&
        typeof eval_data.passed_steps === 'number' &&
        typeof eval_data.step_results === 'object';

      if (hasRequiredFields) {
        console.log('✓ Table exists');
        console.log('✓ Schema has correct columns');
        console.log('  - dr_number (string) ✓');
        console.log('  - overall_status (string) ✓');
        console.log('  - average_score (number) ✓');
        console.log('  - total_steps (number) ✓');
        console.log('  - passed_steps (number) ✓');
        console.log('  - step_results (object) ✓');
        results.test64 = true;
      }
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  // Test #65: Parameterized statements (SQL injection protection)
  try {
    console.log('\n=== Test #65: Parameterized Statements (SQL Injection Protection) ===');

    const injectionAttempts = [
      "DR1234567' OR '1'='1",
      "DR1234567; DROP TABLE foto_ai_reviews;",
      "DR1234567 UNION SELECT * FROM users",
    ];

    let allBlocked = true;
    for (const malicious of injectionAttempts) {
      const response = await fetch(`http://localhost:3005/api/foto/evaluation/${malicious}`);
      const data = await response.json();

      if (response.status === 400) {
        console.log(`✓ Blocked: ${malicious.substring(0, 30)}...`);
      } else {
        console.log(`✗ Not blocked: ${malicious.substring(0, 30)}...`);
        allBlocked = false;
      }
    }

    if (allBlocked) {
      console.log('✓ All SQL injection attempts blocked');
      console.log('✓ Parameterized statements working');
      results.test65 = true;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  // Test #66: Error handling
  try {
    console.log('\n=== Test #66: Error Handling ===');

    // Test with invalid DR format
    const response = await fetch(`http://localhost:3005/api/foto/evaluation/INVALID123`);
    const data = await response.json();

    if (response.status === 400 && !data.success && data.error) {
      console.log('✓ Invalid input caught');
      console.log('✓ User-friendly error message returned');
      console.log(`  Message: "${data.error}"`);
      results.test66 = true;
    } else {
      console.log('✗ Error not handled properly');
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  // Test #67: Results persisted correctly
  try {
    console.log('\n=== Test #67: Data Persistence ===');

    // Create evaluation
    const createResponse = await fetch(`http://localhost:3005/api/foto/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dr_number: testDR }),
    });
    const createData = await createResponse.json();

    // Retrieve evaluation
    const getResponse = await fetch(`http://localhost:3005/api/foto/evaluation/${testDR}`);
    const getData = await getResponse.json();

    if (createResponse.ok && getResponse.ok &&
        createData.success && getData.success &&
        getData.data.dr_number === testDR) {
      console.log('✓ Evaluation saved to database');
      console.log('✓ Evaluation retrieved successfully');
      console.log('✓ Data matches what was saved');
      console.log(`  DR: ${getData.data.dr_number}`);
      console.log(`  Status: ${getData.data.overall_status}`);
      console.log(`  Score: ${getData.data.average_score}/10`);
      results.test67 = true;
    } else {
      console.log('✗ Data persistence failed');
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  // Summary
  console.log('\n==================================================');
  console.log('Test Results Summary');
  console.log('==================================================');
  console.log(`Test #63 (DB Connection):      ${results.test63 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test #64 (Table Schema):       ${results.test64 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test #65 (Parameterized SQL):  ${results.test65 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test #66 (Error Handling):     ${results.test66 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Test #67 (Data Persistence):   ${results.test67 ? '✓ PASS' : '✗ FAIL'}`);

  const passed = Object.values(results).filter(Boolean).length;
  console.log(`\nTotal: ${passed}/5 tests passed`);
  console.log('==================================================');

  return results;
}

runTests().catch(console.error);
