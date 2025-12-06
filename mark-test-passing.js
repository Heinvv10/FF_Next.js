const fs = require('fs');
const testNum = parseInt(process.argv[2]);
if (!testNum) {
  console.log('Usage: node mark-test-passing.js <test_number>');
  process.exit(1);
}

const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const testIndex = testNum - 1;

if (testIndex < 0 || testIndex >= features.length) {
  console.log(`Test #${testNum} not found`);
  process.exit(1);
}

features[testIndex].passes = true;
fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));

const passing = features.filter(f => f.passes).length;
const total = features.length;
const percentage = ((passing / total) * 100).toFixed(1);

console.log(`✓ Marked Test #${testNum} as passing`);
console.log(`Progress: ${passing}/${total} tests passing (${percentage}%)`);
