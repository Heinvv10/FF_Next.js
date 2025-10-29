import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import {
  ActionItem,
  ActionItemCreateInput,
  ActionItemFilters,
  ActionItemStats,
} from '@/types/action-items.types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - List action items with filters
  if (req.method === 'GET') {
    try {
      const {
        status,
        assignee_name,
        meeting_id,
        priority,
        search,
        overdue,
      } = req.query as Partial<Record<keyof ActionItemFilters, string>>;

      // Build query with filters
      let query = sql`
        SELECT
          ai.id,
          ai.meeting_id,
          ai.description,
          ai.assignee_name,
          ai.assignee_email,
          ai.status,
          ai.priority,
          ai.due_date,
          ai.completed_date,
          ai.mentioned_at,
          ai.created_at,
          ai.updated_at,
          ai.tags,
          ai.notes,
          m.title as meeting_title,
          m.meeting_date
        FROM meeting_action_items ai
        LEFT JOIN meetings m ON ai.meeting_id = m.id
        WHERE 1=1
      `;

      // Add filters
      if (status) {
        const statuses = status.split(',');
        query = sql`${query} AND ai.status = ANY(${statuses})`;
      }

      if (assignee_name) {
        query = sql`${query} AND ai.assignee_name ILIKE ${'%' + assignee_name + '%'}`;
      }

      if (meeting_id) {
        query = sql`${query} AND ai.meeting_id = ${parseInt(meeting_id)}`;
      }

      if (priority) {
        query = sql`${query} AND ai.priority = ${priority}`;
      }

      if (search) {
        query = sql`${query} AND ai.description ILIKE ${'%' + search + '%'}`;
      }

      if (overdue === 'true') {
        query = sql`${query} AND ai.due_date < NOW() AND ai.status != 'completed'`;
      }

      // Add ordering and limit
      const items = await sql`
        ${query}
        ORDER BY
          CASE
            WHEN ai.status = 'pending' THEN 1
            WHEN ai.status = 'in_progress' THEN 2
            WHEN ai.status = 'completed' THEN 3
            WHEN ai.status = 'cancelled' THEN 4
          END,
          ai.priority DESC,
          ai.due_date ASC NULLS LAST,
          ai.created_at DESC
        LIMIT 100
      `;

      return apiResponse.success(res, items as ActionItem[]);
    } catch (error: any) {
      console.error('Error fetching action items:', error);
      return apiResponse.internalError(res, error);
    }
  }

  // POST - Create new action item
  if (req.method === 'POST') {
    try {
      const input: ActionItemCreateInput = req.body;

      if (!input.meeting_id || !input.description) {
        return apiResponse.validationError(res, {
          meeting_id: !input.meeting_id ? 'Meeting ID is required' : undefined,
          description: !input.description ? 'Description is required' : undefined,
        });
      }

      const [item] = await sql`
        INSERT INTO meeting_action_items (
          meeting_id,
          description,
          assignee_name,
          assignee_email,
          status,
          priority,
          due_date,
          mentioned_at,
          tags,
          notes
        ) VALUES (
          ${input.meeting_id},
          ${input.description},
          ${input.assignee_name || null},
          ${input.assignee_email || null},
          ${input.status || 'pending'},
          ${input.priority || 'medium'},
          ${input.due_date || null},
          ${input.mentioned_at || null},
          ${input.tags || null},
          ${input.notes || null}
        )
        RETURNING *
      `;

      return apiResponse.created(res, item, 'Action item created successfully');
    } catch (error: any) {
      console.error('Error creating action item:', error);
      return apiResponse.internalError(res, error);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
