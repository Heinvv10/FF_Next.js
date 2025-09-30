/**
 * Action Items Service - Business logic layer for action items management
 * Provides advanced operations, validation, and business rules
 */

import type {
  ActionItem,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  ActionItemsQuery,
  ActionItemsStats,
  BulkActionRequest,
  PriorityEscalationRequest,
  AutoAssignmentRequest,
  ActionItemValidationResult,
} from '../types/action-item.types';
import { getSql } from '@/lib/neon-sql';

export class ActionItemsService {
  /**
   * ACTION ITEM CRUD OPERATIONS WITH BUSINESS LOGIC
   */

  async getActionItems(query: ActionItemsQuery = {}): Promise<{ items: ActionItem[]; total: number }> {
    const sql = getSql();

    // Build where clause dynamically
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (query.projectId) {
      whereConditions.push('project_id = $' + (params.length + 1));
      params.push(query.projectId);
    }

    if (query.status && query.status.length > 0) {
      whereConditions.push('status = ANY($' + (params.length + 1) + ')');
      params.push(query.status);
    }

    if (query.priority && query.priority.length > 0) {
      whereConditions.push('priority = ANY($' + (params.length + 1) + ')');
      params.push(query.priority);
    }

    if (query.assignedTo) {
      whereConditions.push('assigned_to = $' + (params.length + 1));
      params.push(query.assignedTo);
    }

    if (query.category) {
      whereConditions.push('category = $' + (params.length + 1));
      params.push(query.category);
    }

    if (query.search) {
      whereConditions.push('(title ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')');
      const searchTerm = '%' + query.search + '%';
      params.push(searchTerm, searchTerm);
    }

    // Due date filters
    if (query.dueFrom) {
      whereConditions.push('due_date >= $' + (params.length + 1));
      params.push(query.dueFrom);
    }

    if (query.dueTo) {
      whereConditions.push('due_date <= $' + (params.length + 1));
      params.push(query.dueTo);
    }

    // Overdue filter
    if (query.overdue === true) {
      whereConditions.push('due_date < NOW() AND status != \'completed\' AND status != \'cancelled\'');
    }

    // Upcoming filter
    if (query.upcoming === true) {
      whereConditions.push('due_date >= NOW() AND due_date <= NOW() + INTERVAL \'7 days\' AND status != \'completed\' AND status != \'cancelled\'');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Add ordering
    const orderBy = query.orderBy || 'created_at';
    const orderDirection = query.orderDirection || 'DESC';
    const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;

    // Add pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paginationClause = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const queryStr = `
      SELECT
        ai.*,
        p.name as project_name,
        s.name as assigned_to_name,
        s.email as assigned_to_email
      FROM action_items ai
      LEFT JOIN projects p ON ai.project_id = p.id
      LEFT JOIN staff s ON ai.assigned_to = s.id
      ${whereClause}
      ${orderClause}
      ${paginationClause}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM action_items ai
      ${whereClause}
    `;

    try {
      const [itemsResult, countResult] = await Promise.all([
        sql.unsafe(queryStr, params),
        sql.unsafe(countQuery, params.slice(0, -2)) // Exclude pagination params for count
      ]);

      return {
        items: itemsResult.map(this.transformActionItem),
        total: parseInt(countResult[0]?.total || '0')
      };
    } catch (error) {
      console.error('Error fetching action items:', error);
      throw new Error('Failed to fetch action items');
    }
  }

  async getActionItemById(id: string): Promise<ActionItem | null> {
    const sql = getSql();

    try {
      const result = await sql`
        SELECT
          ai.*,
          p.name as project_name,
          s.name as assigned_to_name,
          s.email as assigned_to_email
        FROM action_items ai
        LEFT JOIN projects p ON ai.project_id = p.id
        LEFT JOIN staff s ON ai.assigned_to = s.id
        WHERE ai.id = ${id}
      `;

      return result.length > 0 ? this.transformActionItem(result[0]) : null;
    } catch (error) {
      console.error('Error fetching action item:', error);
      throw new Error('Failed to fetch action item');
    }
  }

  async createActionItem(request: CreateActionItemRequest, userId: string): Promise<ActionItem> {
    const sql = getSql();

    // Validate the request
    const validation = await this.validateActionItem(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate action_id if not provided
    const actionId = request.action_id || await this.generateActionId();

    try {
      const result = await sql`
        INSERT INTO action_items (
          action_id, project_id, related_table, related_id,
          title, description, category, priority, assigned_to,
          due_date, status, created_by, updated_by
        ) VALUES (
          ${actionId},
          ${request.project_id || null},
          ${request.related_table || null},
          ${request.related_id || null},
          ${request.title},
          ${request.description || null},
          ${request.category || 'General'},
          ${request.priority || 'medium'},
          ${request.assigned_to || null},
          ${request.due_date || null},
          ${request.status || 'pending'},
          ${userId},
          ${userId}
        )
        RETURNING *
      `;

      return this.transformActionItem(result[0]);
    } catch (error) {
      console.error('Error creating action item:', error);
      throw new Error('Failed to create action item');
    }
  }

  async updateActionItem(id: string, request: UpdateActionItemRequest, userId: string): Promise<ActionItem> {
    const sql = getSql();

    // Validate the update
    const validation = await this.validateActionItem(request, true);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Build update fields dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (request.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(request.title);
    }
    if (request.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(request.description);
    }
    if (request.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(request.category);
    }
    if (request.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      updateValues.push(request.priority);
    }
    if (request.assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      updateValues.push(request.assigned_to);
    }
    if (request.due_date !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`);
      updateValues.push(request.due_date);
    }
    if (request.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(request.status);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_by and updated_at
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(userId);
    updateFields.push(`updated_at = NOW()`);

    // Add ID parameter
    updateValues.push(id);

    try {
      const result = await sql.unsafe(
        `UPDATE action_items
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );

      if (result.length === 0) {
        throw new Error('Action item not found');
      }

      return this.transformActionItem(result[0]);
    } catch (error) {
      console.error('Error updating action item:', error);
      throw new Error('Failed to update action item');
    }
  }

  async deleteActionItem(id: string): Promise<void> {
    const sql = getSql();

    try {
      const result = await sql`DELETE FROM action_items WHERE id = ${id}`;
      if (result.count === 0) {
        throw new Error('Action item not found');
      }
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw new Error('Failed to delete action item');
    }
  }

  /**
   * ADVANCED BUSINESS LOGIC OPERATIONS
   */

  async bulkUpdateActions(request: BulkActionRequest, userId: string): Promise<{ updated: number; errors: string[] }> {
    const sql = getSql();
    const errors: string[] = [];
    let updated = 0;

    try {
      // Validate the bulk operation
      if (!request.ids || request.ids.length === 0) {
        throw new Error('No action item IDs provided');
      }

      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new Error('No updates provided');
      }

      // Build update fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      Object.entries(request.updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex++}`);
          updateValues.push(value);
        }
      });

      // Add audit fields
      updateFields.push(`updated_by = $${paramIndex++}`);
      updateValues.push(userId);
      updateFields.push(`updated_at = NOW()`);

      // Add IDs parameter
      updateValues.push(request.ids);

      const query = `
        UPDATE action_items
        SET ${updateFields.join(', ')}
        WHERE id = ANY($${paramIndex})
      `;

      const result = await sql.unsafe(query, updateValues);
      updated = result.count;

      return { updated, errors };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { updated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  async escalatePriorities(request: PriorityEscalationRequest): Promise<{ escalated: number; errors: string[] }> {
    const sql = getSql();
    const errors: string[] = [];
    let escalated = 0;

    try {
      // Build conditions for escalation
      const conditions: string[] = [
        'status != \'completed\'',
        'status != \'cancelled\''
      ];

      const params: any[] = [];

      if (request.projectId) {
        conditions.push('project_id = $' + (params.length + 1));
        params.push(request.projectId);
      }

      if (request.overdueOnly) {
        conditions.push('due_date < NOW()');
      }

      if (request.currentPriority) {
        conditions.push('priority = $' + (params.length + 1));
        params.push(request.currentPriority);
      }

      const whereClause = conditions.join(' AND ');

      // Perform escalation
      const result = await sql.unsafe(
        `UPDATE action_items
         SET priority = $${params.length + 1},
             updated_at = NOW(),
             updated_by = $${params.length + 2}
         WHERE ${whereClause}`,
        [...params, request.newPriority, request.userId]
      );

      escalated = result.count;

      return { escalated, errors };
    } catch (error) {
      console.error('Error escalating priorities:', error);
      return { escalated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  async autoAssignActions(request: AutoAssignmentRequest): Promise<{ assigned: number; errors: string[] }> {
    const sql = getSql();
    const errors: string[] = [];
    let assigned = 0;

    try {
      // Build conditions for auto-assignment
      const conditions: string[] = [
        'assigned_to IS NULL',
        'status != \'completed\'',
        'status != \'cancelled\''
      ];

      const params: any[] = [];

      if (request.projectId) {
        conditions.push('project_id = $' + (params.length + 1));
        params.push(request.projectId);
      }

      if (request.category) {
        conditions.push('category = $' + (params.length + 1));
        params.push(request.category);
      }

      if (request.priority && request.priority.length > 0) {
        conditions.push('priority = ANY($' + (params.length + 1) + ')');
        params.push(request.priority);
      }

      const whereClause = conditions.join(' AND ');

      // Get staff member details
      const staffResult = await sql`
        SELECT id, name, email FROM staff WHERE id = ${request.assigneeId}
      `;

      if (staffResult.length === 0) {
        throw new Error('Assignee not found');
      }

      // Perform assignment
      const result = await sql.unsafe(
        `UPDATE action_items
         SET assigned_to = $${params.length + 1},
             updated_at = NOW(),
             updated_by = $${params.length + 2}
         WHERE ${whereClause}`,
        [...params, request.assigneeId, request.userId]
      );

      assigned = result.count;

      return { assigned, errors };
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return { assigned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * VALIDATION AND UTILITY METHODS
   */

  async validateActionItem(item: Partial<CreateActionItemRequest | UpdateActionItemRequest>, isUpdate = false): Promise<ActionItemValidationResult> {
    const errors: string[] = [];

    // Required fields for creation
    if (!isUpdate) {
      if (!item.title || item.title.trim().length === 0) {
        errors.push('Title is required');
      }
    }

    // Title validation
    if (item.title && item.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    // Priority validation
    if (item.priority && !['low', 'medium', 'high'].includes(item.priority)) {
      errors.push('Priority must be low, medium, or high');
    }

    // Status validation
    if (item.status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(item.status)) {
      errors.push('Status must be pending, in_progress, completed, or cancelled');
    }

    // Due date validation
    if (item.due_date) {
      const dueDate = new Date(item.due_date);
      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format');
      }
    }

    // Business rule validation
    if (item.status === 'completed' && item.assigned_to === null) {
      errors.push('Completed items must be assigned to someone');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async generateActionId(): Promise<string> {
    const sql = getSql();

    try {
      // Get the highest existing action_id
      const result = await sql`
        SELECT action_id FROM action_items
        WHERE action_id LIKE 'ACT-%'
        ORDER BY action_id DESC
        LIMIT 1
      `;

      let nextNumber = 1;

      if (result.length > 0) {
        const lastId = result[0].action_id;
        const match = lastId.match(/ACT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `ACT-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating action ID:', error);
      // Fallback to UUID-based generation
      return `ACT-${Date.now()}`;
    }
  }

  private transformActionItem(dbItem: any): ActionItem {
    return {
      id: dbItem.id,
      action_id: dbItem.action_id,
      project_id: dbItem.project_id,
      project_name: dbItem.project_name,
      related_table: dbItem.related_table,
      related_id: dbItem.related_id,
      title: dbItem.title,
      description: dbItem.description,
      category: dbItem.category,
      priority: dbItem.priority,
      assigned_to: dbItem.assigned_to,
      assigned_to_name: dbItem.assigned_to_name,
      assigned_to_email: dbItem.assigned_to_email,
      due_date: dbItem.due_date,
      status: dbItem.status,
      created_by: dbItem.created_by,
      updated_by: dbItem.updated_by,
      created_at: dbItem.created_at,
      updated_at: dbItem.updated_at
    };
  }

  /**
   * NOTIFICATION AND REMINDER METHODS
   */

  async getOverdueActions(): Promise<ActionItem[]> {
    const sql = getSql();

    try {
      const result = await sql`
        SELECT
          ai.*,
          p.name as project_name,
          s.name as assigned_to_name,
          s.email as assigned_to_email
        FROM action_items ai
        LEFT JOIN projects p ON ai.project_id = p.id
        LEFT JOIN staff s ON ai.assigned_to = s.id
        WHERE ai.due_date < NOW()
          AND ai.status != 'completed'
          AND ai.status != 'cancelled'
        ORDER BY ai.due_date ASC
      `;

      return result.map(this.transformActionItem);
    } catch (error) {
      console.error('Error fetching overdue actions:', error);
      throw new Error('Failed to fetch overdue actions');
    }
  }

  async getUpcomingActions(daysAhead: number = 7): Promise<ActionItem[]> {
    const sql = getSql();

    try {
      const result = await sql`
        SELECT
          ai.*,
          p.name as project_name,
          s.name as assigned_to_name,
          s.email as assigned_to_email
        FROM action_items ai
        LEFT JOIN projects p ON ai.project_id = p.id
        LEFT JOIN staff s ON ai.assigned_to = s.id
        WHERE ai.due_date >= NOW()
          AND ai.due_date <= NOW() + INTERVAL '${daysAhead} days'
          AND ai.status != 'completed'
          AND ai.status != 'cancelled'
        ORDER BY ai.due_date ASC
      `;

      return result.map(this.transformActionItem);
    } catch (error) {
      console.error('Error fetching upcoming actions:', error);
      throw new Error('Failed to fetch upcoming actions');
    }
  }

  async getActionsByAssignee(assigneeId: string): Promise<ActionItem[]> {
    const sql = getSql();

    try {
      const result = await sql`
        SELECT
          ai.*,
          p.name as project_name,
          s.name as assigned_to_name,
          s.email as assigned_to_email
        FROM action_items ai
        LEFT JOIN projects p ON ai.project_id = p.id
        LEFT JOIN staff s ON ai.assigned_to = s.id
        WHERE ai.assigned_to = ${assigneeId}
          AND ai.status != 'completed'
          AND ai.status != 'cancelled'
        ORDER BY ai.due_date ASC, ai.priority DESC
      `;

      return result.map(this.transformActionItem);
    } catch (error) {
      console.error('Error fetching actions by assignee:', error);
      throw new Error('Failed to fetch actions by assignee');
    }
  }
}

// Export singleton instance
export const actionItemsService = new ActionItemsService();