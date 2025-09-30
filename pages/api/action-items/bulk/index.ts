import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logBusinessOperation } from '@/lib/db-logger';
import { apiResponse } from '@/lib/apiResponse';
import { actionItemsService } from '@/modules/action-items/services';
import type { BulkActionRequest, PriorityEscalationRequest, AutoAssignmentRequest } from '@/modules/action-items/types/action-item.types';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const userId = req.headers['user-id'] as string || 'system';

  if (req.method === 'POST') {
    const { operation, ...data } = req.body;

    try {
      switch (operation) {
        case 'bulkUpdate':
          return await handleBulkUpdate(data as BulkActionRequest, userId, res);

        case 'escalatePriorities':
          return await handlePriorityEscalation(data as PriorityEscalationRequest, userId, res);

        case 'autoAssign':
          return await handleAutoAssignment(data as AutoAssignmentRequest, userId, res);

        default:
          return apiResponse.error(res, 'INVALID_OPERATION', `Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Error in bulk operation ${operation}:`, error);
      return apiResponse.databaseError(res, error, `Failed to perform ${operation}`);
    }
  } else {
    return apiResponse.methodNotAllowed(res, req.method!, ['POST']);
  }
});

async function handleBulkUpdate(request: BulkActionRequest, userId: string, res: NextApiResponse) {
  const result = await actionItemsService.bulkUpdateActions(request, userId);

  // Log bulk operation
  logBusinessOperation('bulk_update', {
    itemCount: request.ids.length,
    fields: Object.keys(request.updates),
    userId
  });

  if (result.errors.length > 0) {
    return apiResponse.partialSuccess(res, {
      updated: result.updated,
      errors: result.errors,
      message: `Bulk update completed with ${result.errors.length} errors`
    });
  }

  return apiResponse.success(res, {
    updated: result.updated,
    message: `Successfully updated ${result.updated} action items`
  });
}

async function handlePriorityEscalation(request: PriorityEscalationRequest, userId: string, res: NextApiResponse) {
  const result = await actionItemsService.escalatePriorities(request);

  // Log priority escalation
  logBusinessOperation('priority_escalation', {
    currentPriority: request.currentPriority,
    newPriority: request.newPriority,
    overdueOnly: request.overdueOnly,
    escalated: result.escalated,
    userId
  });

  if (result.errors.length > 0) {
    return apiResponse.partialSuccess(res, {
      escalated: result.escalated,
      errors: result.errors,
      message: `Priority escalation completed with ${result.errors.length} errors`
    });
  }

  return apiResponse.success(res, {
    escalated: result.escalated,
    message: `Successfully escalated ${result.escalated} action items to ${request.newPriority} priority`
  });
}

async function handleAutoAssignment(request: AutoAssignmentRequest, userId: string, res: NextApiResponse) {
  const result = await actionItemsService.autoAssignActions(request);

  // Log auto-assignment
  logBusinessOperation('auto_assignment', {
    assigneeId: request.assigneeId,
    category: request.category,
    priority: request.priority,
    assigned: result.assigned,
    userId
  });

  if (result.errors.length > 0) {
    return apiResponse.partialSuccess(res, {
      assigned: result.assigned,
      errors: result.errors,
      message: `Auto-assignment completed with ${result.errors.length} errors`
    });
  }

  return apiResponse.success(res, {
    assigned: result.assigned,
    message: `Successfully assigned ${result.assigned} action items`
  });
}