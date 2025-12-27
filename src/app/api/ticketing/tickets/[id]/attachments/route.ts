/**
 * Ticket Attachments API Route
 *
 * 🟢 WORKING: Production-ready API endpoint for listing ticket attachments
 *
 * GET /api/ticketing/tickets/[id]/attachments - List all attachments for a ticket
 *
 * Features:
 * - Filter by file_type, is_evidence, verification_step_id
 * - Aggregated statistics (total size, evidence count)
 * - Proper error handling with standard API responses
 * - Follows Zero Tolerance protocol (no console.log, proper error handling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { listAttachmentsForTicket } from '@/modules/ticketing/services/attachmentService';
import { FileType, AttachmentFilters } from '@/modules/ticketing/types/attachment';

const logger = createLogger('ticketing:api:ticket-attachments');

// ==================== GET /api/ticketing/tickets/[id]/attachments ====================

/**
 * 🟢 WORKING: List attachments for a ticket with optional filters
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { searchParams } = new URL(req.url);

    // Parse filters from query params
    const filters: AttachmentFilters = {};

    if (searchParams.has('file_type')) {
      const fileType = searchParams.get('file_type') as FileType;
      if (Object.values(FileType).includes(fileType)) {
        filters.file_type = fileType;
      }
    }

    if (searchParams.has('is_evidence')) {
      filters.is_evidence = searchParams.get('is_evidence') === 'true';
    }

    if (searchParams.has('verification_step_id')) {
      filters.verification_step_id = searchParams.get('verification_step_id')!;
    }

    if (searchParams.has('uploaded_by')) {
      filters.uploaded_by = searchParams.get('uploaded_by')!;
    }

    logger.debug('Fetching attachments for ticket', { ticket_id: ticketId, filters });

    const result = await listAttachmentsForTicket(ticketId, filters);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching ticket attachments', { error });

    // Handle validation errors (invalid UUID)
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch attachments',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
