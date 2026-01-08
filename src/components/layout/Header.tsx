import { ClerkHeader } from "./ClerkHeader";
import { RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { HeaderProps, Notification } from './header/HeaderTypes';
import { BreadcrumbNavigation } from './header/BreadcrumbNavigation';
import { SearchBar } from './header/SearchBar';
import { NotificationsDropdown } from './header/NotificationsDropdown';

export function Header({ 
  title = 'Dashboard', 
  breadcrumbs = ['Home'],
  actions,
  showSearch = true,
  onMenuClick,
  user
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState<Notification[]>([
    { id: 1, title: 'New project assigned', time: '5 min ago', unread: true },
    { id: 2, title: 'Staff member added', time: '1 hour ago', unread: true },
    { id: 3, title: 'Report generated', time: '2 hours ago', unread: false },
  ]);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[var(--ff-surface-primary)] border-b border-[var(--ff-border-primary)] shadow-sm">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <BreadcrumbNavigation 
            breadcrumbs={breadcrumbs}
            title={title}
            {...(onMenuClick && { onMenuClick })}
          />

          {/* Center - Actions */}
          {actions && (
            <div className="hidden lg:flex items-center space-x-2 mx-4">
              {actions}
            </div>
          )}

          {/* Right side - Search + Theme + Notifications + User */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {showSearch && (
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            <div className="h-8 w-px bg-[var(--ff-border-primary)] hidden lg:block" />

            <ThemeToggle />

            <NotificationsDropdown
              notifications={notifications}
              showNotifications={showNotifications}
              onToggleNotifications={() => setShowNotifications(!showNotifications)}
              notificationRef={notificationRef}
            />

            {/* Clerk UserButton replaces the custom user menu */}
            <ClerkHeader />
          </div>
        </div>
      </div>
    </header>
  );
}
