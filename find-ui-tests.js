const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

console.log('UI/Visual Failing Tests:\n');

data
  .filter(t => !t.passes && (t.category === 'ui' || t.category === 'visual' || t.category === 'layout'))
  .forEach((t, idx) => {
    console.log(`${idx + 1}. Test: ${t.description}`);
    console.log(`   Category: ${t.category}`);
    console.log(`   Steps: ${t.steps.length}`);
    console.log('');
  });
