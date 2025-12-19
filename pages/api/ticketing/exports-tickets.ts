// pages/api/ticketing/exports-tickets.ts
// Export tickets to CSV format
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

  return handleExportTickets(req, res);
}

async function handleExportTickets(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      format = 'csv',
      status,
      priority,
      source,
      billing_type,
      created_after,
      created_before,
      project_id,
    } = req.query as Record<string, string>;

    // Build query with filters
    const whereClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      whereClauses.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (source) {
      whereClauses.push(`source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    if (billing_type) {
      whereClauses.push(`billing_type = $${paramIndex}`);
      params.push(billing_type);
      paramIndex++;
    }

    if (created_after) {
      whereClauses.push(`created_at >= $${paramIndex}`);
      params.push(created_after);
      paramIndex++;
    }

    if (created_before) {
      whereClauses.push(`created_at <= $${paramIndex}`);
      params.push(created_before);
      paramIndex++;
    }

    if (project_id) {
      whereClauses.push(`project_id = $${paramIndex}`);
      params.push(project_id);
      paramIndex++;
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const ticketsQuery = `
      SELECT
        ticket_uid,
        title,
        description,
        source,
        status,
        priority,
        type,
        billing_type,
        estimated_cost,
        actual_cost,
        dr_number,
        client_name,
        client_contact,
        client_email,
        address,
        project_id,
        sla_breached,
        created_at,
        updated_at,
        resolved_at,
        closed_at
      FROM tickets
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT 10000
    `;

    const tickets = await sql(ticketsQuery, params);

    if (format === 'json') {
      return apiResponse.success(res, {
        data: tickets,
        total: tickets.length,
        exported_at: new Date().toISOString(),
      });
    }

    // Generate CSV
    const headers = [
      'Ticket UID',
      'Title',
      'Description',
      'Source',
      'Status',
      'Priority',
      'Type',
      'Billing Type',
      'Estimated Cost',
      'Actual Cost',
      'DR Number',
      'Client Name',
      'Client Contact',
      'Client Email',
      'Address',
      'Project ID',
      'SLA Breached',
      'Created At',
      'Updated At',
      'Resolved At',
      'Closed At',
    ];

    const csvRows = [headers.join(',')];

    for (const ticket of tickets) {
      const row = [
        escapeCSV(ticket.ticket_uid),
        escapeCSV(ticket.title),
        escapeCSV(ticket.description),
        escapeCSV(ticket.source),
        escapeCSV(ticket.status),
        escapeCSV(ticket.priority),
        escapeCSV(ticket.type),
        escapeCSV(ticket.billing_type),
        ticket.estimated_cost || '',
        ticket.actual_cost || '',
        escapeCSV(ticket.dr_number),
        escapeCSV(ticket.client_name),
        escapeCSV(ticket.client_contact),
        escapeCSV(ticket.client_email),
        escapeCSV(ticket.address),
        escapeCSV(ticket.project_id),
        ticket.sla_breached ? 'Yes' : 'No',
        formatDate(ticket.created_at),
        formatDate(ticket.updated_at),
        formatDate(ticket.resolved_at),
        formatDate(ticket.closed_at),
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    return new Date(value as string).toISOString();
  } catch {
    return '';
  }
}
