/**
 * QContact Sync Status API Route
 * 🟢 WORKING: Production-ready API endpoint for retrieving sync status
 *
 * GET /api/ticketing/sync/qcontact/status - Get current sync status and statistics
 *
 * Features:
 * - Current sync progress (last 24 hours)
 * - Success rate calculation
 * - Failed sync count
 * - Total sync operations
 * - Proper error handling with standard API responses
 * - Follows Zero Tolerance protocol (no console.log, proper error handling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getSyncProgress } from '@/modules/ticketing/services/qcontactSyncOrchestrator';
import { query, queryOne } from '@/modules/ticketing/utils/db';

const logger = createLogger('ticketing:api:sync:status');

// ==================== GET /api/ticketing/sync/qcontact/status ====================

/**
 * 🟢 WORKING: Get sync status and statistics
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug('Fetching sync status');

    // Get sync progress (last 24 hours)
    const progress = await getSyncProgress();

    // Get last sync details
    const lastSyncSql = `
      SELECT
        synced_at,
        status,
        sync_type,
        sync_direction
      FROM qcontact_sync_log
      ORDER BY synced_at DESC
      LIMIT 1
    `;

    const lastSync = await queryOne<{
      synced_at: Date;
      status: string;
      sync_type: string;
      sync_direction: string;
    }>(lastSyncSql, []);

    // Get total counts by direction (last 7 days)
    const directionStatsSql = `
      SELECT
        sync_direction,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM qcontact_sync_log
      WHERE synced_at >= NOW() - INTERVAL '7 days'
      GROUP BY sync_direction
    `;

    const directionStats = await query<{
      sync_direction: string;
      total: string;
      successful: string;
      failed: string;
    }>(directionStatsSql, []);

    // Transform direction stats
    const by_direction = directionStats.reduce(
      (acc, stat) => {
        acc[stat.sync_direction] = {
          total: parseInt(stat.total, 10),
          successful: parseInt(stat.successful, 10),
          failed: parseInt(stat.failed, 10),
        };
        return acc;
      },
      {} as Record<string, { total: number; successful: number; failed: number }>
    );

    // Calculate if sync is healthy (success rate > 80% in last 24 hours)
    const is_healthy = progress.success_rate >= 0.8;
    const health_issues: string[] = [];

    if (progress.success_rate < 0.8) {
      health_issues.push(
        `Low success rate: ${(progress.success_rate * 100).toFixed(1)}%`
      );
    }

    if (progress.failed > 10) {
      health_issues.push(`High failure count: ${progress.failed} failures in last 24h`);
    }

    logger.debug('Sync status retrieved', {
      total: progress.total,
      successful: progress.successful,
      failed: progress.failed,
      success_rate: progress.success_rate,
      is_healthy,
    });

    return NextResponse.json({
      success: true,
      data: {
        last_sync: lastSync
          ? {
              synced_at: lastSync.synced_at,
              status: lastSync.status,
              sync_type: lastSync.sync_type,
              sync_direction: lastSync.sync_direction,
            }
          : null,
        last_24h: {
          total: progress.total,
          successful: progress.successful,
          failed: progress.failed,
          partial: progress.partial,
          success_rate: progress.success_rate,
        },
        last_7d: {
          by_direction,
        },
        health: {
          is_healthy,
          health_issues,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching sync status', { error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch sync status',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
