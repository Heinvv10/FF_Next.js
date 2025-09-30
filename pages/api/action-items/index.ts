import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logCreate, logUpdate, logDelete } from '@/lib/db-logger';
import { apiResponse, ErrorCode } from '@/lib/apiResponse';
import { actionItemsService } from '@/modules/action-items/services';
import type { CreateActionItemRequest, ActionItemsQuery } from '@/modules/action-items/types/action-item.types';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

// Simple in-memory cache (2 minute TTL for action items)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCacheKey(filters: any): string {
  return `action-items:${JSON.stringify(filters)}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { projectId, status, assignee, priority, page = 1, limit = 50 } = req.query;

  if (req.method === 'GET') {
    try {
      // Check cache first
      const cacheKey = getCacheKey({ projectId, status, assignee, priority, page, limit });
      const cachedData = getFromCache(cacheKey);

      if (cachedData) {
        console.log(`🎯 Cache hit for action items`);
        return res.status(200).json(cachedData);
      }

      console.log(`🔍 Cache miss for action items, querying database`);

      // Build query parameters
      const query: ActionItemsQuery = {
        projectId: projectId && projectId !== 'all' ? projectId as string : undefined,
        status: status && status !== 'all' ? [status as string] : undefined,
        assignedTo: assignee && assignee !== 'all' ? assignee as string : undefined,
        priority: priority && priority !== 'all' ? [priority as string] : undefined,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        orderBy: 'created_at',
        orderDirection: 'DESC'
      };

      // Get action items using service
      const { items, total } = await actionItemsService.getActionItems(query);

      // Get statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
        FROM action_items ai
        WHERE 1=1 ${query.projectId ? `AND ai.project_id = ${query.projectId}` : ''}
          ${query.status ? `AND ai.status = ANY('${query.status}')` : ''}
          ${query.assignedTo ? `AND ai.assigned_to = '${query.assignedTo}'` : ''}
          ${query.priority ? `AND ai.priority = ANY('${query.priority}')` : ''}
      `;

      const statsResult = await sql.unsafe(statsQuery);
      const stats = statsResult[0];

      // Transform data to match expected format
      const transformedItems = items.map(item => ({
        id: item.id,
        actionId: item.action_id,
        projectId: item.project_id,
        projectName: item.project_name,
        relatedTable: item.related_table,
        relatedId: item.related_id,
        title: item.title,
        description: item.description || '',
        category: item.category || 'General',
        priority: item.priority || 'medium',
        assignedTo: item.assigned_to,
        assigneeName: item.assigned_to_name || 'Unassigned',
        assigneeEmail: item.assigned_to_email,
        dueDate: item.due_date,
        status: item.status,
        isOverdue: item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      // Prepare response data
      const responseData = {
        items: transformedItems,
        pagination: {
          page: Number(page),
          pageSize: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        stats: {
          total: parseInt(stats.total || '0'),
          pending: parseInt(stats.pending || '0'),
          inProgress: parseInt(stats.in_progress || '0'),
          completed: parseInt(stats.completed || '0'),
          overdue: parseInt(stats.overdue || '0'),
          highPriority: parseInt(stats.high_priority || '0'),
          mediumPriority: parseInt(stats.medium_priority || '0'),
          lowPriority: parseInt(stats.low_priority || '0')
        }
      };

      // Store in cache
      setCache(cacheKey, responseData);

      return apiResponse.success(res, responseData, 'Action items retrieved successfully');
    } catch (error) {
      console.error('Error fetching action items:', error);
      return apiResponse.databaseError(res, error, 'Failed to fetch action items');
    }
  } else if (req.method === 'POST') {
    try {
      const newItem = req.body;
      const userId = req.headers['user-id'] as string || 'system';

      // Transform request body to match service interface
      const createActionItemRequest: CreateActionItemRequest = {
        action_id: newItem.actionId,
        project_id: newItem.projectId,
        related_table: newItem.relatedTable,
        related_id: newItem.relatedId,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        priority: newItem.priority,
        assigned_to: newItem.assignedTo,
        due_date: newItem.dueDate,
        status: newItem.status
      };

      // Create action item using service
      const createdItem = await actionItemsService.createActionItem(createActionItemRequest, userId);

      // Clear cache to force refresh
      cache.clear();

      // Log action item creation
      logCreate('action_item', createdItem.id, {
        action_id: createdItem.action_id,
        title: createdItem.title,
        project_id: createdItem.project_id,
        assigned_to: createdItem.assigned_to,
        priority: createdItem.priority
      });

      // Transform response to match expected format
      const responseItem = {
        id: createdItem.id,
        actionId: createdItem.action_id,
        projectId: createdItem.project_id,
        projectName: createdItem.project_name,
        relatedTable: createdItem.related_table,
        relatedId: createdItem.related_id,
        title: createdItem.title,
        description: createdItem.description || '',
        category: createdItem.category || 'General',
        priority: createdItem.priority || 'medium',
        assignedTo: createdItem.assigned_to,
        assigneeName: createdItem.assigned_to_name || 'Unassigned',
        assigneeEmail: createdItem.assigned_to_email,
        dueDate: createdItem.due_date,
        status: createdItem.status,
        isOverdue: createdItem.due_date && new Date(createdItem.due_date) < new Date() && createdItem.status !== 'completed',
        createdAt: createdItem.created_at,
        updatedAt: createdItem.updated_at
      };

      return apiResponse.created(res, responseItem, 'Action item created successfully');
    } catch (error: any) {
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return apiResponse.validationError(res, { general: error.message });
      }

      // Check for specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return apiResponse.error(
          res,
          ErrorCode.CONFLICT,
          'An action item with this ID already exists'
        );
      }

      if (error.code === '23503') { // Foreign key violation
        return apiResponse.error(
          res,
          ErrorCode.VALIDATION_ERROR,
          'Invalid project ID, staff ID, or related reference'
        );
      }

      return apiResponse.databaseError(res, error, 'Failed to create action item');
    }
  } else {
    return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST']);
  }
});