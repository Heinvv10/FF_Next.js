// src/modules/ticketing/services/ticketService.ts
// Core CRUD operations for tickets
import { neon } from '@neondatabase/serverless';
import type { Ticket, TicketSource, CreateTicketInput, UpdateTicketInput } from '../types';
import { BillingCalculator } from './billingCalculator';
import { SLACalculator } from './slaCalculator';
import { DRLookupService } from './drLookupService';

const sql = neon(process.env.DATABASE_URL!);

export interface TicketWithRelations extends Ticket {
  notes?: Array<{
    id: string;
    content: string;
    note_type: string;
    created_by: string;
    created_at: Date;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    file_url: string;
    file_type: string;
    uploaded_at: Date;
  }>;
  history?: Array<{
    id: string;
    action: string;
    field_changed: string;
    old_value: string;
    new_value: string;
    changed_at: Date;
  }>;
}

export class TicketService {
  /**
   * Create a new ticket
   * Auto-generates UID, calculates billing type, and sets SLA deadlines
   */
  static async createTicket(
    input: CreateTicketInput,
    createdBy: string
  ): Promise<Ticket> {
    // If DR number provided, lookup and auto-populate fields
    let drData = null;
    if (input.dr_number) {
      drData = await DRLookupService.lookupDR(input.dr_number);
      if (drData.exists) {
        input.project_id = drData.project_id || input.project_id;
        input.address = drData.address || input.address;
        if (drData.coordinates) {
          input.gps_coordinates = `${drData.coordinates.lat},${drData.coordinates.lon}`;
        }
      }
    }

    // Calculate billing type
    const billingResult = await BillingCalculator.calculateBilling({
      project_id: input.project_id || '',
      ticket_type: input.type || 'other',
      priority: input.priority,
      dr_number: input.dr_number,
      service_type: input.type,
    });

    // Calculate SLA deadline
    const slaConfig = await this.getDefaultSLAConfig(input.type || 'other', input.priority);
    const dueAt = slaConfig
      ? new Date(Date.now() + slaConfig.resolution_hours * 60 * 60 * 1000)
      : null;

    const insertQuery = `
      INSERT INTO tickets (
        source,
        external_id,
        title,
        description,
        status,
        priority,
        type,
        created_by,
        project_id,
        dr_number,
        client_name,
        client_contact,
        client_email,
        address,
        gps_coordinates,
        billing_type,
        requires_billing_approval,
        estimated_cost,
        due_at,
        tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const result = await sql.query(insertQuery, [
      input.source,
      input.external_id || null,
      input.title,
      input.description || null,
      input.status || 'new',
      input.priority,
      input.type || null,
      createdBy,
      input.project_id || null,
      input.dr_number || null,
      input.client_name || null,
      input.client_contact || null,
      input.client_email || null,
      input.address || null,
      input.gps_coordinates || null,
      billingResult.billing_type,
      billingResult.requires_approval || false,
      billingResult.estimated_cost || null,
      dueAt,
      input.tags || null,
    ]);

    return result.rows[0] as Ticket;
  }

  /**
   * Get a single ticket by ID or ticket_uid
   */
  static async getTicket(
    idOrUid: string,
    includeRelations = true
  ): Promise<TicketWithRelations | null> {
    const isUid = idOrUid.startsWith('TKT-') || idOrUid.startsWith('FT');
    const whereClause = isUid ? 'ticket_uid = $1' : 'id = $1';

    const ticketQuery = `SELECT * FROM tickets WHERE ${whereClause}`;
    const ticketResult = await sql.query(ticketQuery, [idOrUid]);

    if (ticketResult.rows.length === 0) {
      return null;
    }

    const ticket = ticketResult.rows[0] as TicketWithRelations;

    if (includeRelations) {
      // Fetch notes
      const notesQuery = `
        SELECT id, content, note_type, created_by, created_at
        FROM ticket_notes
        WHERE ticket_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;
      const notesResult = await sql.query(notesQuery, [ticket.id]);
      ticket.notes = notesResult.rows;

      // Fetch attachments
      const attachmentsQuery = `
        SELECT id, filename, file_url, file_type, uploaded_at
        FROM ticket_attachments
        WHERE ticket_id = $1
        ORDER BY uploaded_at DESC
      `;
      const attachmentsResult = await sql.query(attachmentsQuery, [ticket.id]);
      ticket.attachments = attachmentsResult.rows;

      // Fetch history
      const historyQuery = `
        SELECT id, action, field_changed, old_value, new_value, changed_at
        FROM ticket_history
        WHERE ticket_id = $1
        ORDER BY changed_at DESC
        LIMIT 100
      `;
      const historyResult = await sql.query(historyQuery, [ticket.id]);
      ticket.history = historyResult.rows;
    }

