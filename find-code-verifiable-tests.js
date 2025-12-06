const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

const failing = data.filter(t => !t.passes);

console.log('Potentially Code-Verifiable Tests:\n');

const keywords = ['verify', 'check', 'exists', 'defined', 'implements', 'structure', 'format', 'contains', 'validates'];

failing.forEach((test, idx) => {
  // Check if test might be code-verifiable based on keywords in steps
  const codeVerifiable = test.steps.some(step =>
    keywords.some(keyword => step.toLowerCase().includes(keyword)) &&
    !step.toLowerCase().includes('ssh') &&
    !step.toLowerCase().includes('whatsapp') &&
    !step.toLowerCase().includes('login') &&
    !step.toLowerCase().includes('browser') &&
    !step.toLowerCase().includes('navigate to')
  );

  if (codeVerifiable) {
    console.log(`Test: ${test.description}`);
    console.log(`Steps:`);
    test.steps.forEach((step, sidx) => {
      console.log(`  ${sidx + 1}. ${step}`);
    });
    console.log('');
  }
});
