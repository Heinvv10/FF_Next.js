/**
 * Ticket CRUD API Route - List and Create
 * GET  /api/ticketing/tickets - List all tickets with filters and pagination
 * POST /api/ticketing/tickets - Create new ticket
 *
 * 🟢 WORKING: App Router endpoints with comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import type {
  Ticket,
  CreateTicketPayload,
  TicketFilters,
  TicketSource,
  TicketType,
  TicketPriority,
  TicketStatus
} from '@/modules/ticketing/types/ticket';
import * as ticketService from '@/modules/ticketing/services/ticketService';

const logger = createLogger({ context: 'TicketAPI' });

// ==================== VALIDATION HELPERS ====================

const VALID_SOURCES: TicketSource[] = ['qcontact', 'weekly_report', 'construction', 'ad_hoc', 'incident', 'revenue', 'ont_swap', 'manual'];
const VALID_TYPES: TicketType[] = ['maintenance', 'new_installation', 'modification', 'ont_swap', 'incident'];
const VALID_PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent', 'critical'];
const VALID_STATUSES: TicketStatus[] = ['open', 'assigned', 'in_progress', 'pending_parts', 'pending_approval', 'qa_review', 'qa_approved', 'qa_rejected', 'resolved', 'closed', 'cancelled', 'on_hold'];

/**
 * Validate create ticket payload
 * 🟢 WORKING: Validates required fields and enum values
 */
function validateCreatePayload(body: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Required fields
  if (!body.source) {
    errors.source = 'Source is required';
  } else if (!VALID_SOURCES.includes(body.source)) {
    errors.source = `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`;
  }

  if (!body.title) {
    errors.title = 'Title is required';
  } else if (typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.title = 'Title must be a non-empty string';
  }

  if (!body.ticket_type) {
    errors.ticket_type = 'Ticket type is required';
  } else if (!VALID_TYPES.includes(body.ticket_type)) {
    errors.ticket_type = `Invalid ticket type. Must be one of: ${VALID_TYPES.join(', ')}`;
  }

  // Optional fields validation
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.priority = `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`;
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    errors.status = `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Parse query parameters into TicketFilters
 * 🟢 WORKING: Safely parses and converts query params
 */
function parseFilters(searchParams: URLSearchParams): TicketFilters {
  const filters: TicketFilters = {};

  // String filters
  if (searchParams.has('status')) filters.status = searchParams.get('status') as TicketStatus;
  if (searchParams.has('ticket_type')) filters.ticket_type = searchParams.get('ticket_type') as TicketType;
  if (searchParams.has('priority')) filters.priority = searchParams.get('priority') as TicketPriority;
  if (searchParams.has('source')) filters.source = searchParams.get('source') as TicketSource;
  if (searchParams.has('assigned_to')) filters.assigned_to = searchParams.get('assigned_to')!;
  if (searchParams.has('project_id')) filters.project_id = searchParams.get('project_id')!;
  if (searchParams.has('dr_number')) filters.dr_number = searchParams.get('dr_number')!;

  // Boolean filters
  if (searchParams.has('qa_ready')) {
    filters.qa_ready = searchParams.get('qa_ready') === 'true';
  }
  if (searchParams.has('sla_breached')) {
    filters.sla_breached = searchParams.get('sla_breached') === 'true';
  }

  // Pagination
  if (searchParams.has('page')) {
    const page = parseInt(searchParams.get('page')!, 10);
    if (!isNaN(page) && page > 0) {
      filters.page = page;
    }
  }
  if (searchParams.has('pageSize')) {
    const pageSize = parseInt(searchParams.get('pageSize')!, 10);
    if (!isNaN(pageSize) && pageSize > 0 && pageSize <= 100) {
      filters.pageSize = pageSize;
    }
  }

  return filters;
}

// ==================== GET /api/ticketing/tickets ====================

/**
 * GET /api/ticketing/tickets
 * List tickets with optional filters and pagination
 * 🟢 WORKING: Tested with multiple filter combinations
 */
export async function GET(req: NextRequest) {
  try {
    // Handle both NextRequest and mock requests
    const url = req.url || 'http://localhost:3000/api/ticketing/tickets';
    const { searchParams } = new URL(url);
    const filters = parseFilters(searchParams);

    logger.debug('Listing tickets with filters', { filters });

    const result = await ticketService.listTickets(filters);

    return NextResponse.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Error listing tickets', { error: error.message, stack: error.stack });

    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to list tickets',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ==================== POST /api/ticketing/tickets ====================

/**
 * POST /api/ticketing/tickets
 * Create new ticket with validation
 * 🟢 WORKING: Validates payload and creates ticket with auto-generated UID
 */
export async function POST(req: NextRequest) {
  try {
    // Handle both NextRequest and mock requests
    const body: CreateTicketPayload = typeof req.json === 'function'
      ? await req.json()
      : (req as any).body;

    logger.debug('Creating ticket', { payload: body });

    // Validate payload
    const validation = validateCreatePayload(body);
    if (!validation.valid) {
      logger.warn('Ticket creation validation failed', { errors: validation.errors });

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

    // Create ticket
    const ticket = await ticketService.createTicket(body);

    logger.info('Ticket created successfully', { ticketId: ticket.id, ticketUid: ticket.ticket_uid });

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating ticket', { error: error.message, stack: error.stack });

    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create ticket',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
