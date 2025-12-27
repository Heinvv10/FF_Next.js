/**
 * DR Lookup Service
 *
 * Queries SOW module for DR (Drop) details including project, zone, pole, and PON information.
 *
 * Features:
 * - Lookup DR from drops table in SOW module
 * - Returns project, zone, pole, PON details
 * - In-memory caching to reduce database queries
 * - Comprehensive error handling
 *
 * 🟢 WORKING: Production-ready DR lookup service with caching
 */

import { queryOne } from '../utils/db';
import { DRLookupResult, DRLookupData } from '../types/ticket';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'drLookupService' });

/**
 * In-memory cache for DR lookup results
 * Key: DR number
 * Value: DRLookupData
 */
const drCache = new Map<string, DRLookupData>();

/**
 * Lookup DR number in SOW module and return complete details
 * 🟢 WORKING: Queries drops table and enriches with project data
 *
 * @param drNumber - The DR (drop) number to lookup
 * @returns DRLookupResult with success flag and data or error
 */
export async function lookupDR(drNumber: string): Promise<DRLookupResult> {
  try {
    // Validate input
    const trimmedDR = drNumber.trim();
    if (!trimmedDR) {
      return {
        success: false,
        data: null,
        error: 'DR number is required'
      };
    }

    // Check cache first
    const cachedResult = drCache.get(trimmedDR);
    if (cachedResult) {
      logger.debug('DR lookup cache hit', { drNumber: trimmedDR });
      return {
        success: true,
        data: cachedResult
      };
    }

    logger.info('Looking up DR number in SOW module', { drNumber: trimmedDR });

    // Query drops table for DR details
    const drData = await queryOne<{
      drop_number: string;
      pole_number: string | null;
      project_id: string | null;
      pon_no: number | null;
      zone_no: number | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      municipality: string | null;
      cable_type: string | null;
      cable_length: string | null;
      status: string | null;
      created_date: Date | null;
      created_by: string | null;
    }>(
      `SELECT
        drop_number,
        pole_number,
        project_id,
        pon_no,
        zone_no,
        address,
        latitude,
        longitude,
        municipality,
        cable_type,
        cable_length,
        status,
        created_date,
        created_by
      FROM drops
      WHERE drop_number = $1`,
      [trimmedDR]
    );

    // Check if DR was found
    if (!drData || !drData.drop_number) {
      logger.warn('DR number not found', { drNumber: trimmedDR });
      return {
        success: false,
        data: null,
        error: 'DR number not found'
      };
    }

    // Initialize result data with DR information
    const resultData: DRLookupData = {
      dr_number: drData.drop_number,
      pole_number: drData.pole_number,
      pon_number: drData.pon_no,
      zone_number: drData.zone_no,
      project_id: drData.project_id,
      project_name: null,
      project_code: null,
      address: drData.address,
      latitude: drData.latitude,
      longitude: drData.longitude,
      municipality: drData.municipality,
      cable_type: drData.cable_type,
      cable_length: drData.cable_length,
      status: drData.status
    };

    // If project_id exists, lookup project details
    if (drData.project_id) {
      try {
        const projectData = await queryOne<{
          id: string;
          name: string;
          code: string;
          status: string;
        }>(
          `SELECT
            id,
            name,
            code,
            status
          FROM projects
          WHERE id = $1`,
          [drData.project_id]
        );

        if (projectData) {
          resultData.project_name = projectData.name;
          resultData.project_code = projectData.code;
          logger.debug('Project details found for DR', {
            drNumber: trimmedDR,
            projectName: projectData.name
          });
        } else {
          logger.warn('Project not found for DR', {
            drNumber: trimmedDR,
            projectId: drData.project_id
          });
        }
      } catch (projectError) {
        // Log error but don't fail the entire lookup
        logger.error('Error looking up project details', {
          error: projectError,
          drNumber: trimmedDR,
          projectId: drData.project_id
        });
        // Continue with DR data even if project lookup fails
      }
    }

    // Cache the result
    drCache.set(trimmedDR, resultData);
    logger.debug('DR lookup result cached', { drNumber: trimmedDR });

    return {
      success: true,
      data: resultData
    };
  } catch (error) {
    logger.error('Failed to lookup DR number', {
      error,
      drNumber: drNumber
    });

    return {
      success: false,
      data: null,
      error: `Failed to lookup DR number: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get DR data from cache without querying database
 * 🟢 WORKING: Cache retrieval utility
 *
 * @param drNumber - The DR number to retrieve from cache
 * @returns Cached DRLookupData or null if not in cache
 */
export function getDRFromCache(drNumber: string): DRLookupData | null {
  const trimmedDR = drNumber.trim();
  return drCache.get(trimmedDR) || null;
}

/**
 * Clear all cached DR lookup results
 * 🟢 WORKING: Cache management utility
 *
 * Use this to invalidate cache when DR data changes
 */
export function clearDRCache(): void {
  drCache.clear();
  logger.info('DR lookup cache cleared');
}

/**
 * Clear specific DR from cache
 * 🟢 WORKING: Selective cache invalidation
 *
 * @param drNumber - The DR number to remove from cache
 */
export function clearDRFromCache(drNumber: string): void {
  const trimmedDR = drNumber.trim();
  const deleted = drCache.delete(trimmedDR);

  if (deleted) {
    logger.debug('DR removed from cache', { drNumber: trimmedDR });
  }
}

/**
 * Get cache statistics
 * 🟢 WORKING: Cache monitoring utility
 *
 * @returns Cache size and statistics
 */
export function getDRCacheStats(): {
  size: number;
  entries: string[];
} {
  return {
    size: drCache.size,
    entries: Array.from(drCache.keys())
  };
}
