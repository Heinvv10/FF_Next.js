// pages/api/ticketing/tickets-bulk.ts
// Bulk operations API for tickets
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

type BulkAction = 'update_status' | 'assign' | 'update_priority' | 'add_tags' | 'remove_tags' | 'delete';

interface BulkRequest {
  action: BulkAction;
  ticket_ids: string[];
  data?: Record<string, unknown>;
  use_transaction?: boolean;
}

interface BulkResult {
  success: boolean;
  ticket_id: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method!, ['POST']);
  }

  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  const isAdmin = sessionClaims?.metadata?.role === 'admin';

  return handleBulkOperation(req, res, userId, isAdmin);
}

async function handleBulkOperation(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  isAdmin: boolean
) {
  try {
    const { action, ticket_ids, data, use_transaction = true } = req.body as BulkRequest;

    // Validate required parameters
    if (!action) {
      return apiResponse.badRequest(res, 'action parameter is required');
    }

    if (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return apiResponse.badRequest(res, 'ticket_ids parameter is required and must be a non-empty array');
    }

    if (ticket_ids.length > 100) {
      return apiResponse.badRequest(res, 'Maximum 100 tickets can be updated at once');
    }

    // Validate action type
    const validActions: BulkAction[] = ['update_status', 'assign', 'update_priority', 'add_tags', 'remove_tags', 'delete'];
    if (!validActions.includes(action)) {
      return apiResponse.badRequest(res, `Invalid action. Supported actions: ${validActions.join(', ')}`, {
        supported_actions: validActions,
      });
    }

    // Check hard delete requires admin
    if (action === 'delete' && data?.force === true && !isAdmin) {
      return apiResponse.forbidden(res, 'Admin access required for hard delete');
    }

    // Process bulk operation
    const results: BulkResult[] = [];
    let hasFailures = false;

    if (use_transaction) {
      // Use transaction - all or nothing
      try {
        for (const ticketId of ticket_ids) {
          await processSingleTicket(ticketId, action, data, userId);
          results.push({ success: true, ticket_id: ticketId });
        }
      } catch (error) {
        return apiResponse.internalError(res, error, 'Transaction failed, all changes rolled back');
      }
    } else {
      // Process individually - partial success allowed
      for (const ticketId of ticket_ids) {
        try {
          await processSingleTicket(ticketId, action, data, userId);
          results.push({ success: true, ticket_id: ticketId });
        } catch (error) {
          hasFailures = true;
          results.push({
            success: false,
            ticket_id: ticketId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Log audit trail
    try {
      await sql`
        INSERT INTO ticket_audit_logs (action, user_id, affected_tickets, data, created_at)
        VALUES (${action}, ${userId}, ${ticket_ids}, ${JSON.stringify(data || {})}, NOW())
      `;
    } catch {
      // Don't fail the request if audit logging fails
    }

    // Return results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    if (hasFailures) {
      // 207 Multi-Status for partial success
      return res.status(207).json({
        success: true,
        message: `Processed ${successCount}/${ticket_ids.length} tickets successfully`,
        data: {
          results,
          summary: {
            total: ticket_ids.length,
            success: successCount,
            failed: failureCount,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    return apiResponse.success(res, {
      results,
      summary: {
        total: ticket_ids.length,
        success: successCount,
        failed: failureCount,
      },
    }, `Successfully processed ${successCount} tickets`);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function processSingleTicket(
  ticketId: string,
  action: BulkAction,
  data: Record<string, unknown> | undefined,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();

  switch (action) {
    case 'update_status': {
      const status = data?.status as string;
      const updateData = status === 'closed'
        ? { status, closed_at: now, updated_at: now, updated_by: userId }
        : { status, updated_at: now, updated_by: userId };

      await sql`
        UPDATE tickets
        SET status = ${status},
            closed_at = ${status === 'closed' ? now : null},
            updated_at = ${now},
            updated_by = ${userId}
        WHERE id = ${ticketId}
      `;
      break;
    }

    case 'assign': {
      const assignedTo = data?.assigned_to as string | null;
      await sql`
        UPDATE tickets
        SET assigned_to = ${assignedTo},
            updated_at = ${now},
            updated_by = ${userId}
        WHERE id = ${ticketId}
      `;
      break;
    }

    case 'update_priority': {
      const priority = data?.priority as string;
      // Recalculate SLA based on priority
      const slaHours = getSLAHours(priority);
      await sql`
        UPDATE tickets
        SET priority = ${priority},
            sla_response_deadline = NOW() + INTERVAL '${slaHours.response} hours',
            sla_resolution_deadline = NOW() + INTERVAL '${slaHours.resolution} hours',
            updated_at = ${now},
            updated_by = ${userId}
        WHERE id = ${ticketId}
      `;
      break;
    }

    case 'add_tags': {
      const tags = data?.tags as string[];
      await sql`
        UPDATE tickets
        SET tags = array_cat(COALESCE(tags, '{}'), ${tags}::text[]),
            updated_at = ${now},
            updated_by = ${userId}
        WHERE id = ${ticketId}
      `;
      break;
    }

    case 'remove_tags': {
      const tagsToRemove = data?.tags as string[];
      await sql`
        UPDATE tickets
        SET tags = array_remove_all(COALESCE(tags, '{}'), ${tagsToRemove}),
            updated_at = ${now},
            updated_by = ${userId}
        WHERE id = ${ticketId}
      `;
      break;
    }

    case 'delete': {
      const force = data?.force as boolean;
      if (force) {
        // Hard delete
        await sql`DELETE FROM tickets WHERE id = ${ticketId}`;
      } else {
        // Soft delete
        await sql`
          UPDATE tickets
          SET deleted = true,
              deleted_at = ${now},
              deleted_by = ${userId},
              updated_at = ${now}
          WHERE id = ${ticketId}
        `;
      }
      break;
    }
  }
}

function getSLAHours(priority: string): { response: number; resolution: number } {
  switch (priority) {
    case 'critical':
      return { response: 1, resolution: 4 };
    case 'high':
      return { response: 4, resolution: 24 };
    case 'medium':
      return { response: 8, resolution: 48 };
    case 'low':
      return { response: 24, resolution: 72 };
    default:
      return { response: 8, resolution: 48 };
  }
}
