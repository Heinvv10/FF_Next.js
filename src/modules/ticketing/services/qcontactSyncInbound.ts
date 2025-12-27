/**
 * QContact Inbound Sync Service
 * 🟢 WORKING: Production-ready service for importing tickets from QContact to FibreFlow
 *
 * Features:
 * - Fetch new tickets from QContact API
 * - Create tickets in FibreFlow database
 * - Field mapping between QContact and FibreFlow schemas
 * - Duplicate detection and skipping
 * - Sync logging with audit trail
 * - Error handling with graceful degradation
 * - Pagination support for large result sets
 *
 * @module ticketing/services/qcontactSyncInbound
 */

import { queryOne } from '../utils/db';
import { getDefaultQContactClient } from './qcontactClient';
import type { QContactTicket } from '../types/qcontact';
import type { CreateTicketPayload } from '../types/ticket';
import {
  TicketSource,
  TicketType,
  TicketPriority,
} from '../types/ticket';
import {
  SyncDirection,
  SyncType,
  SyncStatus,
  type SyncOperationResult,
  type SyncStats,
  type SyncError,
} from '../types/qcontact';
import { createLogger } from '@/lib/logger';

// 🟢 WORKING: Logger instance for sync operations
const logger = createLogger('qcontactSyncInbound');

// ============================================================================
// Types
// ============================================================================

/**
 * Options for bulk inbound sync
 */
export interface SyncInboundOptions {
  created_after?: Date;
  created_before?: Date;
  status?: string;
  page_size?: number;
}

/**
 * Result of bulk inbound sync operation
 */
export interface SyncInboundResult {
  started_at: Date;
  completed_at: Date;
  duration_seconds: number;
  total_processed: number;
  successful: number;
  failed: number;
  skipped: number;
  created: number;
  updated: number;
  errors: SyncError[];
}

// ============================================================================
// Field Mapping Functions
// ============================================================================

/**
 * Map QContact priority to FibreFlow priority
 * 🟢 WORKING: Priority conversion with fallback to NORMAL
 */
function mapPriority(qcontactPriority: string | null): TicketPriority {
  if (!qcontactPriority) {
    return TicketPriority.NORMAL;
  }

  const priorityLower = qcontactPriority.toLowerCase();

  switch (priorityLower) {
    case 'low':
      return TicketPriority.LOW;
    case 'normal':
      return TicketPriority.NORMAL;
    case 'high':
      return TicketPriority.HIGH;
    case 'urgent':
      return TicketPriority.URGENT;
    case 'critical':
      return TicketPriority.CRITICAL;
    default:
      return TicketPriority.NORMAL;
  }
}

/**
 * Map QContact category to FibreFlow ticket type
 * 🟢 WORKING: Category to ticket_type conversion
 */
function mapTicketType(category: string | null): TicketType {
  if (!category) {
    return TicketType.MAINTENANCE;
  }

  const categoryLower = category.toLowerCase();

  switch (categoryLower) {
    case 'maintenance':
      return TicketType.MAINTENANCE;
    case 'installation':
    case 'new_installation':
      return TicketType.NEW_INSTALLATION;
    case 'modification':
      return TicketType.MODIFICATION;
    case 'ont_swap':
      return TicketType.ONT_SWAP;
    case 'incident':
      return TicketType.INCIDENT;
    default:
      return TicketType.MAINTENANCE;
  }
}

/**
 * Map QContact ticket to FibreFlow CreateTicketPayload
 * 🟢 WORKING: Complete field mapping with custom fields extraction
 *
 * @param qcontactTicket - Ticket data from QContact API
 * @returns Mapped ticket payload for FibreFlow
 */
export function mapQContactTicketToFibreFlow(
  qcontactTicket: QContactTicket
): CreateTicketPayload {
  // Extract custom fields
  const customFields = qcontactTicket.custom_fields || {};
  const drNumber = customFields.dr_number as string | undefined;
  const poleNumber = customFields.pole_number as string | undefined;
  const ponNumber = customFields.pon_number as string | undefined;
  const projectId = customFields.project_id as string | undefined;
  const zoneId = customFields.zone_id as string | undefined;

  const payload: CreateTicketPayload = {
    source: TicketSource.QCONTACT,
    external_id: qcontactTicket.id,
    title: qcontactTicket.title,
    description: qcontactTicket.description || undefined,
    ticket_type: mapTicketType(qcontactTicket.category),
    priority: mapPriority(qcontactTicket.priority),
    address: qcontactTicket.address || undefined,
    dr_number: drNumber,
    pole_number: poleNumber,
    pon_number: ponNumber,
    project_id: projectId,
    zone_id: zoneId,
  };

  return payload;
}

