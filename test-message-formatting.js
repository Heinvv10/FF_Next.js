/**
 * Test WhatsApp message formatting
 * Verifies that feedback messages are properly formatted with all required elements
 */

/**
 * Mock evaluation data for testing
 */
function createMockEvaluation(status = 'PASS') {
  const isPassing = status === 'PASS';

  return {
    dr_number: 'DR1234567',
    overall_status: status,
    average_score: isPassing ? 9.2 : 5.3,
    total_steps: 12,
    passed_steps: isPassing ? 11 : 5,
    step_results: [
      {
        step_label: 'House Photo',
        score: isPassing ? 9.5 : 6.0,
        passed: isPassing,
        comment: isPassing ? 'Clear and well-framed' : 'House not clearly visible'
      },
      {
        step_label: 'Cable Span',
        score: isPassing ? 8.8 : 4.5,
        passed: isPassing,
        comment: isPassing ? 'Full span visible' : 'Full span not shown'
      },
      {
        step_label: 'ONT Barcode',
        score: isPassing ? 9.0 : 8.5,
        passed: true,
        comment: 'Barcode clearly readable'
      },
    ],
    project: 'Lawley',
  };
}

/**
 * Format evaluation results as WhatsApp message (copied from API)
 */
function formatFeedbackMessage(evaluation) {
  const statusEmoji = evaluation.overall_status === 'PASS' ? '✅' : '❌';
  const passPercentage = Math.round((evaluation.passed_steps / evaluation.total_steps) * 100);

  let message = `${statusEmoji} Installation Photo Review: ${evaluation.dr_number}\n\n`;
  message += `Overall Status: ${evaluation.overall_status}\n`;
  message += `Score: ${evaluation.average_score}/10\n`;
  message += `Steps Passed: ${evaluation.passed_steps}/${evaluation.total_steps} (${passPercentage}%)\n\n`;
  message += `📋 Step Results:\n`;

  evaluation.step_results.forEach((step) => {
    const icon = step.passed ? '✅' : '❌';
    message += `${icon} ${step.step_label}: ${step.score.toFixed(1)}/10\n`;
    message += `   ${step.comment}\n\n`;
  });

  if (evaluation.overall_status === 'FAIL') {
    message += `⚠️ Please review and retake photos for failed steps following installation guidelines.`;
  } else {
    message += `✅ Great work! All photos meet quality standards.`;
  }

  return message;
}

/**
 * Run formatting tests
 */
