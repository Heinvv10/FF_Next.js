/**
 * useMonitoringData Hook
 * Manages data fetching and state for monitoring dashboard
 */

import { useState, useEffect } from 'react';
import { WebVitalMetric, ErrorEvent, SystemHealth } from '../types/monitoring.types';
import { REFRESH_INTERVAL } from '../data/performanceBudgets';

interface MonitoringData {
  webVitals: WebVitalMetric[];
  errors: ErrorEvent[];
  systemHealth: SystemHealth;
  isLoading: boolean;
}

export function useMonitoringData(): MonitoringData {
  const [webVitals, setWebVitals] = useState<WebVitalMetric[]>([]);
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 100,
    lastCheck: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);

        // Fetch Web Vitals
        const vitalsRes = await fetch('/api/analytics/web-vitals/summary');
        if (vitalsRes.ok) {
          const data = await vitalsRes.json();
          setWebVitals(data.metrics || []);
        }

        // Fetch Recent Errors
        const errorsRes = await fetch('/api/analytics/errors/summary');
        if (errorsRes.ok) {
          const data = await errorsRes.json();
          setErrors(data.errors || []);
        }

        // Check System Health
        const healthRes = await fetch('/api/monitoring/health');
        if (healthRes.ok) {
          const data = await healthRes.json();
          setSystemHealth(data.health || systemHealth);
        }
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    webVitals,
    errors,
    systemHealth,
    isLoading,
  };
}
