Analyzing codebase in: src
# Technical Debt Analysis Report
**Generated:** 2025-11-18 12:51:10
## Summary
- **Files Analyzed:** 1614- **Total Lines:** 222479- **Total Issues:** 4611
### Issues by Severity
- **HIGH:** 375- **MEDIUM:** 1906- **LOW:** 2330
## Large Files (161 issues)
### High Priority
- **modules/procurement/ProcurementOverview.tsx**: File has 587 lines (FibreFlow standard: < 300)
- **modules/sow/ImportsDataGridPage.tsx**: File has 590 lines (FibreFlow standard: < 300)
- **modules/suppliers/components/tabs/CompanyProfileTab.tsx**: File has 570 lines (FibreFlow standard: < 300)
- **modules/suppliers/components/tabs/DocumentsTab.tsx**: File has 547 lines (FibreFlow standard: < 300)
- **modules/suppliers/components/tabs/MessagesTab.tsx**: File has 559 lines (FibreFlow standard: < 300)
- **modules/procurement/suppliers/SupplierPortalPage.tsx**: File has 1041 lines (FibreFlow standard: < 300)
- **modules/procurement/stock/StockManagementPage.tsx**: File has 784 lines (FibreFlow standard: < 300)
- **modules/procurement/orders/components/POCreateModal.tsx**: File has 714 lines (FibreFlow standard: < 300)
- **modules/procurement/orders/components/PODetailModal.tsx**: File has 579 lines (FibreFlow standard: < 300)
- **modules/procurement/suppliers/components/QuoteSubmissionModal.tsx**: File has 643 lines (FibreFlow standard: < 300)

_... and 27 more_
### Medium Priority
- **lodashReplacement.ts**: File has 472 lines (FibreFlow standard: < 300)
- **excel/xlsxMigrationHelper.ts**: File has 312 lines (FibreFlow standard: < 300)
- **excel/secureExcelProcessor.ts**: File has 423 lines (FibreFlow standard: < 300)
- **pages/monitoring.tsx**: File has 426 lines (FibreFlow standard: < 300)
- **pages/StaffDetail.tsx**: File has 309 lines (FibreFlow standard: < 300)
- **pages/MigrationStatus.tsx**: File has 336 lines (FibreFlow standard: < 300)
- **performance/imageOptimization.tsx**: File has 351 lines (FibreFlow standard: < 300)
- **performance/performanceMonitor.ts**: File has 421 lines (FibreFlow standard: < 300)
- **types/theme.types.ts**: File has 378 lines (FibreFlow standard: < 300)
- **lib/queryPerformance.ts**: File has 384 lines (FibreFlow standard: < 300)

_... and 114 more_

## Complex Functions (351 issues)
### High Priority
- **components/ErrorBoundary.tsx**: Function "render" has complexity 9 and 102 lines
- **pages/Settings.tsx**: Function "Settings" has complexity 13 and 185 lines
- **pages/Settings.tsx**: Function "renderTabContent" has complexity 12 and 134 lines
- **pages/Settings.tsx**: Function "Settings" has complexity 13 and 185 lines
- **pages/Settings.tsx**: Function "switch" has complexity 12 and 132 lines
- **pages/Dashboard.tsx**: Function "Dashboard" has complexity 16 and 215 lines
- **pages/Dashboard.tsx**: Function "Dashboard" has complexity 16 and 215 lines
- **pages/monitoring.tsx**: Function "MonitoringDashboard" has complexity 23 and 393 lines
- **pages/monitoring.tsx**: Function "MonitoringDashboard" has complexity 23 and 393 lines
- **pages/ClientDetail.tsx**: Function "ClientDetail" has complexity 8 and 121 lines

