/**
 * Workflow Analytics Types
 */

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export type DateRange = '7d' | '30d' | '90d' | '1y';
