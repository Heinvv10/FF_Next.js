/**
 * Sidebar Component for App Router
 * Uses usePathname instead of useRouter
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { navItems } from './sidebar/navigationConfig';
import { filterNavigationItems, getSidebarStyles } from './sidebar/sidebarUtils';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { NavigationMenuAppRouter } from './sidebar/NavigationMenuAppRouter';
import { CollapseToggle } from './sidebar/CollapseToggle';
import type { SidebarProps } from './sidebar/types';

export function SidebarAppRouter({ isOpen, isCollapsed, onCollapse }: SidebarProps) {
  const { currentUser, hasPermission } = useAuth();
  const { themeConfig } = useTheme();

  const visibleNavItems = filterNavigationItems(navItems, hasPermission);
  const sidebarStyles = getSidebarStyles(themeConfig);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full shadow-lg transition-all duration-300 z-30 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
        style={{
          backgroundColor: sidebarStyles.backgroundColor,
          borderRight: `1px solid ${sidebarStyles.borderColor}`
        }}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <SidebarHeader
              isCollapsed={isCollapsed}
              currentUser={currentUser}
              sidebarStyles={sidebarStyles}
              themeConfig={themeConfig}
            />

            <NavigationMenuAppRouter
              visibleNavItems={visibleNavItems}
              isCollapsed={isCollapsed}
              sidebarStyles={sidebarStyles}
              themeConfig={themeConfig}
            />
          </nav>

          <CollapseToggle
            isCollapsed={isCollapsed}
            onCollapse={onCollapse}
            sidebarStyles={sidebarStyles}
          />
        </div>
      </aside>
    </>
  );
}
