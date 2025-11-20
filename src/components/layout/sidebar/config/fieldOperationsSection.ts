/**
 * Field Operations section configuration
 */

import { Smartphone, MapPin, Wrench, MessageSquare, Camera, TrendingUp } from 'lucide-react';
import type { NavSection } from './types';

export const fieldOperationsSection: NavSection = {
  section: 'FIELD OPERATIONS',
  items: [
    {
      to: '/field',
      icon: Smartphone,
      label: 'Field App Portal',
      shortLabel: 'Field',
      permissions: [],
    },
    {
      to: '/onemap',
      icon: MapPin,
      label: 'OneMap Data Grid',
      shortLabel: 'OneMap',
      permissions: [],
    },
    {
      to: '/nokia-equipment',
      icon: Wrench,
      label: 'Nokia Equipment',
      shortLabel: 'Nokia',
      permissions: [],
    },
    {
      to: '/wa-monitor',
      icon: MessageSquare,
      label: 'WA Monitor',
      shortLabel: 'WA',
      permissions: [],
    },
    {
      to: '/marketing-activations',
      icon: TrendingUp,
      label: 'Marketing Activations',
      shortLabel: 'Marketing',
      permissions: [],
    },
    {
      to: '/foto-reviews',
      icon: Camera,
      label: 'Foto Reviews',
      shortLabel: 'Foto',
      permissions: [],
    },
  ]
};