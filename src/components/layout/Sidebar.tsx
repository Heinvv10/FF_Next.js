import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { navItems } from './sidebar/navigationConfig';
import { filterNavigationItems, getSidebarStyles, getSectionForRoute } from './sidebar/sidebarUtils';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { NavigationMenu } from './sidebar/NavigationMenu';
import { CollapseToggle } from './sidebar/CollapseToggle';
import type { SidebarProps, ExpandedSections } from './sidebar/types';

const EXPANDED_SECTIONS_KEY = 'fibreflow-sidebar-expanded-sections';

export function Sidebar({ isOpen, isCollapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, hasPermission } = useAuth();
  const { themeConfig } = useTheme();

  const visibleNavItems = filterNavigationItems(navItems, hasPermission);
  const sidebarStyles = getSidebarStyles(themeConfig);

  // Expanded sections state - initialize empty to prevent hydration mismatch
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});
  const [mounted, setMounted] = useState(false);

  // Load expanded sections from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(EXPANDED_SECTIONS_KEY);
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Persist expanded sections to localStorage (only after mount)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(EXPANDED_SECTIONS_KEY, JSON.stringify(expandedSections));
    }
  }, [expandedSections, mounted]);

  // Auto-expand section containing active route (only after mount)
  useEffect(() => {
    if (mounted && pathname) {
      const activeSection = getSectionForRoute(pathname, visibleNavItems);
      if (activeSection && !expandedSections[activeSection]) {
        setExpandedSections(prev => ({ ...prev, [activeSection]: true }));
      }
    }
  }, [pathname, visibleNavItems, mounted]);

  // Toggle section expanded state
  const handleToggleSection = useCallback((sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  }, []);
  
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
            
            <NavigationMenu
              visibleNavItems={visibleNavItems}
              isCollapsed={isCollapsed}
              sidebarStyles={sidebarStyles}
              themeConfig={themeConfig}
              expandedSections={expandedSections}
              onToggleSection={handleToggleSection}
            />
          </nav>

          <CollapseToggle 
            isCollapsed={isCollapsed}
            onCollapse={onCollapse}
            sidebarStyles={sidebarStyles}
            themeConfig={themeConfig}
          />
        </div>
      </aside>
    </>
  );
}