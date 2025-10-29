const fs = require('fs');
const path = require('path');

// Get all route definitions
const routeFiles = [
  'src/app/router/routes/moduleRoutes.tsx',
  'src/app/router/routes/projectRoutes.tsx',
  'src/app/router/routes/procurementRoutes.tsx'
];

const routes = [];
routeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/path:\s*['"]([^'"]+)['"]/g);
  for (const match of matches) {
    routes.push(match[1]);
  }
});

// Get all page files
function getPageFiles(dir, base = '') {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('_') && item !== 'api') {
      files.push(...getPageFiles(fullPath, path.join(base, item)));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      if (!item.startsWith('_') && !item.includes('.test.')) {
        const route = path.join(base, item.replace(/\.(tsx|ts)$/, ''));
        files.push(route === 'index' ? '' : route);
      }
    }
  });

  return files;
}

const pageFiles = getPageFiles('pages');

console.log('=== ROUTE AUDIT ===\n');
console.log('Routes defined in router config:', routes.length);
console.log('Page files in pages/ directory:', pageFiles.length);
console.log('');

// Find routes without pages
const missingPages = routes.filter(route => {
  // Normalize route paths
  const normalized = route.replace(/^\//, '');

  // Skip root route
  if (!normalized) return false;

  // Check if page exists (exact match or dynamic route)
  const exists = pageFiles.some(page => {
    // Exact match
    if (page === normalized) return true;

    // Dynamic route match (e.g., [id] or [slug])
    const pageParts = page.split('/');
    const routeParts = normalized.split('/');

    if (pageParts.length !== routeParts.length) return false;

    return pageParts.every((part, i) => {
      return part === routeParts[i] || part.startsWith('[');
    });
  });

  return !exists;
});

if (missingPages.length > 0) {
  console.log('⚠️  ROUTES WITHOUT PAGE FILES:');
  console.log('================================\n');

  // Group by top-level path
  const grouped = {};
  missingPages.forEach(route => {
    const topLevel = route.split('/')[0] || 'root';
    if (!grouped[topLevel]) grouped[topLevel] = [];
    grouped[topLevel].push(route);
  });

  Object.keys(grouped).sort().forEach(group => {
    console.log(`\n📁 ${group}/`);
    grouped[group].slice(0, 10).forEach(route => {
      console.log(`  ❌ /${route}`);
    });
    if (grouped[group].length > 10) {
      console.log(`  ... and ${grouped[group].length - 10} more`);
    }
  });
} else {
  console.log('✅ All routes have corresponding page files!');
}

console.log(`\n📊 Summary: ${missingPages.length} routes missing page files`);
console.log('\n💡 Tip: These routes are handled by React Router client-side,');
console.log('   but Vercel needs actual page files for proper routing.');
