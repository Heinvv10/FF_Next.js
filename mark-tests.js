const fs = require('fs');

const testsToMark = process.argv.slice(2).map(n => parseInt(n));

if (testsToMark.length === 0) {
  console.log('Usage: node mark-tests.js <test1> <test2> ...');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync('feature_list.json'));

testsToMark.forEach(testNum => {
  const idx = testNum - 1;
  if (idx >= 0 && idx < data.length) {
    data[idx].passes = true;
    console.log(`✓ Marked test #${testNum} as passing: ${data[idx].description}`);
  } else {
    console.log(`✗ Test #${testNum} not found`);
  }
});

fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));

console.log(`\n✓ Updated feature_list.json`);
console.log(`Total passing: ${data.filter(t => t.passes).length}/${data.length}`);
