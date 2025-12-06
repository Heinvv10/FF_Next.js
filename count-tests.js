const fs = require('fs');
const tests = JSON.parse(fs.readFileSync('feature_list.json'));
console.log('Total tests:', tests.length);
console.log('Passing:', tests.filter(t => t.passes).length);
console.log('Failing:', tests.filter(t => !t.passes).length);
console.log('Percentage:', ((tests.filter(t => t.passes).length / tests.length) * 100).toFixed(1) + '%');