_... and 193 more_
### Medium Priority
- **components/ErrorBoundary.tsx**: Function "if" has complexity 8 and 98 lines
- **excel/secureExcelProcessor.ts**: Function "if" has complexity 15 and 47 lines
- **excel/secureExcelProcessor.ts**: Function "for" has complexity 13 and 44 lines
- **pages/StaffForm.tsx**: Function "StaffForm" has complexity 6 and 89 lines
- **pages/StaffForm.tsx**: Function "StaffForm" has complexity 6 and 89 lines
- **performance/hotReloadOptimizer.ts**: Function "if" has complexity 12 and 37 lines
- **hooks/useCommunications.ts**: Function "useCommunications" has complexity 11 and 72 lines
- **hooks/useCommunications.ts**: Function "useCommunications" has complexity 11 and 72 lines
- **hooks/useGlobalSearch.ts**: Function "useGlobalSearch" has complexity 13 and 86 lines
- **hooks/useGlobalSearch.ts**: Function "useGlobalSearch" has complexity 13 and 86 lines

_... and 138 more_

## Technical Debt Markers (223 issues)
### High Priority
- **performance/hotReloadOptimizer.ts** (line 276): BUG comment found
- **performance/cssPerformanceMonitor.ts** (line 240): BUG comment found
- **performance/performanceMonitor.ts** (line 381): BUG comment found
- **performance/performanceMonitor.ts** (line 404): BUG comment found
- **lib/errorTracking.ts** (line 11): BUG comment found
- **lib/apiResponse.ts** (line 273): BUG comment found
- **lib/apiResponse.ts** (line 293): BUG comment found
- **app/router/index.tsx** (line 59): BUG comment found
- **services/staff/import/csvProcessor.ts** (line 38): BUG comment found
- **services/staff/import/rowProcessor.ts** (line 43): BUG comment found

_... and 6 more_
### Low Priority
- **components/ErrorBoundary.tsx** (line 34): TODO comment found
- **pages/StaffList.tsx** (line 44): TODO comment found
- **hooks/useCommunications.ts** (line 21): TODO comment found
- **hooks/useProjects.ts** (line 54): TODO comment found
- **types/index.ts** (line 34): TODO comment found
- **utils/constants.ts** (line 23): TODO comment found
- **utils/constants.ts** (line 37): TODO comment found
- **utils/constants.ts** (line 46): TODO comment found
- **contexts/AuthContext.tsx** (line 52): TODO comment found
- **contexts/AuthContext.tsx** (line 90): TODO comment found

_... and 197 more_

## Console Statements (204 issues)
### Low Priority
- **services/firebaseStorageService.ts** (line 50): Console statement left in code
  ```
  console.error('Firebase upload error:', error);
  ```
- **services/firebaseStorageService.ts** (line 64): Console statement left in code
  ```
  console.error('Firebase delete error:', error);
  ```
- **config/firebase-admin.ts** (line 50): Console statement left in code
  ```
  console.log('✅ Firebase Admin SDK initialized successfully');
  ```
- **config/firebase-admin.ts** (line 54): Console statement left in code
  ```
  console.error('❌ Firebase Admin SDK initialization failed:', error);
  ```
- **config/firebase.ts** (line 60): Console statement left in code
  ```
  console.warn('Firebase persistence failed: Multiple tabs open');
  ```
- **config/firebase.ts** (line 63): Console statement left in code
  ```
  console.warn('Firebase persistence not available in this browser');
  ```
- **config/firebase.ts** (line 82): Console statement left in code
  ```
  console.log('🔧 Connected to Firebase emulators (Firestore & Storage only)');
  ```
- **config/firebase.ts** (line 85): Console statement left in code
  ```
  console.debug('Firebase emulators connection skipped:', error);
  ```
- **pages/monitoring.tsx** (line 67): Console statement left in code
  ```
  console.error('Failed to fetch monitoring data:', error);
  ```
- **hooks/useGlobalSearch.ts** (line 59): Console statement left in code
  ```
  console.error('Search error:', err);
  ```

_... and 194 more_

