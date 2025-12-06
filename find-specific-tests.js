const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));

const testNumbers = [41, 44, 56, 57, 58, 82, 83, 85, 87, 88];

testNumbers.forEach(num => {
  const test = data[num - 1];
  if (test) {
    console.log(`\nTest #${num}: ${test.description}`);
    console.log(`Category: ${test.category}`);
    console.log(`Passes: ${test.passes}`);
    console.log(`Steps (${test.steps.length}):`);
    test.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  }
});
