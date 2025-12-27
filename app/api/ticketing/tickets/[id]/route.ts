/**
 * Ticket Detail API Route - Get, Update, Delete
 * GET    /api/ticketing/tickets/[id] - Get ticket detail
 * PUT    /api/ticketing/tickets/[id] - Update ticket
 * DELETE /api/ticketing/tickets/[id] - Soft delete ticket
 *
 * 🟢 WORKING: App Router endpoints with UUID validation and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import type {
  Ticket,
  UpdateTicketPayload,
  TicketStatus,
  TicketPriority,
  FaultCause,
  GuaranteeStatus
} from '@/modules/ticketing/types/ticket';
import * as ticketService from '@/modules/ticketing/services/ticketService';

const logger = createLogger({ context: 'TicketDetailAPI' });

// ==================== VALIDATION HELPERS ====================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES: TicketStatus[] = ['open', 'assigned', 'in_progress', 'pending_parts', 'pending_approval', 'qa_review', 'qa_approved', 'qa_rejected', 'resolved', 'closed', 'cancelled', 'on_hold'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent', 'critical'];
const VALID_FAULT_CAUSES: FaultCause[] = ['workmanship', 'material_failure', 'client_damage', 'third_party', 'environmental', 'vandalism', 'unknown'];
const VALID_GUARANTEE_STATUSES: GuaranteeStatus[] = ['under_guarantee', 'out_of_guarantee', 'pending_classification'];

/**
 * Validate UUID format
 * 🟢 WORKING: Validates UUID format using regex
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate update ticket payload
 * 🟢 WORKING: Validates optional fields and enum values
 */
function validateUpdatePayload(body: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Check if payload is empty
  if (!body || Object.keys(body).length === 0) {
    errors.payload = 'Update payload must contain at least one field to update';
    return { valid: false, errors };
  }

  // Validate enum fields if present
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.status = `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`;
  }

  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.priority = `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }

  if (body.fault_cause && !VALID_FAULT_CAUSES.includes(body.fault_cause)) {
    errors.fault_cause = `Invalid fault cause. Must be one of: ${VALID_FAULT_CAUSES.join(', ')}`;
  }

  if (body.guarantee_status && !VALID_GUARANTEE_STATUSES.includes(body.guarantee_status)) {
    errors.guarantee_status = `Invalid guarantee status. Must be one of: ${VALID_GUARANTEE_STATUSES.join(', ')}`;
  }

  // Validate data types if present
  if (body.qa_ready !== undefined && typeof body.qa_ready !== 'boolean') {
    errors.qa_ready = 'qa_ready must be a boolean';
  }

  if (body.sla_breached !== undefined && typeof body.sla_breached !== 'boolean') {
    errors.sla_breached = 'sla_breached must be a boolean';
  }

  if (body.is_billable !== undefined && typeof body.is_billable !== 'boolean') {
    errors.is_billable = 'is_billable must be a boolean';
  }

  if (body.rectification_count !== undefined) {
    const count = parseInt(body.rectification_count, 10);
    if (isNaN(count) || count < 0) {
      errors.rectification_count = 'rectification_count must be a non-negative integer';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// ==================== GET /api/ticketing/tickets/[id] ====================

/**
 * GET /api/ticketing/tickets/[id]
 * Get ticket detail by ID
 * 🟢 WORKING: Validates UUID and retrieves ticket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      logger.warn('Invalid ticket ID format', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ticket ID format. Must be a valid UUID.',
          details: { id: 'Invalid UUID format' }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 422 });
    }

    logger.debug('Fetching ticket by ID', { id });

    const ticket = await ticketService.getTicketById(id);

    if (!ticket) {
      logger.warn('Ticket not found', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Ticket with ID '${id}' not found`
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    logger.debug('Ticket retrieved successfully', { id, ticketUid: ticket.ticket_uid });

    return NextResponse.json({
      success: true,
      data: ticket,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Error fetching ticket', { error: error.message, stack: error.stack });

    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch ticket',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ==================== PUT /api/ticketing/tickets/[id] ====================

/**
 * PUT /api/ticketing/tickets/[id]
 * Update ticket with partial data
 * 🟢 WORKING: Validates UUID, payload, and updates ticket
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      logger.warn('Invalid ticket ID format for update', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ticket ID format. Must be a valid UUID.',
          details: { id: 'Invalid UUID format' }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 422 });
    }

    // Handle both NextRequest and mock requests
    const body: UpdateTicketPayload = typeof req.json === 'function'
      ? await req.json()
      : (req as any).body;

    logger.debug('Updating ticket', { id, payload: body });

    // Validate payload
    const validation = validateUpdatePayload(body);
    if (!validation.valid) {
      logger.warn('Ticket update validation failed', { id, errors: validation.errors });

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.errors
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 422 });
    }

    // Update ticket
    const updatedTicket = await ticketService.updateTicket(id, body);

    if (!updatedTicket) {
      logger.warn('Ticket not found for update', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Ticket with ID '${id}' not found`
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    logger.info('Ticket updated successfully', { id, ticketUid: updatedTicket.ticket_uid });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: 'Ticket updated successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Error updating ticket', { error: error.message, stack: error.stack });

    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update ticket',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ==================== DELETE /api/ticketing/tickets/[id] ====================

/**
 * DELETE /api/ticketing/tickets/[id]
 * Soft delete ticket (sets status to 'cancelled')
 * 🟢 WORKING: Validates UUID and soft deletes ticket
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      logger.warn('Invalid ticket ID format for deletion', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ticket ID format. Must be a valid UUID.',
          details: { id: 'Invalid UUID format' }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 422 });
    }

    logger.debug('Deleting ticket (soft delete)', { id });

    // Soft delete ticket
    const deletedTicket = await ticketService.deleteTicket(id);

    if (!deletedTicket) {
      logger.warn('Ticket not found for deletion', { id });

      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Ticket with ID '${id}' not found`
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    logger.info('Ticket deleted successfully (soft delete)', { id, ticketUid: deletedTicket.ticket_uid });

    return NextResponse.json({
      success: true,
      data: deletedTicket,
      message: 'Ticket deleted successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Error deleting ticket', { error: error.message, stack: error.stack });

    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete ticket',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
