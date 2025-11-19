// ============= Procurement Overview Types =============

import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: string;
}

export interface ModuleMetric {
  label: string;
  value: number | string;
  format: 'number' | 'currency' | 'percentage';
  status?: 'success' | 'warning' | 'error' | 'info';
}

export interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
  targetTab: string;
  permission: string;
  metrics: ModuleMetric[];
  quickActions: QuickAction[];
}

export interface ProjectStats {
  boq: {
    total: number;
    draft: number;
    approved: number;
    totalValue: number;
  };
  rfq: {
    total: number;
    sent: number;
    responsesReceived: number;
    awarded: number;
  };
}

export interface BOQItem {
  id: string;
  title: string;
  version: string;
  totalEstimatedValue?: number;
}

export interface RFQItem {
  id: string;
  title: string;
  rfqNumber: string;
  invitedSuppliers?: string[];
}
