/**
 * Web Vitals Configuration
 * Defines the Core Web Vitals metrics to display
 */

export const WEB_VITALS_METRICS = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'] as const;

export type WebVitalName = typeof WEB_VITALS_METRICS[number];
