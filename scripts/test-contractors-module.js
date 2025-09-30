#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3007';
const BASE_PATH = '/home/louisdup/VF/Apps/FF_React';

// ANSI color codes for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    console.log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

async function makeRequest(url, options = {}) {
    const { default: http } = await import('http');
    const { URL } = await import('url');
    
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                timeout: 10000,
                headers: options.headers || {}
            };

            const req = http.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const isJson = res.headers['content-type']?.includes('application/json');
                        resolve({
                            success: true,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            data: isJson ? JSON.parse(data) : data,
                            headers: res.headers
                        });
                    } catch (parseError) {
                        resolve({
                            success: true,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            data: data,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });

            req.end();
        } catch (error) {
            resolve({
                success: false,
                error: error.message
            });
        }
    });
}

function checkFileExists(filePath) {
    const fullPath = path.join(BASE_PATH, filePath);
    return fs.existsSync(fullPath);
}

async function testFileStructure() {
    logHeader('File Structure Verification');
    
    const criticalFiles = [
        // Main contractors module files
        'src/modules/contractors/ContractorsDashboard.tsx',
        'pages/contractors.tsx',
        
        // Services
        'src/services/contractorService.ts',
        'src/services/contractor/monitoring/performanceMonitor.ts',
        
        // Documentation
        'src/modules/contractors/docs/CONTRACTORS_MODULE_ANALYSIS.md',
        'src/modules/contractors/docs/API_DOCUMENTATION.md',
        'src/modules/contractors/docs/RAG_SCORING_DOCUMENTATION.md',
        
        // Components
        'src/modules/contractors/components/admin/PerformanceMonitoringDashboard.tsx',
        
        // API routes
        'pages/api/contractors/health.ts',
        'pages/api/contractors/index.ts'
    ];

    let existingFiles = 0;
    for (const file of criticalFiles) {
        if (checkFileExists(file)) {
            logSuccess(`File exists: ${file}`);
            existingFiles++;
        } else {
            logError(`Missing file: ${file}`);
        }
    }
    
    log(`\nFile Structure Summary: ${existingFiles}/${criticalFiles.length} critical files present`, 
        existingFiles === criticalFiles.length ? 'green' : 'yellow');
    
    return existingFiles === criticalFiles.length;
}

async function testAPIEndpoints() {
    logHeader('API Endpoints Testing');
    
    const endpoints = [
        { name: 'Health Check', url: `${BASE_URL}/api/contractors/health`, method: 'GET' },
        { name: 'Contractors List', url: `${BASE_URL}/api/contractors`, method: 'GET' },
        { name: 'Performance Analytics', url: `${BASE_URL}/api/contractors/analytics/performance`, method: 'GET' }
    ];

    let passedTests = 0;
    
    for (const endpoint of endpoints) {
        const result = await makeRequest(endpoint.url, { method: endpoint.method });
        
        if (result.success && result.status < 400) {
            logSuccess(`${endpoint.name}: ${result.status} ${result.statusText}`);
            
            // Special handling for health check
            if (endpoint.name === 'Health Check' && typeof result.data === 'object') {
                log(`  Status: ${result.data.status}`, result.data.status === 'healthy' ? 'green' : 'yellow');
                log(`  Uptime: ${result.data.uptime}s`);
                log(`  Checks: ${result.data.checks?.length || 0} performed`);
            }
            
            passedTests++;
        } else if (result.success) {
            logWarning(`${endpoint.name}: ${result.status} ${result.statusText}`);
        } else {
            logError(`${endpoint.name}: ${result.error}`);
        }
    }
    
    log(`\nAPI Tests Summary: ${passedTests}/${endpoints.length} endpoints accessible`, 
        passedTests > 0 ? 'green' : 'red');
    
    return passedTests > 0;
}

async function testPageAccess() {
    logHeader('Page Access Testing');
    
    const pages = [
        { name: 'Contractors Main Page', url: `${BASE_URL}/contractors` },
        { name: 'Root Page (baseline)', url: `${BASE_URL}/` }
    ];

    let accessiblePages = 0;
    
    for (const page of pages) {
        const result = await makeRequest(page.url);
        
        if (result.success && result.status === 200) {
            logSuccess(`${page.name}: Accessible`);
            
            if (typeof result.data === 'string') {
                const hasReactContent = result.data.includes('__NEXT_DATA__') || 
                                      result.data.includes('_app') ||
                                      result.data.includes('contractors');
                                      
                if (hasReactContent) {
                    log(`  Contains React/Next.js content`, 'green');
                } else {
                    log(`  Basic HTML response`, 'yellow');
                }
            }
            
            accessiblePages++;
        } else if (result.success) {
            logWarning(`${page.name}: ${result.status} ${result.statusText}`);
        } else {
            logError(`${page.name}: ${result.error}`);
        }
    }
    
    log(`\nPage Access Summary: ${accessiblePages}/${pages.length} pages accessible`, 
        accessiblePages > 0 ? 'green' : 'red');
    
    return accessiblePages > 0;
}

async function testDependencies() {
    logHeader('Dependencies Check');
    
    const packageJsonPath = path.join(BASE_PATH, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        logError('package.json not found');
        return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
        '@neondatabase/serverless',
        'next',
        'react',
        '@clerk/nextjs'
    ];
    
    let foundDeps = 0;
    for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            logSuccess(`Dependency found: ${dep}`);
            foundDeps++;
        } else {
            logError(`Missing dependency: ${dep}`);
        }
    }
    
    log(`\nDependencies Summary: ${foundDeps}/${requiredDeps.length} required dependencies found`, 
        foundDeps === requiredDeps.length ? 'green' : 'yellow');
    
    return foundDeps > 0;
}

async function performFullTest() {
    log(`${colors.bold}${colors.magenta}🚀 FibreFlow Contractors Module Test Suite${colors.reset}\n`);
    log(`Testing against: ${BASE_URL}`);
    log(`Base path: ${BASE_PATH}\n`);
    
    const results = {
        fileStructure: await testFileStructure(),
        dependencies: await testDependencies(),
        apiEndpoints: await testAPIEndpoints(),
        pageAccess: await testPageAccess()
    };
    
    // Summary
    logHeader('Test Results Summary');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✓ PASS' : '✗ FAIL';
        const color = passed ? 'green' : 'red';
        log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`, color);
    });
    
    log(`\n${colors.bold}Overall Result: ${passedTests}/${totalTests} test categories passed${colors.reset}`, 
        passedTests === totalTests ? 'green' : passedTests > totalTests / 2 ? 'yellow' : 'red');
    
    if (passedTests === totalTests) {
        log('\n🎉 All tests passed! The contractors module is ready for use.', 'green');
    } else if (passedTests > 0) {
        log('\n⚠️  Some tests passed. The module has basic functionality but may have issues.', 'yellow');
    } else {
        log('\n❌ No tests passed. There are significant issues with the module setup.', 'red');
    }
    
    // Usage instructions
    if (results.pageAccess) {
        logHeader('Next Steps');
        log('1. Open your browser and navigate to:', 'cyan');
        log(`   ${BASE_URL}/contractors`, 'bold');
        log('2. Test the contractors dashboard functionality', 'cyan');
        log('3. Check the API health endpoint:', 'cyan');
        log(`   ${BASE_URL}/api/contractors/health`, 'bold');
        log('4. Monitor server logs for any errors', 'cyan');
    }
}

// Main execution
(async () => {
    try {
        await performFullTest();
    } catch (error) {
        logError(`Test suite failed: ${error.message}`);
        process.exit(1);
    }
})();
