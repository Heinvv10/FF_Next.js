const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = data.filter(t => !t.passes);

console.log('Failing Tests by Category:\n');

const categories = {};
failing.forEach(t => {
  if (!categories[t.category]) {
    categories[t.category] = [];
  }
  categories[t.category].push(t);
});

Object.keys(categories).sort().forEach(cat => {
  console.log(`${cat.toUpperCase()}: ${categories[cat].length} tests`);
  categories[cat].slice(0, 5).forEach((t, idx) => {
    console.log(`  ${idx + 1}. ${t.description.substring(0, 80)}`);
  });
  if (categories[cat].length > 5) {
    console.log(`  ... and ${categories[cat].length - 5} more`);
  }
  console.log('');
});
