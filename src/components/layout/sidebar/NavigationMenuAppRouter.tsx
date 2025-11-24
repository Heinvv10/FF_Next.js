/**
 * Navigation Menu for App Router
 * Uses usePathname instead of useRouter
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavSection, SidebarStyles } from './types';
import type { ThemeConfig } from '@/types/theme.types';

interface NavigationMenuProps {
  visibleNavItems: NavSection[];
  isCollapsed: boolean;
  sidebarStyles: SidebarStyles;
  themeConfig: ThemeConfig;
}

export function NavigationMenuAppRouter({ visibleNavItems, isCollapsed, sidebarStyles, themeConfig }: NavigationMenuProps) {
  const pathname = usePathname();

  return (
    <>
      {visibleNavItems.map((section, idx) => (
        <div key={idx} className={`${isCollapsed ? 'px-2' : 'px-4'} mb-6`}>
          {!isCollapsed && (
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: sidebarStyles.textColorTertiary }}
            >
              {section.section}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.to || pathname?.startsWith(item.to + '/');
              return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center rounded-lg transition-all duration-200 relative group ${
                  isCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2 space-x-3'
                }`}
                style={{
                  backgroundColor: isActive
                    ? themeConfig.colors.primary[500]
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : sidebarStyles.textColorSecondary
                }}
                title={isCollapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  const navLink = e.currentTarget;
                  if (!isActive) {
                    navLink.style.backgroundColor = themeConfig.colors.surface.sidebarSecondary || themeConfig.colors.surface.secondary;
                    navLink.style.color = sidebarStyles.textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  const navLink = e.currentTarget;
                  if (!isActive) {
                    navLink.style.backgroundColor = 'transparent';
                    navLink.style.color = sidebarStyles.textColorSecondary;
                  }
                }}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 ${isCollapsed ? '' : 'w-5 h-5 flex items-center justify-center'}`}
                  style={{ color: 'inherit' }}
                >
                  {item.icon}
                </div>

                {/* Label */}
                {!isCollapsed && (
                  <span className="font-medium text-sm flex-1" style={{ color: 'inherit' }}>
                    {item.label}
                  </span>
                )}

                {/* Notification Badge */}
                {item.badge && !isCollapsed && (
                  <span
                    className="flex items-center justify-center h-5 px-2 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: themeConfig.colors.status.error,
                      color: '#ffffff'
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs
                    rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 pointer-events-none z-50
                  ">
                    {item.label}
                    {item.badge && (
                      <span
                        className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded"
                        style={{
                          backgroundColor: themeConfig.colors.status.error,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )})}
          </div>
        </div>
      ))}
    </>
  );
}
