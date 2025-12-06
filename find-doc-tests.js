const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = data.filter(t => !t.passes);

console.log('Documentation/Code Quality Tests:\n');

const keywords = ['README', 'documented', 'comments', 'JSDoc', 'lint', 'import', 'console.log', 'alt text', 'labels'];

failing.forEach((test) => {
  const isDocTest = keywords.some(keyword =>
    test.description.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isDocTest) {
    console.log(`Test: ${test.description}`);
    console.log(`Steps:`);
    test.steps.forEach((step, sidx) => {
      console.log(`  ${sidx + 1}. ${step}`);
    });
    console.log('');
  }
});
