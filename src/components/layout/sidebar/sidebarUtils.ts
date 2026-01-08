import type { NavSection, SidebarStyles } from './types';
import type { ThemeConfig } from '@/types/theme.types';
import type { Permission } from '@/types/auth.types';

export const filterNavigationItems = (
  navItems: NavSection[], 
  hasPermission: (permission: Permission) => boolean
): NavSection[] => {
  return navItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // If no permissions required, show to all authenticated users
      if (item.permissions.length === 0) return true;
      
      // Check if user has any of the required permissions
      return item.permissions.some(permission => hasPermission(permission));
    })
  })).filter(section => section.items.length > 0); // Remove empty sections
};

/**
 * Find which section contains a route matching the given pathname
 * Used for auto-expanding the active section
 */
export const getSectionForRoute = (pathname: string, sections: NavSection[]): string | null => {
  for (const section of sections) {
    for (const item of section.items) {
      // Exact match or starts with (for nested routes like /staff/123)
      if (pathname === item.to || pathname.startsWith(item.to + '/')) {
        return section.section;
      }
    }
  }
  return null;
};

export const getSidebarStyles = (themeConfig: ThemeConfig): SidebarStyles => {
  const baseStyles = themeConfig.name === 'vf' ? {
    backgroundColor: themeConfig.colors.surface.sidebar || themeConfig.colors.surface.primary,
    borderColor: themeConfig.colors.border.sidebar || themeConfig.colors.border.primary,
    textColor: themeConfig.colors.text.sidebarPrimary || themeConfig.colors.text.primary,
    textColorSecondary: themeConfig.colors.text.sidebarSecondary || themeConfig.colors.text.secondary,
    textColorTertiary: themeConfig.colors.text.sidebarTertiary || themeConfig.colors.text.tertiary
  } : {
    backgroundColor: themeConfig.colors.surface.primary,
    borderColor: themeConfig.colors.border.primary,
    textColor: themeConfig.colors.text.primary,
    textColorSecondary: themeConfig.colors.text.secondary,
    textColorTertiary: themeConfig.colors.text.tertiary
  };

  return baseStyles;
};