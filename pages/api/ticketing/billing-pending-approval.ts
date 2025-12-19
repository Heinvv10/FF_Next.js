// pages/api/ticketing/billing-pending-approval.ts
// Get tickets pending billing approval
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

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

  return handleGetPendingApprovals(req, res);
}

async function handleGetPendingApprovals(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { page = '1', per_page = '50' } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const perPage = parseInt(per_page, 10);
    const offset = (pageNum - 1) * perPage;

    // Count total pending
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tickets t
      WHERE t.requires_billing_approval = TRUE
        AND t.status = 'pending_approval'
    `;

    const countResult = await sql(countQuery);
    const total = parseInt(countResult[0].total as string, 10);

    // Get pending tickets with billing info
    const ticketsQuery = `
      SELECT
        t.id,
        t.ticket_uid,
        t.title,
        t.description,
        t.source,
        t.status,
        t.priority,
        t.billing_type,
        t.estimated_cost,
        t.dr_number,
        t.client_name,
        t.project_id,
        t.created_at,
        t.created_by,
        tb.total_cost,
        tb.billable_hours,
        tb.parts_cost,
        tb.travel_cost,
        tb.notes as billing_notes
      FROM tickets t
      LEFT JOIN ticket_billing tb ON tb.ticket_id = t.id
      WHERE t.requires_billing_approval = TRUE
        AND t.status = 'pending_approval'
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const tickets = await sql(ticketsQuery, [perPage, offset]);

    const response = {
      data: tickets,
      total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };

    return apiResponse.success(res, response);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
