const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json'));
const failing = data.filter(f => !f.passes).slice(0, 15);

failing.forEach((test, i) => {
  const testNum = data.indexOf(test) + 1;
  console.log(`\n${i + 1}. Test #${testNum}: ${test.description}`);
  console.log(`   Category: ${test.category}`);
  console.log(`   Steps: ${test.steps.length}`);
  if (test.steps.length <= 5) {
    test.steps.forEach((step, j) => console.log(`   ${j + 1}) ${step}`));
  }
});

console.log(`\n\nTotal failing: ${data.filter(f => !f.passes).length}`);
console.log(`Total passing: ${data.filter(f => f.passes).length}`);
