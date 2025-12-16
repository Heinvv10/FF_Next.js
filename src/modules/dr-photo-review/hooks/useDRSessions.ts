/**
 * DR Sessions Hook
 * Manages fetching and state for DR sessions list
 */

import { useState, useEffect, useCallback } from 'react';
import type { DRSession } from '../types';
import * as api from '../services/drPhotoReviewService';

export interface UseDRSessionsReturn {
    sessions: DRSession[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useDRSessions(): UseDRSessionsReturn {
    const [sessions, setSessions] = useState<DRSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.fetchSessions();
            setSessions(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
            setError(message);
            setSessions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        await fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    return {
        sessions,
        isLoading,
        error,
        refresh,
    };
}
