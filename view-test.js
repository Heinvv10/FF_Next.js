const fs = require('fs');
const testNum = process.argv[2] || 63;
const data = JSON.parse(fs.readFileSync('feature_list.json'));
const test = data[testNum - 1]; // 0-indexed

console.log(`\nTest #${testNum}: ${test.description}`);
console.log(`Category: ${test.category}`);
console.log(`Passes: ${test.passes ? '✓ YES' : '✗ NO'}`);
console.log(`\nSteps:`);
test.steps.forEach((step, i) => console.log(`  ${i + 1}) ${step}`));
console.log();