## Weak Typing (1095 issues)
### Medium Priority
- **lodashReplacement.ts** (line 11): Using "any" type reduces type safety
  ```
  export function debounce<T extends (...args: any[]) => any>(
  ```
- **lodashReplacement.ts** (line 79): Using "any" type reduces type safety
  ```
  let lastThis: any;
  ```
- **lodashReplacement.ts** (line 99): Using "any" type reduces type safety
  ```
  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
  ```
- **lodashReplacement.ts** (line 132): Using "any" type reduces type safety
  ```
  export function throttle<T extends (...args: any[]) => any>(
  ```
- **lodashReplacement.ts** (line 184): Using "any" type reduces type safety
  ```
  export function isEqual(a: any, b: any): boolean {
  ```
- **lodashReplacement.ts** (line 302): Using "any" type reduces type safety
  ```
  export function flattenDeep(array: any[]): any[] {
  ```
- **lodashReplacement.ts** (line 303): Using "any" type reduces type safety
  ```
  const result: any[] = [];
  ```
- **lodashReplacement.ts** (line 404): Using "any" type reduces type safety
  ```
  static trackPerformance<T extends (...args: any[]) => any>(
  ```
- **services/projectsService.ts** (line 144): Using "any" type reduces type safety
  ```
  async getStats(): Promise<any> {
  ```
- **excel/xlsxMigrationHelper.ts** (line 20): Using "any" type reduces type safety
  ```
  options: any = {}
  ```

_... and 1085 more_

## Long Parameter Lists (166 issues)
### High Priority
- **performance/imageOptimization.tsx** (line 148): Function has 10 parameters (should be < 5)
- **shared/components/ui/Button.tsx** (line 11): Function has 9 parameters (should be < 5)
- **lib/security/secure-xlsx.ts** (line 140): Function has 9 parameters (should be < 5)
- **lib/validation/boq.schemas.ts** (line 143): Function has 8 parameters (should be < 5)
- **lib/schemas/domains/clients.ts** (line 45): Function has 11 parameters (should be < 5)
- **lib/schemas/domains/projects.ts** (line 96): Function has 8 parameters (should be < 5)
- **lib/schemas/common/index.ts** (line 116): Function has 8 parameters (should be < 5)
- **lib/utils/boq/export.ts** (line 32): Function has 17 parameters (should be < 5)
- **app/router/index.tsx** (line 17): Function has 8 parameters (should be < 5)
- **modules/analytics/AnalyticsDashboard.tsx** (line 50): Function has 11 parameters (should be < 5)

_... and 55 more_
### Medium Priority
- **services/neonServiceAPI.ts** (line 22): Function has 6 parameters (should be < 5)
- **performance/imageOptimization.tsx** (line 25): Function has 6 parameters (should be < 5)
- **performance/imageOptimization.tsx** (line 113): Function has 7 parameters (should be < 5)
- **lib/firebase-api.ts** (line 27): Function has 6 parameters (should be < 5)
- **shared/components/ui/Progress.tsx** (line 11): Function has 6 parameters (should be < 5)
- **shared/components/ui/Checkbox.tsx** (line 10): Function has 6 parameters (should be < 5)
- **shared/components/ui/Tabs.tsx** (line 19): Function has 6 parameters (should be < 5)
- **lib/validation/boq.schemas.ts** (line 75): Function has 7 parameters (should be < 5)
- **lib/validation/rfq.schemas.ts** (line 19): Function has 6 parameters (should be < 5)
- **lib/validation/rfq.schemas.ts** (line 22): Function has 6 parameters (should be < 5)

_... and 91 more_

