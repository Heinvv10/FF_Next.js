const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = features.filter(f => !f.passes);
console.log(`Total failing tests: ${failing.length}\n`);
console.log('Next 20 failing tests:');
console.log('======================\n');
failing.slice(0, 20).forEach((test, idx) => {
  const testId = features.indexOf(test) + 1;
  console.log(`${idx + 1}. Test #${testId}: ${test.description}`);
  console.log(`   Category: ${test.category}, Steps: ${test.steps.length}`);
  console.log('');
});
