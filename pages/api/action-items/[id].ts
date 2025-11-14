import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { ActionItemUpdateInput } from '@/types/action-items.types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return apiResponse.validationError(res, { id: 'Invalid action item ID' });
  }

  // GET - Fetch single action item
  if (req.method === 'GET') {
    try {
      const item = await sql`
        SELECT
          ai.*,
          m.title as meeting_title,
          m.meeting_date,
          m.transcript_url
        FROM meeting_action_items ai
        LEFT JOIN meetings m ON ai.meeting_id = m.id
        WHERE ai.id = ${id}
      `;

      if (!item || item.length === 0) {
        return apiResponse.notFound(res, 'Action item', id);
      }

      return apiResponse.success(res, item[0]);
    } catch (error: any) {
      console.error('Error fetching action item:', error);
      return apiResponse.internalError(res, error);
    }
  }

  // PATCH - Update action item
  if (req.method === 'PATCH') {
    try {
      const updates: ActionItemUpdateInput = req.body;

      // Build dynamic SET clause
      const setClauses: string[] = ['updated_at = NOW()'];
      const fields: Record<string, any> = {};

      if (updates.description !== undefined) {
        fields.description = updates.description;
      }
      if (updates.assignee_name !== undefined) {
        fields.assignee_name = updates.assignee_name;
      }
      if (updates.assignee_email !== undefined) {
        fields.assignee_email = updates.assignee_email;
      }
      if (updates.status !== undefined) {
        fields.status = updates.status;
        // Auto-set completed_date when status changes to completed
        if (updates.status === 'completed' && !updates.completed_date) {
          fields.completed_date = new Date().toISOString();
        }
      }
      if (updates.priority !== undefined) {
        fields.priority = updates.priority;
      }
      if (updates.due_date !== undefined) {
        fields.due_date = updates.due_date;
      }
      if (updates.completed_date !== undefined) {
        fields.completed_date = updates.completed_date;
      }
      if (updates.tags !== undefined) {
        fields.tags = updates.tags;
      }
      if (updates.notes !== undefined) {
        fields.notes = updates.notes;
      }

      if (Object.keys(fields).length === 0) {
        return apiResponse.validationError(res, { updates: 'No fields to update' });
      }

      // Build UPDATE query dynamically
      // Neon serverless requires tagged templates, so we build the query conditionally
      let query = 'UPDATE meeting_action_items SET updated_at = NOW()';
      const values: any[] = [];

      if (fields.description !== undefined) {
        values.push(fields.description);
        query += `, description = $${values.length}`;
      }
      if (fields.assignee_name !== undefined) {
        values.push(fields.assignee_name);
        query += `, assignee_name = $${values.length}`;
      }
      if (fields.assignee_email !== undefined) {
        values.push(fields.assignee_email);
        query += `, assignee_email = $${values.length}`;
      }
      if (fields.status !== undefined) {
        values.push(fields.status);
        query += `, status = $${values.length}`;
      }
      if (fields.priority !== undefined) {
        values.push(fields.priority);
        query += `, priority = $${values.length}`;
      }
      if (fields.due_date !== undefined) {
        values.push(fields.due_date);
        query += `, due_date = $${values.length}`;
      }
      if (fields.completed_date !== undefined) {
        values.push(fields.completed_date);
        query += `, completed_date = $${values.length}`;
      }
      if (fields.tags !== undefined) {
        values.push(fields.tags);
        query += `, tags = $${values.length}`;
      }
      if (fields.notes !== undefined) {
        values.push(fields.notes);
        query += `, notes = $${values.length}`;
      }

      values.push(id);
      query += ` WHERE id = $${values.length} RETURNING *`;

      // Execute using neon's query method for parameterized queries
      const result = await sql(query, values);

      if (!result || result.length === 0) {
        return apiResponse.notFound(res, 'Action item', id);
      }

      return apiResponse.success(res, result[0], 'Action item updated successfully');
    } catch (error: any) {
      console.error('Error updating action item:', error);
      return apiResponse.internalError(res, error);
    }
  }

  // DELETE - Delete action item
  if (req.method === 'DELETE') {
    try {
      const [deleted] = await sql`
        DELETE FROM meeting_action_items
        WHERE id = ${id}
        RETURNING id
      `;

      if (!deleted) {
        return apiResponse.notFound(res, 'Action item', id);
      }

      return apiResponse.success(res, { id: deleted.id }, 'Action item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting action item:', error);
      return apiResponse.internalError(res, error);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
