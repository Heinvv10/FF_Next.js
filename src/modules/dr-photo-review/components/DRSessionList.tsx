/**
 * DR Session List Component
 * Displays list of DRs with photos in a sidebar
 */

'use client';

import { Search, Camera, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { DRSession } from '../types';

interface DRSessionListProps {
    sessions: DRSession[];
    selectedDR: string | null;
    onSelect: (drNumber: string) => void;
    isLoading: boolean;
    error: string | null;
    onRefresh?: () => void;
}

export function DRSessionList({
    sessions,
    selectedDR,
    onSelect,
    isLoading,
    error,
    onRefresh,
}: DRSessionListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSessions = useMemo(() => {
        if (!searchTerm) return sessions;
        const term = searchTerm.toLowerCase();
        return sessions.filter(
            (s) =>
                s.dr_number.toLowerCase().includes(term) ||
                s.project.toLowerCase().includes(term)
        );
    }, [sessions, searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'needs_review':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        DR Sessions
                    </h2>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label="Refresh sessions"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search DR number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {filteredSessions.length} of {sessions.length} DRs
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">Loading sessions...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="p-8 text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {sessions.length === 0 ? 'No DRs with photos found' : 'No matching DRs'}
                        </p>
                    </div>
                ) : (
                    <nav className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSessions.map((session) => (
                            <button
                                key={session.dr_number}
                                onClick={() => onSelect(session.dr_number)}
                                className={`w-full text-left p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${selectedDR === session.dr_number
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                                        : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {session.dr_number}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                            session.status
                                        )}`}
                                    >
                                        {session.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{session.project}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Step {session.current_step}/11 • {session.steps_completed} completed
                                </p>
                            </button>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
}
