// pages/api/ticketing/tickets-history.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { TicketHistory } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, ['GET']);
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  return handleGetHistory(req, res, userId);
}

async function handleGetHistory(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      action,
      changed_by,
      start_date,
      end_date,
      limit = '50',
      offset = '0',
    } = req.query;

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id query parameter is required');
    }

    const whereConditions: string[] = ['ticket_id = $1'];
    const params: unknown[] = [ticket_id];
    let paramIndex = 2;

    if (action) {
      whereConditions.push(`action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (changed_by) {
      whereConditions.push(`changed_by = $${paramIndex}`);
      params.push(changed_by);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`changed_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`changed_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const perPage = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const whereSQL = whereConditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM ticket_history WHERE ${whereSQL}`;
    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(perPage);
    const limitParam = paramIndex;
    paramIndex++;

    params.push(offsetNum);
    const offsetParam = paramIndex;

    const query = `
      SELECT * FROM ticket_history
      WHERE ${whereSQL}
      ORDER BY changed_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, params);
    const history = result.rows as TicketHistory[];

    const page = Math.floor(offsetNum / perPage) + 1;
    const totalPages = Math.ceil(total / perPage);

    return apiResponse.success(res, {
      data: history,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
