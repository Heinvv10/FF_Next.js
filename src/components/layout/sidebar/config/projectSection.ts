/**
 * Project Management section configuration
 */

import {
  CheckCircle,
  BarChart3,
  Camera,
  Cable,
  Droplets,
  FileSignature,
  Home,
  LayoutDashboard
} from 'lucide-react';
import type { NavSection } from './types';

export const projectSection: NavSection = {
  section: 'PROJECT MANAGEMENT',
  items: [
    {
      to: '/projects/dashboard',
      icon: LayoutDashboard,
      label: 'Projects',
      shortLabel: 'Proj',
      permissions: [],
    },
    {
      to: '/pole-capture',
      icon: Camera,
      label: 'Pole Capture',
      shortLabel: 'Poles',
      permissions: [],
    },
    {
      to: '/fiber-stringing',
      icon: Cable,
      label: 'Fiber Stringing',
      shortLabel: 'Fiber',
      permissions: [],
    },
    {
      to: '/drops',
      icon: Droplets,
      label: 'Drops Management',
      shortLabel: 'Drops',
      permissions: [],
    },
    {
      to: '/sow-management',
      icon: FileSignature,
      label: 'SOW Management',
      shortLabel: 'SOW',
      permissions: [],
    },
    {
      to: '/installations',
      icon: Home,
      label: 'Home Installations',
      shortLabel: 'Install',
      permissions: [],
    },
    {
      to: '/tasks',
      icon: CheckCircle,
      label: 'Task Management',
      shortLabel: 'Tasks',
      permissions: [],
    },
    {
      to: '/daily-progress',
      icon: BarChart3,
      label: 'Daily Progress',
      shortLabel: 'Daily',
      permissions: [],
    },
  ]
};