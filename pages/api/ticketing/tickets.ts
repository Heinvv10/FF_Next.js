// pages/api/ticketing/tickets.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type {
  Ticket,
  CreateTicketInput,
  TicketFilters,
  TicketListResponse,
} from '@/modules/ticketing/types';

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
    return handleGetTickets(req, res, userId);
  }

  if (req.method === 'POST') {
    return handleCreateTicket(req, res, userId);
  }

  return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST']);
}

async function handleGetTickets(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      source,
      status,
      priority,
      type,
      assigned_to,
      created_by,
      project_id,
      billing_type,
      sla_breached,
      created_after,
      created_before,
      due_before,
      tags,
      search,
      page = '1',
      per_page = '50',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const perPage = parseInt(per_page, 10);
    const offset = (pageNum - 1) * perPage;

    const filters: TicketFilters = {};
    const whereClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (source) {
      const sources = source.split(',');
      whereClauses.push(`source = ANY($${paramIndex})`);
      params.push(sources);
      paramIndex++;
      filters.source = sources as Ticket['source'][];
    }

    if (status) {
      const statuses = status.split(',');
      whereClauses.push(`status = ANY($${paramIndex})`);
      params.push(statuses);
      paramIndex++;
      filters.status = statuses as Ticket['status'][];
    }

    if (priority) {
      const priorities = priority.split(',');
      whereClauses.push(`priority = ANY($${paramIndex})`);
      params.push(priorities);
      paramIndex++;
      filters.priority = priorities as Ticket['priority'][];
    }

    if (type) {
      whereClauses.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
      filters.type = type as Ticket['type'];
    }

    if (assigned_to) {
      whereClauses.push(`assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
      filters.assigned_to = assigned_to;
    }

    if (created_by) {
      whereClauses.push(`created_by = $${paramIndex}`);
      params.push(created_by);
      paramIndex++;
      filters.created_by = created_by;
    }

    if (project_id) {
      whereClauses.push(`project_id = $${paramIndex}`);
      params.push(project_id);
      paramIndex++;
      filters.project_id = project_id;
    }

    if (billing_type) {
      whereClauses.push(`billing_type = $${paramIndex}`);
      params.push(billing_type);
      paramIndex++;
      filters.billing_type = billing_type as Ticket['billing_type'];
    }

    if (sla_breached) {
      whereClauses.push(`sla_breached = $${paramIndex}`);
      params.push(sla_breached === 'true');
      paramIndex++;
      filters.sla_breached = sla_breached === 'true';
    }

    if (created_after) {
      whereClauses.push(`created_at >= $${paramIndex}`);
      params.push(created_after);
      paramIndex++;
      filters.created_after = created_after;
    }

    if (created_before) {
      whereClauses.push(`created_at <= $${paramIndex}`);
      params.push(created_before);
      paramIndex++;
      filters.created_before = created_before;
    }

    if (due_before) {
      whereClauses.push(`due_at <= $${paramIndex}`);
      params.push(due_before);
      paramIndex++;
      filters.due_before = due_before;
    }

    if (tags) {
      const tagList = tags.split(',');
      whereClauses.push(`tags && $${paramIndex}`);
      params.push(tagList);
      paramIndex++;
      filters.tags = tagList;
    }

    if (search) {
      whereClauses.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR ticket_uid ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
      filters.search = search;
    }

    const whereSQL =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM tickets ${whereSQL}`;
    const countResult = await sql(countQuery, params);
    const total = parseInt(countResult[0].total as string, 10);

    params.push(perPage);
    const limitParam = paramIndex++;
    params.push(offset);
    const offsetParam = paramIndex++;

    const ticketsQuery = `
      SELECT * FROM tickets
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const tickets = (await sql(ticketsQuery, params)) as Ticket[];

    const response: TicketListResponse = {
      data: tickets,
      total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
      filters_applied: filters,
    };

    return apiResponse.success(res, response);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as CreateTicketInput;

    if (!input.source) {
      return apiResponse.badRequest(res, 'source is required');
    }

    if (!input.title) {
      return apiResponse.badRequest(res, 'title is required');
    }

    const {
      source,
      title,
      ticket_uid,
      external_id,
      description,
      priority = 'medium',
      type,
      assigned_to,
      project_id,
      dr_number,
      client_name,
      client_contact,
      client_email,
      address,
      gps_coordinates,
      tags = [],
    } = input;

    const insertQuery = `
      INSERT INTO tickets (
        ticket_uid,
        source,
        external_id,
        title,
        description,
        priority,
        type,
        assigned_to,
        created_by,
        project_id,
        dr_number,
        client_name,
        client_contact,
        client_email,
        address,
        gps_coordinates,
        tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const params = [
      ticket_uid || null,
      source,
      external_id || null,
      title,
      description || null,
      priority,
      type || null,
      assigned_to || null,
      userId,
      project_id || null,
      dr_number || null,
      client_name || null,
      client_contact || null,
      client_email || null,
      address || null,
      gps_coordinates || null,
      tags,
    ];

    const result = await sql(insertQuery, params);
    const ticket = result[0] as Ticket;

    return apiResponse.success(res, ticket, 'Ticket created successfully', 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiResponse.conflict(res, 'Ticket UID already exists');
    }

    return apiResponse.internalError(res, error);
  }
}
