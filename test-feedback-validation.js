/**
 * Test POST /api/foto/feedback validation
 * Verify that feedback endpoint validates evaluation exists before proceeding
 */

async function testFeedbackForUnevaluatedDR() {
  console.log('\n=== Testing Feedback for Unevaluated DR ===');

  // Use a DR that definitely doesn't exist
  const nonExistentDR = 'DR9999999';

  try {
    const response = await fetch('http://localhost:3005/api/foto/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dr_number: nonExistentDR,
      }),
    });

    const data = await response.json();

    // Verify 404 error returned
    if (response.status === 404) {
      console.log('✓ Correct status code: 404 Not Found');
    } else {
      console.error(`✗ Wrong status code: ${response.status} (expected 404)`);
      return false;
    }

    // Verify error message indicates no evaluation found
    if (data.error && data.error.includes('not found')) {
      console.log('✓ Error message indicates evaluation not found');
      console.log(`  Error: ${data.error}`);
      console.log(`  Message: ${data.message}`);
    } else {
      console.error('✗ Error message does not indicate missing evaluation');
      console.error(`  Received: ${JSON.stringify(data)}`);
      return false;
    }

    // Verify error message mentions running evaluation first
    if (data.message && data.message.includes('run evaluation first')) {
      console.log('✓ Message instructs user to run evaluation first');
    } else {
      console.error('✗ Message does not provide helpful guidance');
      return false;
    }

    console.log('✓ All validation checks passed');
    return true;

  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function testDatabaseNotModified() {
  console.log('\n=== Verifying Database Not Modified ===');

  const nonExistentDR = 'DR9999999';

  try {
    // Try to get the evaluation (should return 404)
    const response = await fetch(`http://localhost:3005/api/foto/evaluation/${nonExistentDR}`);
    const data = await response.json();

    if (response.status === 404) {
      console.log('✓ Database was not modified - evaluation still does not exist');
      return true;
    } else {
      console.error('✗ Unexpected response - database may have been modified');
      console.error(`  Status: ${response.status}`);
      console.error(`  Data: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('==================================================');
  console.log('Foto Feedback Validation Tests');
  console.log('==================================================');

  const results = {
    feedbackValidation: await testFeedbackForUnevaluatedDR(),
    databaseIntegrity: await testDatabaseNotModified(),
  };

  console.log('\n==================================================');
  console.log('Test Results Summary');
  console.log('==================================================');
  console.log(`Feedback Validation:  ${results.feedbackValidation ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Database Integrity:   ${results.databaseIntegrity ? '✓ PASS' : '✗ FAIL'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;

  console.log(`\nTotal: ${passed}/${total} tests passed`);
  console.log('==================================================\n');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests();
