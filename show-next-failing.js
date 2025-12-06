const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = data.filter(t => !t.passes);

console.log(`Total failing: ${failing.length}\n`);

// Show first 10 failing tests with full details
failing.slice(0, 10).forEach((test, idx) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test ${idx + 1}: ${test.description}`);
  console.log(`Category: ${test.category}`);
  console.log(`\nSteps:`);
  test.steps.forEach((step, stepIdx) => {
    console.log(`  ${stepIdx + 1}. ${step}`);
  });
});
