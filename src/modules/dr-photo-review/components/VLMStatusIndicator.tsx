/**
 * VLM Status Indicator Component
 * Shows the status of the AI service
 */

'use client';

import { Cpu, Check, X, Loader2 } from 'lucide-react';
import type { VLMStatus } from '../types';

interface VLMStatusIndicatorProps {
    status: VLMStatus | null;
    isLoading?: boolean;
}

export function VLMStatusIndicator({ status, isLoading }: VLMStatusIndicatorProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Checking AI...</span>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Cpu className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Status Unknown</span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.online
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
        >
            {status.online ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
                className={`text-sm font-medium ${status.online
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
            >
                {status.online ? 'AI Online' : 'AI Offline'}
            </span>
            {status.model && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({status.model})
                </span>
            )}
        </div>
    );
}
