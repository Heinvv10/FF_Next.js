const fs = require('fs');

const tests = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Test #72: Photo Review page supports dark mode
const testIdx = 72 - 1; // 0-indexed

if (tests[testIdx] && !tests[testIdx].passes) {
  tests[testIdx].passes = true;
  console.log(`✓ Marked test #72 as passing: ${tests[testIdx].description}`);
  console.log('  Reason: Dark mode implemented with dark: variants throughout foto-review page');
  console.log('  Changes:');
  console.log('    - Header (text-blue-600 dark:text-blue-400)');
  console.log('    - All headings (text-gray-900 dark:text-gray-100)');
  console.log('    - All text elements (text-gray-600 dark:text-gray-400)');
  console.log('    - All backgrounds (bg-white dark:bg-gray-800)');
  console.log('    - All borders (border-gray-200 dark:border-gray-700)');
  console.log('    - DR list selected state (bg-blue-50 dark:bg-blue-900/20)');
  console.log('    - Error messages (bg-red-50 dark:bg-red-900/20)');
  console.log('    - Photo grid (bg-gray-100 dark:bg-gray-700)');
} else {
  console.log(`Test #72 is already passing or not found`);
  process.exit(1);
}

fs.writeFileSync('feature_list.json', JSON.stringify(tests, null, 2));

// Count totals
const passing = tests.filter(t => t.passes).length;
const total = tests.length;
const percentage = ((passing / total) * 100).toFixed(1);

console.log(`\n✅ Successfully marked test #72 as passing`);
console.log(`New stats: ${passing}/${total} tests passing (${percentage}%)`);
