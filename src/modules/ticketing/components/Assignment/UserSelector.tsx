/**
 * UserSelector Component - Staff member dropdown for assignment
 *
 * Features:
 * - Search/filter users by name or email
 * - Shows user role and department
 * - Current assignee highlighted
 * - Clear selection option
 * - Loading and error states
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsersForAssignment } from '../../hooks/useAssignment';
import type { UserDropdownOption } from '../../types/team';

interface UserSelectorProps {
  /** Currently selected user ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (userId: string | null, user?: UserDropdownOption) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string | null;
  /** Show clear button */
  showClear?: boolean;
  /** Compact mode */
  compact?: boolean;
}

export function UserSelector({
  value,
  onChange,
  placeholder = 'Select user...',
  disabled = false,
  error = null,
  showClear = true,
  compact = false,
}: UserSelectorProps) {
  const { users, isLoading, isError } = useUsersForAssignment();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected user
  const selectedUser = useMemo(
    () => users.find((u) => u.id === value),
    [users, value]
  );

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query) ||
        u.department?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (user: UserDropdownOption) => {
    onChange(user.id, user);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
  };

  return (
    <div className="relative space-y-1" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 rounded-lg border transition-all duration-200',
          'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white',
          'hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
          compact ? 'h-9 text-sm' : 'h-10'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <User className={cn('flex-shrink-0 text-gray-500 dark:text-gray-400', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          {selectedUser ? (
            <span className="truncate">{selectedUser.name}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />}
          {showClear && selectedUser && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className={cn(
                  'w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md',
                  'text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                )}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : isError ? (
              <div className="px-3 py-4 text-sm text-red-500 text-center">
                Failed to load users
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchQuery ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    user.id === value && 'bg-blue-50 dark:bg-blue-900/30'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        user.id === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      )}>
                        {user.name}
                      </span>
                      {user.id === value && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">(Current)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{user.email}</span>
                      {user.role && (
                        <>
                          <span>•</span>
                          <span className="truncate">{user.role}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Clear Option */}
          {value && showClear && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Assignment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
