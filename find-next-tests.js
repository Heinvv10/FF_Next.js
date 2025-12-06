const fs = require('fs');

const tests = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = tests.filter(t => !t.passes);
const functional = failing.filter(t => t.category === 'functional' && t.steps.length <= 6);
const style = failing.filter(t => t.category === 'style');

console.log('Short functional tests (<=6 steps):');
console.log('====================================');
functional.slice(0, 10).forEach((t, i) => {
  console.log(`${i+1}. Test #${t.id}: ${t.description}`);
  console.log(`   Category: ${t.category}, Steps: ${t.steps.length}`);
});

console.log('\nRemaining style tests:');
console.log('======================');
style.slice(0, 10).forEach((t, i) => {
  console.log(`${i+1}. Test #${t.id}: ${t.description}`);
  console.log(`   Category: ${t.category}, Steps: ${t.steps.length}`);
});

console.log(`\nTotal failing: ${failing.length}`);
console.log(`Functional: ${functional.length}, Style: ${style.length}`);