// ============================================================================
// Sync Logging Functions
// ============================================================================

/**
 * Create sync log entry in qcontact_sync_log table
 * 🟢 WORKING: Audit trail for all sync operations
 */
async function createSyncLog(
  qcontactTicketId: string,
  ticketId: string | null,
  syncType: SyncType,
  status: SyncStatus,
  requestPayload: Record<string, any> | null,
  responsePayload: Record<string, any> | null,
  errorMessage: string | null
): Promise<string> {
  const sql = `
    INSERT INTO qcontact_sync_log (
      ticket_id,
      qcontact_ticket_id,
      sync_direction,
      sync_type,
      request_payload,
      response_payload,
      status,
      error_message
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    RETURNING id
  `;

  const values = [
    ticketId,
    qcontactTicketId,
    SyncDirection.INBOUND,
    syncType,
    requestPayload ? JSON.stringify(requestPayload) : null,
    responsePayload ? JSON.stringify(responsePayload) : null,
    status,
    errorMessage,
  ];

  try {
    const result = await queryOne<{ id: string }>(sql, values);
    return result?.id || '';
  } catch (error) {
    logger.error('Failed to create sync log', {
      qcontactTicketId,
      ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - logging failure shouldn't stop sync
    return '';
  }
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Check if ticket already exists in FibreFlow
 * 🟢 WORKING: Duplicate detection by external_id
 *
 * @param qcontactTicketId - QContact ticket ID
 * @returns Existing ticket ID if found, null otherwise
 */
async function checkDuplicate(qcontactTicketId: string): Promise<string | null> {
  const sql = `
    SELECT id
    FROM tickets
    WHERE source = $1
      AND external_id = $2
    LIMIT 1
  `;

  const values = [TicketSource.QCONTACT, qcontactTicketId];

  try {
    const result = await queryOne<{ id: string }>(sql, values);
    return result ? result.id : null;
  } catch (error) {
    logger.error('Failed to check duplicate', {
      qcontactTicketId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// Single Ticket Sync
// ============================================================================

/**
 * Sync a single ticket from QContact to FibreFlow
 * 🟢 WORKING: Creates ticket or skips if duplicate exists
 *
 * @param qcontactTicket - Ticket data from QContact
 * @returns Sync operation result
 */
export async function syncSingleInboundTicket(
  qcontactTicket: QContactTicket
): Promise<SyncOperationResult> {
  const startTime = Date.now();

  logger.debug('Syncing inbound ticket', {
    qcontactTicketId: qcontactTicket.id,
    title: qcontactTicket.title,
  });

  try {
    // Check for duplicate
    const existingTicketId = await checkDuplicate(qcontactTicket.id);

    if (existingTicketId) {
      logger.info('Ticket already exists, skipping', {
        qcontactTicketId: qcontactTicket.id,
        existingTicketId,
      });

      return {
        success: true,
        sync_log_id: '', // No log created for skipped tickets
        ticket_id: existingTicketId,
        qcontact_ticket_id: qcontactTicket.id,
        error_message: null,
        synced_at: new Date(),
      };
    }

    // Map QContact ticket to FibreFlow format
    const ticketPayload = mapQContactTicketToFibreFlow(qcontactTicket);

    // Create ticket in FibreFlow
    const sql = `
      INSERT INTO tickets (
        ticket_uid,
        source,
        external_id,
        title,
        description,
        ticket_type,
        priority,
        status,
        dr_number,
        project_id,
        zone_id,
        pole_number,
        pon_number,
        address
      ) VALUES (
        'FT' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
        $1, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `;

    const values = [
      ticketPayload.source,
      ticketPayload.external_id,
      ticketPayload.title,
      ticketPayload.description || null,
      ticketPayload.ticket_type,
      ticketPayload.priority,
      ticketPayload.dr_number || null,
      ticketPayload.project_id || null,
      ticketPayload.zone_id || null,
      ticketPayload.pole_number || null,
      ticketPayload.pon_number || null,
      ticketPayload.address || null,
    ];

    const createdTicket = await queryOne<{ id: string; ticket_uid: string }>(sql, values);

    if (!createdTicket) {
      throw new Error('Failed to create ticket - no result returned');
    }

    logger.info('Ticket created successfully', {
      qcontactTicketId: qcontactTicket.id,
      ticketId: createdTicket.id,
      ticketUid: createdTicket.ticket_uid,
      duration: Date.now() - startTime,
    });

    // Create success sync log
    const syncLogId = await createSyncLog(
      qcontactTicket.id,
      createdTicket.id,
      SyncType.CREATE,
      SyncStatus.SUCCESS,
      qcontactTicket,
      createdTicket,
      null
    );

    return {
      success: true,
      sync_log_id: syncLogId,
      ticket_id: createdTicket.id,
      qcontact_ticket_id: qcontactTicket.id,
      error_message: null,
      synced_at: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Failed to sync inbound ticket', {
      qcontactTicketId: qcontactTicket.id,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    // Create error sync log
    const syncLogId = await createSyncLog(
      qcontactTicket.id,
      null,
      SyncType.CREATE,
      SyncStatus.FAILED,
      qcontactTicket,
      null,
      errorMessage
    );

    return {
      success: false,
      sync_log_id: syncLogId,
      ticket_id: null,
      qcontact_ticket_id: qcontactTicket.id,
      error_message: errorMessage,
      synced_at: new Date(),
    };
  }
}

// ============================================================================
// Bulk Sync
// ============================================================================

/**
 * Sync tickets from QContact to FibreFlow in bulk
 * 🟢 WORKING: Fetches and syncs all new tickets from QContact
 *
 * Features:
 * - Pagination support for large result sets
 * - Filters for date ranges and status
 * - Error collection without stopping batch
 * - Detailed statistics reporting
 *
 * @param options - Sync filter options
 * @returns Sync result with statistics
 */
export async function syncInboundTickets(
  options: SyncInboundOptions = {}
): Promise<SyncInboundResult> {
  const startTime = Date.now();
  const started_at = new Date();

  logger.info('Starting inbound sync from QContact', options);

  const stats: SyncStats = {
    total_processed: 0,
    successful: 0,
    failed: 0,
    partial: 0,
    skipped: 0,
    created: 0,
    updated: 0,
  };

  const errors: SyncError[] = [];

  try {
    const client = getDefaultQContactClient();

    // Pagination setup
    const pageSize = options.page_size || 100;
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      logger.debug('Fetching tickets from QContact', {
        page: currentPage,
        pageSize,
      });

      // Fetch tickets from QContact
      const response = await client.listTickets({
        status: options.status || 'open',
        created_after: options.created_after,
        created_before: options.created_before,
        page: currentPage,
        page_size: pageSize,
      });

      logger.info('Fetched tickets from QContact', {
        page: currentPage,
        count: response.tickets.length,
        total: response.total,
      });

      // Process each ticket
      for (const qcontactTicket of response.tickets) {
        stats.total_processed++;

        const result = await syncSingleInboundTicket(qcontactTicket);

        if (result.success) {
          stats.successful++;

          // Check if it was a new ticket (has sync_log_id) or existing (skipped)
          if (result.sync_log_id && result.sync_log_id !== '') {
            stats.created++;
          } else {
            stats.skipped++;
          }
        } else {
          stats.failed++;

          errors.push({
            ticket_id: null,
            qcontact_ticket_id: qcontactTicket.id,
            sync_type: SyncType.CREATE,
            error_message: result.error_message || 'Unknown error',
            error_code: null,
            timestamp: new Date(),
            recoverable: true,
          });
        }
      }

      // Check if there are more pages
      hasMore = response.has_more;
      currentPage++;

      // Safety limit to prevent infinite loops
      if (currentPage > 100) {
        logger.warn('Reached page limit, stopping sync', { currentPage });
        break;
      }
    }

    const duration_seconds = (Date.now() - startTime) / 1000;
    const completed_at = new Date();

    logger.info('Inbound sync completed', {
      duration_seconds,
      stats,
      errorCount: errors.length,
    });

    return {
      started_at,
      completed_at,
      duration_seconds,
      total_processed: stats.total_processed,
      successful: stats.successful,
      failed: stats.failed,
      skipped: stats.skipped,
      created: stats.created,
      updated: stats.updated,
      errors,
    };
  } catch (error) {
    const duration_seconds = (Date.now() - startTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Inbound sync failed', {
      error: errorMessage,
      duration_seconds,
      stats,
    });

    return {
      started_at,
      completed_at: new Date(),
      duration_seconds,
      total_processed: stats.total_processed,
      successful: stats.successful,
      failed: stats.failed,
      skipped: stats.skipped,
      created: stats.created,
      updated: stats.updated,
      errors: [
        ...errors,
        {
          ticket_id: null,
          qcontact_ticket_id: null,
          sync_type: SyncType.FULL_SYNC,
          error_message: errorMessage,
          error_code: null,
          timestamp: new Date(),
          recoverable: false,
        },
      ],
    };
  }
}
