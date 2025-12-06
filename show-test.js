const fs = require('fs');
const testNum = process.argv[2] || 96;
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const test = features[testNum - 1];
console.log(`Test #${testNum}:`);
console.log(`Description: ${test.description}`);
console.log(`Steps:`);
test.steps.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
console.log(`Currently passing: ${test.passes}`);
