/**
 * Performance Budget Data
 */

import { PerformanceBudgetItem } from '../types/monitoring.types';

export const performanceBudgetItems: PerformanceBudgetItem[] = [
  {
    metric: 'Bundle Size',
    current: '178KB',
    budget: '200KB',
    status: 'pass',
  },
  {
    metric: 'LCP',
    current: '2.1s',
    budget: '2.5s',
    status: 'pass',
  },
  {
    metric: 'FID',
    current: '45ms',
    budget: '100ms',
    status: 'pass',
  },
  {
    metric: 'CLS',
    current: '0.08',
    budget: '0.1',
    status: 'pass',
  },
  {
    metric: 'API Response (p95)',
    current: '218ms',
    budget: '250ms',
    status: 'pass',
  },
];