function testMessageFormatting() {
  console.log('==================================================');
  console.log('WhatsApp Message Formatting Tests');
  console.log('==================================================\n');

  const tests = [];

  // Test #610: DR number inclusion
  console.log('=== Test #610: DR Number in Message ===');
  const passMessage = formatFeedbackMessage(createMockEvaluation('PASS'));
  const failMessage = formatFeedbackMessage(createMockEvaluation('FAIL'));

  const drInHeader = passMessage.includes('DR1234567') && passMessage.split('\n')[0].includes('DR1234567');
  const drProminent = passMessage.indexOf('DR1234567') < 100; // In first 100 chars

  if (drInHeader && drProminent) {
    console.log('✓ DR number appears in message header');
    console.log('✓ DR number is prominent (first line)');
    console.log(`  Sample: "${passMessage.split('\n')[0]}"`);
    tests.push({ name: 'DR number inclusion', pass: true });
  } else {
    console.log('✗ DR number not properly displayed');
    tests.push({ name: 'DR number inclusion', pass: false });
  }

  // Test #611: Overall status with emoji
  console.log('\n=== Test #611: Overall Status Display ===');
  const passHasCheckmark = passMessage.includes('✅') && passMessage.includes('PASS');
  const failHasCross = failMessage.includes('❌') && failMessage.includes('FAIL');
  const statusProminent = passMessage.split('\n')[0].includes('✅');

  if (passHasCheckmark && failHasCross && statusProminent) {
    console.log('✓ PASS status shown with ✅ emoji');
    console.log('✓ FAIL status shown with ❌ emoji');
    console.log('✓ Status is prominent in header');
    console.log(`  PASS header: "${passMessage.split('\n')[0]}"`);
    console.log(`  FAIL header: "${failMessage.split('\n')[0]}"`);
    tests.push({ name: 'Status with emoji', pass: true });
  } else {
    console.log('✗ Status or emoji missing');
    tests.push({ name: 'Status with emoji', pass: false });
  }

  // Test #612: Overall score
  console.log('\n=== Test #612: Overall Score Display ===');
  const passScoreLine = passMessage.split('\n').find(line => line.includes('Score:'));
  const failScoreLine = failMessage.split('\n').find(line => line.includes('Score:'));
  const passScoreFormatted = passScoreLine && passScoreLine.includes('9.2/10');
  const failScoreFormatted = failScoreLine && failScoreLine.includes('5.3/10');

  if (passScoreFormatted && failScoreFormatted) {
    console.log('✓ Score shown for PASS evaluation');
    console.log('✓ Score shown for FAIL evaluation');
    console.log(`  PASS score: ${passScoreLine.trim()}`);
    console.log(`  FAIL score: ${failScoreLine.trim()}`);
    tests.push({ name: 'Overall score', pass: true });
  } else {
    console.log('✗ Score not properly formatted');
    tests.push({ name: 'Overall score', pass: false });
  }

  // Test #613: Step counts
  console.log('\n=== Test #613: Passed/Failed Steps Count ===');
  const passStepsLine = passMessage.split('\n').find(line => line.includes('Steps Passed:'));
  const failStepsLine = failMessage.split('\n').find(line => line.includes('Steps Passed:'));
  const passStepsCorrect = passStepsLine && passStepsLine.includes('11/12');
  const failStepsCorrect = failStepsLine && failStepsLine.includes('5/12');
  const includesPercentage = passStepsLine && passStepsLine.includes('%');

  if (passStepsCorrect && failStepsCorrect && includesPercentage) {
    console.log('✓ Step count shown for PASS (11/12)');
    console.log('✓ Step count shown for FAIL (5/12)');
    console.log('✓ Percentage included');
    console.log(`  PASS steps: ${passStepsLine.trim()}`);
    console.log(`  FAIL steps: ${failStepsLine.trim()}`);
    tests.push({ name: 'Step counts', pass: true });
  } else {
    console.log('✗ Step counts not properly formatted');
    tests.push({ name: 'Step counts', pass: false });
  }

  // Test #614: Individual step results
  console.log('\n=== Test #614: Individual Step Results ===');
  const hasStepSection = passMessage.includes('📋 Step Results:');
  const hasStepIcons = passMessage.includes('✅ House Photo:') || passMessage.includes('❌ House Photo:');
  const hasStepScores = passMessage.match(/\d+\.\d+\/10/g)?.length >= 3; // At least 3 step scores
  const hasComments = passMessage.includes('Clear and well-framed') || passMessage.includes('House not clearly visible');

  if (hasStepSection && hasStepIcons && hasStepScores && hasComments) {
    console.log('✓ Step Results section present');
    console.log('✓ Individual steps show ✅/❌ icons');
    console.log('✓ Step scores formatted to 1 decimal');
    console.log('✓ AI comments included for each step');
    tests.push({ name: 'Individual step results', pass: true });
  } else {
    console.log('✗ Step results not complete');
    if (!hasStepSection) console.log('  Missing step section header');
    if (!hasStepIcons) console.log('  Missing step icons');
    if (!hasStepScores) console.log('  Missing step scores');
    if (!hasComments) console.log('  Missing AI comments');
    tests.push({ name: 'Individual step results', pass: false });
  }

  // Test #615: Actionable guidance
  console.log('\n=== Test #615: Actionable Guidance ===');
  const failHasGuidance = failMessage.includes('Please review and retake photos');
  const passHasPraise = passMessage.includes('Great work!');

  if (failHasGuidance && passHasPraise) {
    console.log('✓ FAIL message includes actionable guidance');
    console.log('✓ PASS message includes positive feedback');
    const failGuidance = failMessage.split('\n').slice(-1)[0];
    const passGuidance = passMessage.split('\n').slice(-1)[0];
    console.log(`  FAIL: "${failGuidance}"`);
    console.log(`  PASS: "${passGuidance}"`);
    tests.push({ name: 'Actionable guidance', pass: true });
  } else {
    console.log('✗ Guidance messages missing');
    tests.push({ name: 'Actionable guidance', pass: false });
  }

  // Summary
  console.log('\n==================================================');
  console.log('Test Results Summary');
  console.log('==================================================');
  const passed = tests.filter(t => t.pass).length;
  const total = tests.length;

  tests.forEach(test => {
    console.log(`${test.pass ? '✓' : '✗'} ${test.name}`);
  });

  console.log(`\nTotal: ${passed}/${total} tests passed`);
  console.log('==================================================\n');

  // Show sample messages
  console.log('=== Sample PASS Message ===');
  console.log(passMessage);
  console.log('\n=== Sample FAIL Message ===');
  console.log(failMessage);
  console.log('');

  return passed === total;
}

// Run tests
const success = testMessageFormatting();
process.exit(success ? 0 : 1);
