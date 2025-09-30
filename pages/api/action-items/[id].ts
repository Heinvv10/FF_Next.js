import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logUpdate, logDelete } from '@/lib/db-logger';
import { apiResponse, ErrorCode } from '@/lib/apiResponse';
import { actionItemsService } from '@/modules/action-items/services';
import type { UpdateActionItemRequest } from '@/modules/action-items/types/action-item.types';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const updateData = req.body;
      const userId = req.headers['user-id'] as string || 'system';

      // Transform request body to match service interface
      const updateActionItemRequest: UpdateActionItemRequest = {
        title: updateData.title,
        description: updateData.description,
        category: updateData.category,
        priority: updateData.priority,
        assigned_to: updateData.assignedTo,
        due_date: updateData.dueDate,
        status: updateData.status
      };

      // Update action item using service
      const updatedItem = await actionItemsService.updateActionItem(id as string, updateActionItemRequest, userId);

      // Clear cache to force refresh
      // Note: In production, you might want to clear specific cache keys

      // Log action item update
      logUpdate('action_item', id, updateData);

      // Transform response to match expected format
      const responseItem = {
        id: updatedItem.id,
        actionId: updatedItem.action_id,
        projectId: updatedItem.project_id,
        projectName: updatedItem.project_name,
        relatedTable: updatedItem.related_table,
        relatedId: updatedItem.related_id,
        title: updatedItem.title,
        description: updatedItem.description || '',
        category: updatedItem.category || 'General',
        priority: updatedItem.priority || 'medium',
        assignedTo: updatedItem.assigned_to,
        assigneeName: updatedItem.assigned_to_name || 'Unassigned',
        assigneeEmail: updatedItem.assigned_to_email,
        dueDate: updatedItem.due_date,
        status: updatedItem.status,
        isOverdue: updatedItem.due_date && new Date(updatedItem.due_date) < new Date() && updatedItem.status !== 'completed',
        createdAt: updatedItem.created_at,
        updatedAt: updatedItem.updated_at
      };

      return apiResponse.success(res, responseItem, 'Action item updated successfully');
    } catch (error: any) {
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return apiResponse.validationError(res, { general: error.message });
      }

      if (error.message.includes('Action item not found')) {
        return apiResponse.notFound(res, 'Action item not found');
      }

      if (error.code === '23503') { // Foreign key violation
        return apiResponse.error(
          res,
          ErrorCode.VALIDATION_ERROR,
          'Invalid project ID or staff ID'
        );
      }

      return apiResponse.databaseError(res, error, 'Failed to update action item');
    }
  } else if (req.method === 'DELETE') {
    try {
      // First, get the action item for logging
      const existingItem = await actionItemsService.getActionItemById(id as string);

      if (!existingItem) {
        return apiResponse.notFound(res, 'Action item not found');
      }

      // Delete the action item using service
      await actionItemsService.deleteActionItem(id as string);

      // Clear cache to force refresh
      // Note: In production, you might want to clear specific cache keys

      // Log action item deletion
      logDelete('action_item', id, {
        action_id: existingItem.action_id,
        title: existingItem.title,
        project_id: existingItem.project_id
      });

      return apiResponse.success(res, { id }, 'Action item deleted successfully');
    } catch (error) {
      if (error.message.includes('Action item not found')) {
        return apiResponse.notFound(res, 'Action item not found');
      }

      return apiResponse.databaseError(res, error, 'Failed to delete action item');
    }
  } else {
    return apiResponse.methodNotAllowed(res, req.method!, ['PUT', 'DELETE']);
  }
});