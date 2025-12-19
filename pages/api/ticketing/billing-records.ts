// pages/api/ticketing/billing-records.ts
// Manage billing records for tickets
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { TicketBilling } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  if (req.method === 'GET') {
    return handleGetBillingRecords(req, res, userId);
  }

  if (req.method === 'POST') {
    return handleCreateBillingRecord(req, res, userId);
  }

  return apiResponse.methodNotAllowed(res, ['GET', 'POST']);
}

async function handleGetBillingRecords(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      billing_type,
      approval_status,
      project_id,
      start_date,
      end_date,
      limit = '50',
      offset = '0',
    } = req.query;

    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (ticket_id) {
      whereConditions.push(`tb.ticket_id = $${paramIndex}`);
      params.push(ticket_id);
      paramIndex++;
    }

    if (billing_type) {
      whereConditions.push(`tb.billing_type = $${paramIndex}`);
      params.push(billing_type);
      paramIndex++;
    }

    if (approval_status) {
      whereConditions.push(`tb.approval_status = $${paramIndex}`);
      params.push(approval_status);
      paramIndex++;
    }

    if (project_id) {
      whereConditions.push(`t.project_id = $${paramIndex}`);
      params.push(project_id);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`tb.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`tb.created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const perPage = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const whereSQL =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ticket_billing tb
      INNER JOIN tickets t ON tb.ticket_id = t.id
      ${whereSQL}
    `;

    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(perPage);
    const limitParam = paramIndex;
    paramIndex++;

    params.push(offsetNum);
    const offsetParam = paramIndex;

    const query = `
      SELECT tb.*, t.project_id, t.title, t.status
      FROM ticket_billing tb
      INNER JOIN tickets t ON tb.ticket_id = t.id
      ${whereSQL}
      ORDER BY tb.created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, params);
    const billingRecords = result.rows as TicketBilling[];

    const page = Math.floor(offsetNum / perPage) + 1;
    const totalPages = Math.ceil(total / perPage);

    return apiResponse.success(res, {
      data: billingRecords,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateBillingRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      billing_type,
      base_cost,
      labor_hours,
      labor_cost,
      materials_cost,
      travel_cost,
      other_costs,
      total_cost,
      notes,
    } = req.body;

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!billing_type) {
      return apiResponse.badRequest(res, 'billing_type is required');
    }

    const checkQuery = `SELECT id FROM tickets WHERE id = $1`;
    const checkResult = await sql.query(checkQuery, [ticket_id]);

    if (checkResult.rows.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticket_id);
    }

    const existingQuery = `SELECT id FROM ticket_billing WHERE ticket_id = $1`;
    const existingResult = await sql.query(existingQuery, [ticket_id]);

    if (existingResult.rows.length > 0) {
      return apiResponse.badRequest(
        res,
        'Billing record already exists for this ticket'
      );
    }

    const insertQuery = `
      INSERT INTO ticket_billing (
        ticket_id,
        billing_type,
        base_cost,
        labor_hours,
        labor_cost,
        materials_cost,
        travel_cost,
        other_costs,
        total_cost,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await sql.query(insertQuery, [
      ticket_id,
      billing_type,
      base_cost || null,
      labor_hours || null,
      labor_cost || null,
      materials_cost || null,
      travel_cost || null,
      other_costs || null,
      total_cost,
      notes || null,
      userId,
    ]);

    const billingRecord = result.rows[0] as TicketBilling;

    return apiResponse.success(
      res,
      billingRecord,
      'Billing record created successfully',
      201
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
