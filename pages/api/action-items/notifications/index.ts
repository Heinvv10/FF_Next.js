import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql } from '@/lib/db-logger';
import { apiResponse } from '@/lib/apiResponse';
import { actionItemsService } from '@/modules/action-items/services';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { type } = req.query;

  if (req.method === 'GET') {
    try {
      switch (type) {
        case 'overdue':
          return await getOverdueActions(res);

        case 'upcoming':
          const days = parseInt(req.query.days as string) || 7;
          return await getUpcomingActions(days, res);

        case 'assignee':
          const assigneeId = req.query.assigneeId as string;
          if (!assigneeId) {
            return apiResponse.error(res, 'MISSING_PARAMETER', 'Assignee ID is required');
          }
          return await getActionsByAssignee(assigneeId, res);

        default:
          return apiResponse.error(res, 'INVALID_TYPE', `Unknown notification type: ${type}`);
      }
    } catch (error) {
      console.error('Error fetching action item notifications:', error);
      return apiResponse.databaseError(res, error, 'Failed to fetch notifications');
    }
  } else {
    return apiResponse.methodNotAllowed(res, req.method!, ['GET']);
  }
});

async function getOverdueActions(res: NextApiResponse) {
  const overdueActions = await actionItemsService.getOverdueActions();

  // Transform for notification format
  const notifications = overdueActions.map(item => ({
    id: `overdue-${item.id}`,
    type: 'overdue' as const,
    actionItemId: item.id,
    actionItemTitle: item.title,
    recipientId: item.assigned_to,
    recipientEmail: item.assigned_to_email,
    message: `Overdue action item: "${item.title}" was due on ${new Date(item.due_date!).toLocaleDateString()}`,
    metadata: {
      daysOverdue: Math.floor((Date.now() - new Date(item.due_date!).getTime()) / (1000 * 60 * 60 * 24)),
      priority: item.priority,
      category: item.category
    },
    createdAt: new Date().toISOString(),
    isRead: false
  }));

  return apiResponse.success(res, {
    notifications,
    count: notifications.length,
    type: 'overdue'
  }, 'Overdue actions retrieved successfully');
}

async function getUpcomingActions(days: number, res: NextApiResponse) {
  const upcomingActions = await actionItemsService.getUpcomingActions(days);

  // Transform for notification format
  const notifications = upcomingActions.map(item => {
    const dueDate = new Date(item.due_date!);
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      id: `upcoming-${item.id}`,
      type: 'upcoming' as const,
      actionItemId: item.id,
      actionItemTitle: item.title,
      recipientId: item.assigned_to,
      recipientEmail: item.assigned_to_email,
      message: `Upcoming action item: "${item.title}" is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
      metadata: {
        dueDate: item.due_date,
        daysUntilDue,
        priority: item.priority,
        category: item.category
      },
      createdAt: new Date().toISOString(),
      isRead: false
    };
  });

  return apiResponse.success(res, {
    notifications,
    count: notifications.length,
    type: 'upcoming',
    days
  }, `Upcoming actions for next ${days} days retrieved successfully`);
}

async function getActionsByAssignee(assigneeId: string, res: NextApiResponse) {
  const assigneeActions = await actionItemsService.getActionsByAssignee(assigneeId);

  // Transform for notification format
  const notifications = assigneeActions.map(item => {
    const dueDate = item.due_date ? new Date(item.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date() && item.status !== 'completed';
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return {
      id: `assignee-${item.id}`,
      type: isOverdue ? 'overdue' : 'assigned' as const,
      actionItemId: item.id,
      actionItemTitle: item.title,
      recipientId: item.assigned_to,
      recipientEmail: item.assigned_to_email,
      message: isOverdue
        ? `Overdue action item: "${item.title}" was due on ${dueDate?.toLocaleDateString()}`
        : `Assigned action item: "${item.title}"${dueDate ? ` is due on ${dueDate.toLocaleDateString()}` : ''}`,
      metadata: {
        dueDate: item.due_date,
        daysUntilDue,
        priority: item.priority,
        category: item.category,
        status: item.status
      },
      createdAt: new Date().toISOString(),
      isRead: false
    };
  });

  return apiResponse.success(res, {
    notifications,
    count: notifications.length,
    type: 'assignee',
    assigneeId
  }, `Actions for assignee ${assigneeId} retrieved successfully`);
}