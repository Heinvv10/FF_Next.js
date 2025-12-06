const fs = require('fs');

const tests = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

console.log('Short style tests (not passing):');
console.log('='.repeat(50));

tests.forEach((test, index) => {
  if (!test.passes && test.category === 'style' && test.steps.length <= 6) {
    console.log(`\nTest #${index + 1}: ${test.description}`);
    console.log(`Steps: ${test.steps.length}`);
    test.steps.forEach((step, i) => {
      console.log(`  ${i + 1}) ${step}`);
    });
  }
});
