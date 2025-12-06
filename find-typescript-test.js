const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const test = data.find(t => t.description.includes('TypeScript files have no errors'));
console.log(JSON.stringify(test, null, 2));
