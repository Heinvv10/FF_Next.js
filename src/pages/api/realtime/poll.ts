/**
 * Real-time Polling API
 * Provides fallback mechanism for real-time updates when WebSocket is not available
 * API Route: /api/realtime/poll
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

interface PollRequest {
  clientId: string;
  since?: string;
  entityTypes?: string[];
}

interface PollResponse {
  success: boolean;
  changes: any[];
  lastChecked: string;
  message?: string;
}

// Mock database changes storage (in production, this would query your actual database)
const mockChanges: any[] = [
  // Example changes - in production these would come from your database change tracking
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PollResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      changes: [],
      lastChecked: new Date().toISOString(),
      message: 'Method not allowed'
    });
  }

  try {
    const { clientId, since, entityTypes } = req.query as PollRequest;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        changes: [],
        lastChecked: new Date().toISOString(),
        message: 'Client ID is required'
      });
    }

    // For now, return empty changes (in production, you would query your database)
    // This is a fallback mechanism that simulates real-time updates via polling
    const changes = [];
    const lastChecked = new Date().toISOString();

    // In a real implementation, you would:
    // 1. Query your database for changes since the last poll time
    // 2. Filter by entity types if specified
    // 3. Return the changes in a standardized format

    log.info('Real-time poll completed', {
      clientId,
      since,
      entityTypes,
      changesCount: changes.length
    }, 'RealtimePollAPI');

    return res.status(200).json({
      success: true,
      changes,
      lastChecked,
      message: 'No new changes'
    });

  } catch (error) {
    log.error('Real-time poll failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query
    }, 'RealtimePollAPI');

    return res.status(500).json({
      success: false,
      changes: [],
      lastChecked: new Date().toISOString(),
      message: 'Failed to poll for changes'
    });
  }
}

// Helper function to add a mock change (for testing)
export function addMockChange(change: any): void {
  mockChanges.push({
    ...change,
    timestamp: new Date().toISOString(),
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
}

// Helper function to get changes since a specific time
export function getChangesSince(since: string, entityTypes?: string[]): any[] {
  const sinceDate = new Date(since);

  return mockChanges.filter(change => {
    const changeDate = new Date(change.timestamp);

    // Filter by time
    if (changeDate <= sinceDate) return false;

    // Filter by entity types if specified
    if (entityTypes && entityTypes.length > 0) {
      return entityTypes.includes(change.entity_type);
    }

    return true;
  });
}