## Deep Nesting (492 issues)
### High Priority
- **excel/secureExcelProcessor.ts** (line 169): Nesting depth of 7 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 173): Nesting depth of 8 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 175): Nesting depth of 9 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 176): Nesting depth of 10 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 178): Nesting depth of 11 (should be < 4)
- **performance/cssPerformanceMonitor.ts** (line 93): Nesting depth of 7 (should be < 4)
- **performance/cssPerformanceMonitor.ts** (line 95): Nesting depth of 8 (should be < 4)
- **lib/security/secure-xlsx.ts** (line 107): Nesting depth of 7 (should be < 4)
- **lib/security/secure-xlsx.ts** (line 109): Nesting depth of 8 (should be < 4)
- **modules/procurement/ProcurementOverview.tsx** (line 318): Nesting depth of 7 (should be < 4)

_... and 44 more_
### Medium Priority
- **lodashReplacement.ts** (line 270): Nesting depth of 5 (should be < 4)
- **App.tsx** (line 19): Nesting depth of 5 (should be < 4)
- **App.tsx** (line 30): Nesting depth of 6 (should be < 4)
- **services/neonServiceAPI.ts** (line 24): Nesting depth of 5 (should be < 4)
- **services/projectsService.ts** (line 80): Nesting depth of 5 (should be < 4)
- **excel/xlsxMigrationHelper.ts** (line 28): Nesting depth of 5 (should be < 4)
- **excel/xlsxMigrationHelper.ts** (line 52): Nesting depth of 6 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 150): Nesting depth of 5 (should be < 4)
- **excel/secureExcelProcessor.ts** (line 154): Nesting depth of 6 (should be < 4)
- **pages/Settings.tsx** (line 44): Nesting depth of 6 (should be < 4)

_... and 428 more_

## Magic Numbers (1919 issues)
### Low Priority
- **App.tsx** (line 83): Magic number 4000 should be a named constant
  ```
  duration: 4000,
  ```
- **services/firebaseStorageService.ts** (line 109): Magic number 1024 should be a named constant
  ```
  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
  ```
- **services/projectsService.ts** (line 65): Magic number 404 should be a named constant
  ```
  if (response.status === 404) return null;
  ```
- **excel/xlsxMigrationHelper.ts** (line 157): Magic number 65 should be a named constant
  ```
  colStr = String.fromCharCode(65 + (c % 26)) + colStr;
  ```
- **excel/xlsxMigrationHelper.ts** (line 158): Magic number 26 should be a named constant
  ```
  c = Math.floor(c / 26) - 1;
  ```
- **excel/xlsxMigrationHelper.ts** (line 185): Magic number 26 should be a named constant
  ```
  col = col * 26 + (colStr.charCodeAt(i) - 64);
  ```
- **excel/secureExcelProcessor.ts** (line 12): Magic number 100000 should be a named constant
  ```
  const MAX_ROWS = 100000;
  ```
- **excel/secureExcelProcessor.ts** (line 14): Magic number 10000 should be a named constant
  ```
  const MAX_CELL_LENGTH = 10000;
  ```
- **excel/secureExcelProcessor.ts** (line 55): Magic number 1024 should be a named constant
  ```
  throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
  ```
- **excel/secureExcelProcessor.ts** (line 57): Magic number 1024 should be a named constant
  ```
  log.info(`File size validation passed: ${Math.round(buffer.byteLength / 1024)}KB`,
  ```

_... and 1909 more_


# Dependency Analysis Report
**Package:** fibreflow-react**Dependencies:** 50**Dev Dependencies:** 34**Total Issues:** 2
## Summary
- **MEDIUM:** 1- **LOW:** 1
## Duplicate Functionality (1)
### Unknown [MEDIUM]
Multiple packages for HTTP client: axios, node-fetch
- Affected packages: axios, node-fetch

## Version Constraint Warnings (1)
### next [LOW]
Using exact version "14.2.18" - consider using ^ or ~ for flexibility
- Current version: `14.2.18`

## Recommendations
1. Update deprecated packages to modern alternatives
2. Consolidate duplicate functionality to reduce bundle size
3. Run `npm audit` or `yarn audit` to check for security vulnerabilities
4. Consider running `npm outdated` to check for available updates
5. Use `depcheck` or similar tools to find unused dependencies

