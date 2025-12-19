// pages/api/ticketing/tickets-stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

interface TicketStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_source: Record<string, number>;
  by_billing_type: Record<string, number>;
  open_tickets: number;
  overdue_tickets: number;
  average_resolution_time_hours: number | null;
  sla_breach_count: number;
}

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

  return handleGetStats(req, res, userId);
}

async function handleGetStats(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      project_id,
      assigned_to,
      created_by,
      start_date,
      end_date,
    } = req.query;

    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      params.push(project_id);
      paramIndex++;
    }

    if (assigned_to) {
      whereConditions.push(`assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }

    if (created_by) {
      whereConditions.push(`created_by = $${paramIndex}`);
      params.push(created_by);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const whereSQL = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const totalQuery = `SELECT COUNT(*) as total FROM tickets ${whereSQL}`;
    const totalResult = await sql.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].total, 10);

    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY status
    `;
    const statusResult = await sql.query(statusQuery, params);
    const by_status: Record<string, number> = {};
    statusResult.rows.forEach((row: any) => {
      by_status[row.status] = parseInt(row.count, 10);
    });

    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY priority
    `;
    const priorityResult = await sql.query(priorityQuery, params);
    const by_priority: Record<string, number> = {};
    priorityResult.rows.forEach((row: any) => {
      by_priority[row.priority] = parseInt(row.count, 10);
    });

    const sourceQuery = `
      SELECT source, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY source
    `;
    const sourceResult = await sql.query(sourceQuery, params);
    const by_source: Record<string, number> = {};
    sourceResult.rows.forEach((row: any) => {
      by_source[row.source] = parseInt(row.count, 10);
    });

    const billingTypeQuery = `
      SELECT billing_type, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY billing_type
    `;
    const billingTypeResult = await sql.query(billingTypeQuery, params);
    const by_billing_type: Record<string, number> = {};
    billingTypeResult.rows.forEach((row: any) => {
      by_billing_type[row.billing_type] = parseInt(row.count, 10);
    });

    const openStatusConditions = whereConditions.length > 0
      ? `${whereConditions.join(' AND ')} AND status NOT IN ('closed', 'cancelled', 'resolved')`
      : `WHERE status NOT IN ('closed', 'cancelled', 'resolved')`;

    const openTicketsQuery = `SELECT COUNT(*) as count FROM tickets ${openStatusConditions}`;
    const openTicketsResult = await sql.query(openTicketsQuery, params);
    const open_tickets = parseInt(openTicketsResult.rows[0].count, 10);

    const overdueConditions = whereConditions.length > 0
      ? `${whereConditions.join(' AND ')} AND due_at < NOW() AND status NOT IN ('closed', 'cancelled', 'resolved')`
      : `WHERE due_at < NOW() AND status NOT IN ('closed', 'cancelled', 'resolved')`;

    const overdueQuery = `SELECT COUNT(*) as count FROM tickets ${overdueConditions}`;
    const overdueResult = await sql.query(overdueQuery, params);
    const overdue_tickets = parseInt(overdueResult.rows[0].count, 10);

    const avgResolutionQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
      FROM tickets
      ${whereSQL}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} resolved_at IS NOT NULL
    `;
    const avgResolutionResult = await sql.query(avgResolutionQuery, params);
    const average_resolution_time_hours = avgResolutionResult.rows[0].avg_hours
      ? parseFloat(avgResolutionResult.rows[0].avg_hours)
      : null;

    const slaBreachQuery = `
      SELECT COUNT(*) as count
      FROM tickets
      ${whereSQL}
      ${whereConditions.length > 0 ? 'AND' : 'WHERE'} sla_breached = TRUE
    `;
    const slaBreachResult = await sql.query(slaBreachQuery, params);
    const sla_breach_count = parseInt(slaBreachResult.rows[0].count, 10);

    const stats: TicketStats = {
      total,
      by_status,
      by_priority,
      by_source,
      by_billing_type,
      open_tickets,
      overdue_tickets,
      average_resolution_time_hours,
      sla_breach_count,
    };

    return apiResponse.success(res, stats);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