    return ticket;
  }

  /**
   * Update a ticket
   */
  static async updateTicket(
    id: string,
    updates: UpdateTicketInput,
    updatedBy: string
  ): Promise<Ticket | null> {
    const ticket = await this.getTicket(id, false);
    if (!ticket) {
      return null;
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'type',
      'assigned_to',
      'project_id',
      'dr_number',
      'client_name',
      'client_contact',
      'client_email',
      'address',
      'gps_coordinates',
      'billing_type',
      'requires_billing_approval',
      'estimated_cost',
      'actual_cost',
      'billing_notes',
      'due_at',
      'sla_pause_reason',
      'tags',
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = $${paramIndex}`);
        queryParams.push((updates as Record<string, unknown>)[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return ticket;
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);

    // Add ticket ID for WHERE clause
    queryParams.push(ticket.id);

    const updateQuery = `
      UPDATE tickets
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(updateQuery, queryParams);
    return result.rows[0] as Ticket;
  }

  /**
   * Delete a ticket (soft delete by setting status to 'cancelled')
   */
  static async deleteTicket(id: string, deletedBy: string): Promise<boolean> {
    const ticket = await this.getTicket(id, false);
    if (!ticket) {
      return false;
    }

    // Soft delete - set status to cancelled
    const updateQuery = `
      UPDATE tickets
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
    `;

    await sql.query(updateQuery, [ticket.id]);

    // Log deletion in history
    const historyQuery = `
      INSERT INTO ticket_history (ticket_id, action, changed_by, change_reason)
      VALUES ($1, 'closed', $2, 'Ticket deleted')
    `;

    await sql.query(historyQuery, [ticket.id, deletedBy]);

    return true;
  }

  /**
   * Hard delete a ticket (permanent removal)
   */
  static async hardDeleteTicket(id: string): Promise<boolean> {
    const deleteQuery = `DELETE FROM tickets WHERE id = $1 OR ticket_uid = $1`;
    const result = await sql.query(deleteQuery, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Assign a ticket to a user
   */
  static async assignTicket(
    ticketId: string,
    assignedTo: string,
    assignedBy: string,
    reason?: string
  ): Promise<Ticket | null> {
    const ticket = await this.getTicket(ticketId, false);
    if (!ticket) {
      return null;
    }

    const previousAssignee = ticket.assigned_to;

    // Update ticket
    const updateQuery = `
      UPDATE tickets
      SET assigned_to = $1, status = CASE WHEN status = 'new' THEN 'assigned' ELSE status END, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await sql.query(updateQuery, [assignedTo, ticket.id]);

    // Log assignment history
    const historyQuery = `
      INSERT INTO ticket_assignment_history (ticket_id, assigned_to, assigned_by, assignment_reason, previous_assignee)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await sql.query(historyQuery, [
      ticket.id,
      assignedTo,
      assignedBy,
      reason || null,
      previousAssignee || null,
    ]);

    return result.rows[0] as Ticket;
  }

  /**
   * Change ticket status
   */
  static async changeStatus(
    ticketId: string,
    newStatus: string,
    changedBy: string,
    reason?: string
  ): Promise<Ticket | null> {
    const ticket = await this.getTicket(ticketId, false);
    if (!ticket) {
      return null;
    }

    const validStatuses = [
      'new',
      'triaged',
      'assigned',
      'in_progress',
      'blocked',
      'resolved',
      'closed',
      'cancelled',
      'pending_approval',
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // Handle SLA pause/resume
    let slaPausedAt = ticket.sla_paused_at;
    if (newStatus === 'blocked' && !slaPausedAt) {
      slaPausedAt = new Date();
    } else if (ticket.status === 'blocked' && newStatus !== 'blocked') {
      // Resume SLA - adjust due_at
      if (slaPausedAt && ticket.due_at) {
        const pauseDuration = Date.now() - new Date(slaPausedAt).getTime();
        const newDueAt = new Date(new Date(ticket.due_at).getTime() + pauseDuration);
        await sql.query(`UPDATE tickets SET due_at = $1 WHERE id = $2`, [newDueAt, ticket.id]);
      }
      slaPausedAt = null;
    }

    const updateQuery = `
      UPDATE tickets
      SET status = $1, sla_paused_at = $2, sla_pause_reason = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await sql.query(updateQuery, [
      newStatus,
      slaPausedAt,
      newStatus === 'blocked' ? reason : null,
      ticket.id,
    ]);

    return result.rows[0] as Ticket;
  }

  /**
   * Add a note to a ticket
   */
  static async addNote(
    ticketId: string,
    content: string,
    noteType: 'internal' | 'external' | 'system',
    createdBy: string,
    isResolution = false
  ): Promise<{ id: string; ticket_id: string; content: string; created_at: Date }> {
    const ticket = await this.getTicket(ticketId, false);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const insertQuery = `
      INSERT INTO ticket_notes (ticket_id, content, note_type, created_by, is_resolution)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, ticket_id, content, created_at
    `;

    const result = await sql.query(insertQuery, [
      ticket.id,
      content,
      noteType,
      createdBy,
      isResolution,
    ]);

    // If resolution note, update first response time if not set
    if (!ticket.response_time) {
      await sql.query(
        `UPDATE tickets SET response_time = NOW() - created_at WHERE id = $1 AND response_time IS NULL`,
        [ticket.id]
      );
    }

    return result.rows[0];
  }

  /**
   * Get default SLA config for ticket type and priority
   */
  private static async getDefaultSLAConfig(
    ticketType: string,
    priority: string
  ): Promise<{ response_hours: number; resolution_hours: number } | null> {
    const query = `
      SELECT response_hours, resolution_hours
      FROM sla_configs
      WHERE ticket_type = $1 AND priority = $2 AND is_active = TRUE
      LIMIT 1
    `;

    const result = await sql.query(query, [ticketType, priority]);
    return result.rows[0] || null;
  }

  /**
   * List tickets with pagination
   */
  static async listTickets(params: {
    status?: string;
    priority?: string;
    source?: TicketSource;
    assigned_to?: string;
    project_id?: string;
    limit?: number;
    offset?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(params.status);
      paramIndex++;
    }

    if (params.priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      queryParams.push(params.priority);
      paramIndex++;
    }

    if (params.source) {
      whereConditions.push(`source = $${paramIndex}`);
      queryParams.push(params.source);
      paramIndex++;
    }

    if (params.assigned_to) {
      whereConditions.push(`assigned_to = $${paramIndex}`);
      queryParams.push(params.assigned_to);
      paramIndex++;
    }

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const orderBy = params.order_by || 'created_at';
    const orderDir = params.order_dir || 'desc';
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM tickets ${whereClause}`;
    const countResult = await sql.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get tickets
    queryParams.push(limit);
    const limitParam = paramIndex;
    paramIndex++;

    queryParams.push(offset);
    const offsetParam = paramIndex;

    const ticketsQuery = `
      SELECT * FROM tickets
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const ticketsResult = await sql.query(ticketsQuery, queryParams);

    return {
      tickets: ticketsResult.rows as Ticket[],
      total,
    };
  }
}
