import { LucideIcon } from 'lucide-react';
import { Permission } from '@/types/auth.types';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  permissions: Permission[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

export interface SidebarStyles {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  textColorSecondary: string;
  textColorTertiary: string;
}

// Track which sections are expanded (section name -> boolean)
export type ExpandedSections = Record<string, boolean>;