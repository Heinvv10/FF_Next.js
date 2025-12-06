/**
 * Test foto-review API endpoints
 * Tests that all APIs work correctly with database integration
 */

const testDR = `DR${Date.now()}`;

async function testEvaluateAPI() {
  console.log('\n=== Testing POST /api/foto/evaluate ===');

  try {
    const response = await fetch('http://localhost:3005/api/foto/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dr_number: testDR,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✓ Evaluation created successfully');
      console.log(`  DR: ${data.data.dr_number}`);
      console.log(`  Status: ${data.data.overall_status}`);
      console.log(`  Score: ${data.data.average_score}/10`);
      console.log(`  Steps: ${data.data.passed_steps}/${data.data.total_steps}`);
      return true;
    } else {
      console.error('✗ Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function testGetEvaluationAPI() {
  console.log('\n=== Testing GET /api/foto/evaluation/[dr_number] ===');

  // Small delay to ensure database write is complete
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const response = await fetch(`http://localhost:3005/api/foto/evaluation/${testDR}`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✓ Evaluation retrieved successfully');
      console.log(`  DR: ${data.data.dr_number}`);
      console.log(`  Status: ${data.data.overall_status}`);
      console.log(`  Score: ${data.data.average_score}/10`);
      console.log(`  Feedback sent: ${data.data.feedback_sent}`);
      return true;
    } else {
      console.error('✗ Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function testFeedbackAPI() {
  console.log('\n=== Testing POST /api/foto/feedback ===');

  try {
    const response = await fetch('http://localhost:3005/api/foto/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dr_number: testDR,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✓ Feedback marked as sent');
      console.log(`  DR: ${data.data.dr_number}`);
      console.log(`  Feedback sent: ${data.data.feedback_sent}`);
      console.log(`  Message length: ${data.message ? data.message.length : 0} chars`);
      return true;
    } else {
      console.error('✗ Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function testPhotosAPI() {
  console.log('\n=== Testing GET /api/foto/photos ===');

  try {
    const response = await fetch('http://localhost:3005/api/foto/photos');
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✓ Photos API working');
      console.log(`  DRs returned: ${data.data.length}`);
      if (data.data.length > 0) {
        console.log(`  Sample DR: ${data.data[0].dr_number}`);
        console.log(`  Photos: ${data.data[0].photos.length}`);
      }
      return true;
    } else {
      console.error('✗ Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('==================================================');
  console.log('FibreFlow Foto Review API Tests');
  console.log('==================================================');
  console.log(`Test DR: ${testDR}`);

  const results = {
    evaluate: await testEvaluateAPI(),
    getEvaluation: await testGetEvaluationAPI(),
    feedback: await testFeedbackAPI(),
    photos: await testPhotosAPI(),
  };

  console.log('\n==================================================');
  console.log('Test Results Summary');
  console.log('==================================================');
  console.log(`Evaluate API:     ${results.evaluate ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Get Evaluation:   ${results.getEvaluation ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Feedback API:     ${results.feedback ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Photos API:       ${results.photos ? '✓ PASS' : '✗ FAIL'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;

  console.log(`\nTotal: ${passed}/${total} tests passed`);
  console.log('==================================================\n');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests();
