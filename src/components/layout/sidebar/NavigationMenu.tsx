import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import type { NavSection, SidebarStyles, ExpandedSections } from './types';
import type { ThemeConfig } from '@/types/theme.types';

interface NavigationMenuProps {
  visibleNavItems: NavSection[];
  isCollapsed: boolean;
  sidebarStyles: SidebarStyles;
  themeConfig: ThemeConfig;
  expandedSections: ExpandedSections;
  onToggleSection: (sectionName: string) => void;
}

export function NavigationMenu({
  visibleNavItems,
  isCollapsed,
  sidebarStyles,
  themeConfig,
  expandedSections,
  onToggleSection
}: NavigationMenuProps) {
  const pathname = usePathname();

  // When collapsed, render flat list of icons (no sections)
  if (isCollapsed) {
    return (
      <div className="px-2 space-y-1">
        {visibleNavItems.flatMap((section) =>
          section.items.map((item) => {
            const isActive = pathname === item.to || pathname?.startsWith(item.to + '/');
            return (
              <Link key={item.to} href={item.to} passHref legacyBehavior>
                <a
                  className="flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative group"
                  style={{
                    backgroundColor: isActive ? themeConfig.colors.primary[500] : 'transparent',
                    color: isActive ? '#ffffff' : sidebarStyles.textColorSecondary
                  }}
                  title={item.label}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = themeConfig.colors.surface.sidebarSecondary || themeConfig.colors.surface.secondary;
                      e.currentTarget.style.color = sidebarStyles.textColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = sidebarStyles.textColorSecondary;
                    }
                  }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {/* Tooltip */}
                  <div
                    className="absolute left-full ml-2 px-2 py-1 text-sm rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      backgroundColor: themeConfig.colors.surface.elevated,
                      color: themeConfig.colors.text.primary,
                      borderColor: themeConfig.colors.border.primary
                    }}
                  >
                    {item.label}
                  </div>
                </a>
              </Link>
            );
          })
        )}
      </div>
    );
  }

  // Expanded sidebar with collapsible sections
  return (
    <>
      {visibleNavItems.map((section, idx) => {
        const isExpanded = expandedSections[section.section] ?? false;

        return (
          <div key={idx} className="px-4 mb-2">
            {/* Clickable section header */}
            <button
              onClick={() => onToggleSection(section.section)}
              className="flex items-center justify-between w-full px-2 py-2 rounded-lg transition-colors duration-200 hover:bg-[var(--ff-bg-tertiary)]"
              style={{ color: sidebarStyles.textColorTertiary }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                {section.section}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {/* Collapsible items container */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isExpanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.to || pathname?.startsWith(item.to + '/');
                  return (
                    <Link key={item.to} href={item.to} passHref legacyBehavior>
                      <a
                        className="flex items-center px-3 py-2 space-x-3 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: isActive ? themeConfig.colors.primary[500] : 'transparent',
                          color: isActive ? '#ffffff' : sidebarStyles.textColorSecondary
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = themeConfig.colors.surface.sidebarSecondary || themeConfig.colors.surface.secondary;
                            e.currentTarget.style.color = sidebarStyles.textColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = sidebarStyles.textColorSecondary;
                          }
                        }}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}