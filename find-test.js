const fs = require('fs');
const tests = JSON.parse(fs.readFileSync('feature_list.json'));
const idx = tests.findIndex(t => t.description.includes('shadcn'));
console.log('Index:', idx);
console.log('Test number:', idx + 1);
console.log('Description:', tests[idx].description);
console.log('Passes:', tests[idx].passes);
