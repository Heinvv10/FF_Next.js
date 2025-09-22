/**
 * System section configuration
 */

import { Settings, Download } from 'lucide-react';
import type { NavSection } from './types';

export const systemSection: NavSection = {
  section: 'SYSTEM',
  items: [
    {
      to: '/imports',
      icon: Download,
      label: 'Imports',
      shortLabel: 'Imports',
      permissions: [],
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      shortLabel: 'Settings',
      permissions: [],
    },
  ]
};