// pages/api/ticketing/tickets-attachments.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { TicketAttachment, CreateTicketAttachmentInput } from '@/modules/ticketing/types';

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
    return handleGetAttachments(req, res, userId);
  }

  if (req.method === 'POST') {
    return handleCreateAttachment(req, res, userId);
  }

  return apiResponse.methodNotAllowed(res, ['GET', 'POST']);
}

async function handleGetAttachments(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      file_type,
      limit = '50',
      offset = '0',
    } = req.query;

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id query parameter is required');
    }

    const whereConditions: string[] = ['ticket_id = $1'];
    const params: unknown[] = [ticket_id];
    let paramIndex = 2;

    if (file_type) {
      whereConditions.push(`file_type = $${paramIndex}`);
      params.push(file_type);
      paramIndex++;
    }

    const perPage = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const whereSQL = whereConditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM ticket_attachments WHERE ${whereSQL}`;
    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(perPage);
    const limitParam = paramIndex;
    paramIndex++;

    params.push(offsetNum);
    const offsetParam = paramIndex;

    const query = `
      SELECT * FROM ticket_attachments
      WHERE ${whereSQL}
      ORDER BY uploaded_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, params);
    const attachments = result.rows as TicketAttachment[];

    const page = Math.floor(offsetNum / perPage) + 1;
    const totalPages = Math.ceil(total / perPage);

    return apiResponse.success(res, {
      data: attachments,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateAttachment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as CreateTicketAttachmentInput;

    if (!input.ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!input.file_name) {
      return apiResponse.badRequest(res, 'file_name is required');
    }

    if (!input.file_url) {
      return apiResponse.badRequest(res, 'file_url is required');
    }

    const checkQuery = `SELECT id FROM tickets WHERE id = $1`;
    const checkResult = await sql.query(checkQuery, [input.ticket_id]);

    if (checkResult.rows.length === 0) {
      return apiResponse.notFound(res, 'Ticket', input.ticket_id);
    }

    const insertQuery = `
      INSERT INTO ticket_attachments (
        ticket_id,
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_by,
        description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await sql.query(insertQuery, [
      input.ticket_id,
      input.file_name,
      input.file_url,
      input.file_type || null,
      input.file_size || null,
      userId,
      input.description || null,
    ]);

    const attachment = result.rows[0] as TicketAttachment;

    return apiResponse.success(
      res,
      attachment,
      'Attachment created successfully',
      201
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
