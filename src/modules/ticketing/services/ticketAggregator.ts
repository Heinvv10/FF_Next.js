// src/modules/ticketing/services/ticketAggregator.ts
// Business logic for aggregating tickets from multiple sources into unified dashboard
import { neon } from '@neondatabase/serverless';
import type { Ticket, TicketSource } from '../types';

const sql = neon(process.env.DATABASE_URL!);

export interface AggregatedTicketView {
  tickets: Ticket[];
  total: number;
  by_source: Record<TicketSource, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_billing_type: Record<string, number>;
  sla_metrics: {
    at_risk: number;
    breached: number;
    on_track: number;
  };
}

export interface SourceStats {
  source: TicketSource;
  total: number;
  open: number;
  closed: number;
  average_resolution_time_hours: number | null;
  sla_breach_rate: number;
}

export class TicketAggregator {
  /**
   * Get aggregated ticket view with statistics
   * Combines tickets from all sources with filtering
   */
  static async getAggregatedView(params: {
    user_id?: string;
    project_id?: string;
    status?: string;
    priority?: string;
    source?: TicketSource;
    assigned_to?: string;
    created_by?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<AggregatedTicketView> {
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

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

    if (params.created_by) {
      whereConditions.push(`created_by = $${paramIndex}`);
      queryParams.push(params.created_by);
      paramIndex++;
    }

    if (params.start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(params.start_date);
      paramIndex++;
    }

    if (params.end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(params.end_date);
      paramIndex++;
    }

    const whereSQL =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tickets ${whereSQL}`;
    const countResult = await sql.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get tickets with pagination
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const ticketsParams = [...queryParams, limit, offset];
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const ticketsQuery = `
      SELECT * FROM tickets
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const ticketsResult = await sql.query(ticketsQuery, ticketsParams);
    const tickets = ticketsResult.rows as Ticket[];

    // Get aggregated statistics
    const bySource = await this.getBySource(whereSQL, queryParams);
    const byStatus = await this.getByStatus(whereSQL, queryParams);
    const byPriority = await this.getByPriority(whereSQL, queryParams);
    const byBillingType = await this.getByBillingType(whereSQL, queryParams);
    const slaMetrics = await this.getSLAMetrics(whereSQL, queryParams);

    return {
      tickets,
      total,
      by_source: bySource,
      by_status: byStatus,
      by_priority: byPriority,
      by_billing_type: byBillingType,
      sla_metrics: slaMetrics,
    };
  }

  /**
   * Get ticket count by source
   */
  private static async getBySource(
    whereSQL: string,
    params: unknown[]
  ): Promise<Record<TicketSource, number>> {
    const query = `
      SELECT source, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY source
    `;

    const result = await sql.query(query, params);

    const bySource: Record<TicketSource, number> = {
      qcontact: 0,
      whatsapp_inbound: 0,
      email: 0,
      construction: 0,
      internal: 0,
      whatsapp_outbound: 0,
      adhoc: 0,
    };

    result.rows.forEach((row: any) => {
      bySource[row.source as TicketSource] = parseInt(row.count, 10);
    });

    return bySource;
  }

  /**
   * Get ticket count by status
   */
  private static async getByStatus(
    whereSQL: string,
    params: unknown[]
  ): Promise<Record<string, number>> {
    const query = `
      SELECT status, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY status
    `;

    const result = await sql.query(query, params);

    const byStatus: Record<string, number> = {};

    result.rows.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    return byStatus;
  }

  /**
   * Get ticket count by priority
   */
  private static async getByPriority(
    whereSQL: string,
    params: unknown[]
  ): Promise<Record<string, number>> {
    const query = `
      SELECT priority, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY priority
    `;

    const result = await sql.query(query, params);

    const byPriority: Record<string, number> = {};

    result.rows.forEach((row: any) => {
      byPriority[row.priority] = parseInt(row.count, 10);
    });

    return byPriority;
  }

  /**
   * Get ticket count by billing type
   */
  private static async getByBillingType(
    whereSQL: string,
    params: unknown[]
  ): Promise<Record<string, number>> {
    const query = `
      SELECT billing_type, COUNT(*) as count
      FROM tickets
      ${whereSQL}
      GROUP BY billing_type
    `;

    const result = await sql.query(query, params);

    const byBillingType: Record<string, number> = {};

    result.rows.forEach((row: any) => {
      byBillingType[row.billing_type] = parseInt(row.count, 10);
    });

    return byBillingType;
  }

  /**
   * Get SLA metrics (at risk, breached, on track)
   */
  private static async getSLAMetrics(
    whereSQL: string,
    params: unknown[]
  ): Promise<{
    at_risk: number;
    breached: number;
    on_track: number;
  }> {
    const baseWhere = whereSQL || 'WHERE 1=1';

    // At risk: 80% time elapsed, not breached
    const atRiskQuery = `
      SELECT COUNT(*) as count
      FROM tickets
      ${baseWhere}
        AND status NOT IN ('closed', 'cancelled', 'resolved')
        AND sla_breached = FALSE
        AND due_at IS NOT NULL
        AND (EXTRACT(EPOCH FROM (NOW() - created_at)) / EXTRACT(EPOCH FROM (due_at - created_at))) >= 0.8
    `;

    const atRiskResult = await sql.query(atRiskQuery, params);
    const atRisk = parseInt(atRiskResult.rows[0].count, 10);

    // Breached: SLA breached flag set
    const breachedQuery = `
      SELECT COUNT(*) as count
      FROM tickets
      ${baseWhere}
        AND sla_breached = TRUE
    `;

    const breachedResult = await sql.query(breachedQuery, params);
    const breached = parseInt(breachedResult.rows[0].count, 10);

    // On track: Not at risk, not breached
    const onTrackQuery = `
      SELECT COUNT(*) as count
      FROM tickets
      ${baseWhere}
        AND status NOT IN ('closed', 'cancelled', 'resolved')
        AND sla_breached = FALSE
        AND (
          due_at IS NULL
          OR (EXTRACT(EPOCH FROM (NOW() - created_at)) / EXTRACT(EPOCH FROM (due_at - created_at))) < 0.8
        )
    `;

    const onTrackResult = await sql.query(onTrackQuery, params);
    const onTrack = parseInt(onTrackResult.rows[0].count, 10);

    return {
      at_risk: atRisk,
      breached: breached,
      on_track: onTrack,
    };
  }

  /**
   * Get statistics for each ticket source
   */
  static async getSourceStats(params: {
    project_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<SourceStats[]> {
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    if (params.start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(params.start_date);
      paramIndex++;
    }

    if (params.end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(params.end_date);
      paramIndex++;
    }

    const whereSQL =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        source,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'cancelled', 'resolved')) as open,
        COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')) as closed,
        AVG(
          EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
        ) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
        (COUNT(*) FILTER (WHERE sla_breached = TRUE)::float / NULLIF(COUNT(*), 0)) as sla_breach_rate
      FROM tickets
      ${whereSQL}
      GROUP BY source
      ORDER BY total DESC
    `;

    const result = await sql.query(query, queryParams);

    const sourceStats: SourceStats[] = result.rows.map((row: any) => ({
      source: row.source as TicketSource,
      total: parseInt(row.total, 10),
      open: parseInt(row.open, 10),
      closed: parseInt(row.closed, 10),
      average_resolution_time_hours: row.avg_resolution_hours
        ? parseFloat(row.avg_resolution_hours)
        : null,
      sla_breach_rate: row.sla_breach_rate
        ? parseFloat((parseFloat(row.sla_breach_rate) * 100).toFixed(2))
        : 0,
    }));

    return sourceStats;
  }

  /**
   * Get ticket trends over time (daily/weekly/monthly)
   */
  static async getTicketTrends(params: {
    project_id?: string;
    interval: 'day' | 'week' | 'month';
    start_date: string;
    end_date: string;
  }): Promise<{
    labels: string[];
    created: number[];
    resolved: number[];
    breached: number[];
  }> {
    const whereConditions: string[] = [
      'created_at >= $1',
      'created_at <= $2',
    ];
    const queryParams: unknown[] = [params.start_date, params.end_date];
    let paramIndex = 3;

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    const whereSQL = `WHERE ${whereConditions.join(' AND ')}`;

    // Determine date truncation based on interval
    let dateTrunc: string;
    switch (params.interval) {
      case 'day':
        dateTrunc = 'day';
        break;
      case 'week':
        dateTrunc = 'week';
        break;
      case 'month':
        dateTrunc = 'month';
        break;
      default:
        dateTrunc = 'day';
    }

    const query = `
      SELECT
        DATE_TRUNC('${dateTrunc}', created_at) as period,
        COUNT(*) as created,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved,
        COUNT(*) FILTER (WHERE sla_breached = TRUE) as breached
      FROM tickets
      ${whereSQL}
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await sql.query(query, queryParams);

    const labels: string[] = [];
    const created: number[] = [];
    const resolved: number[] = [];
    const breached: number[] = [];

    result.rows.forEach((row: any) => {
      labels.push(new Date(row.period).toISOString().split('T')[0]);
      created.push(parseInt(row.created, 10));
      resolved.push(parseInt(row.resolved, 10));
      breached.push(parseInt(row.breached, 10));
    });

    return {
      labels,
      created,
      resolved,
      breached,
    };
  }

  /**
   * Get top performers (users with best resolution times)
   */
  static async getTopPerformers(params: {
    project_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<{
    user_id: string;
    user_name: string;
    tickets_resolved: number;
    average_resolution_hours: number;
    sla_breach_count: number;
  }[]> {
    const whereConditions: string[] = [
      'resolved_at IS NOT NULL',
      'assigned_to IS NOT NULL',
    ];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    if (params.start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(params.start_date);
      paramIndex++;
    }

    if (params.end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(params.end_date);
      paramIndex++;
    }

    const limit = params.limit || 10;

    queryParams.push(limit);
    const limitParam = paramIndex;

    const whereSQL = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT
        assigned_to as user_id,
        COUNT(*) as tickets_resolved,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours,
        COUNT(*) FILTER (WHERE sla_breached = TRUE) as sla_breach_count
      FROM tickets
      ${whereSQL}
      GROUP BY assigned_to
      ORDER BY avg_resolution_hours ASC
      LIMIT $${limitParam}
    `;

    const result = await sql.query(query, queryParams);

    const performers = result.rows.map((row: any) => ({
      user_id: row.user_id,
      user_name: 'Unknown', // 🟡 PARTIAL: Need to join with users table
      tickets_resolved: parseInt(row.tickets_resolved, 10),
      average_resolution_hours: parseFloat(row.avg_resolution_hours),
      sla_breach_count: parseInt(row.sla_breach_count, 10),
    }));

    return performers;
  }

  /**
   * Get my dashboard view (tickets assigned to or created by user)
   */
  static async getMyDashboard(userId: string): Promise<{
    assigned_to_me: {
      total: number;
      by_priority: Record<string, number>;
      overdue: number;
    };
    created_by_me: {
      total: number;
      open: number;
      resolved: number;
    };
    watching: {
      total: number;
      recent_updates: number;
    };
  }> {
    // Assigned to me
    const assignedQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium,
        COUNT(*) FILTER (WHERE priority = 'low') as low,
        COUNT(*) FILTER (WHERE due_at < NOW() AND status NOT IN ('closed', 'cancelled', 'resolved')) as overdue
      FROM tickets
      WHERE assigned_to = $1
        AND status NOT IN ('closed', 'cancelled', 'resolved')
    `;

    const assignedResult = await sql.query(assignedQuery, [userId]);
    const assigned = assignedResult.rows[0];

    // Created by me
    const createdQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'cancelled', 'resolved')) as open,
        COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')) as resolved
      FROM tickets
      WHERE created_by = $1
    `;

    const createdResult = await sql.query(createdQuery, [userId]);
    const created = createdResult.rows[0];

    // Watching (tickets with recent activity)
    const watchingQuery = `
      SELECT
        COUNT(DISTINCT t.id) as total,
        COUNT(DISTINCT t.id) FILTER (WHERE t.updated_at > NOW() - INTERVAL '24 hours') as recent_updates
      FROM tickets t
      LEFT JOIN ticket_notes tn ON tn.ticket_id = t.id
      WHERE (t.assigned_to = $1 OR t.created_by = $1)
        AND t.status NOT IN ('closed', 'cancelled', 'resolved')
    `;

    const watchingResult = await sql.query(watchingQuery, [userId]);
    const watching = watchingResult.rows[0];

    return {
      assigned_to_me: {
        total: parseInt(assigned.total, 10),
        by_priority: {
          critical: parseInt(assigned.critical, 10),
          high: parseInt(assigned.high, 10),
          medium: parseInt(assigned.medium, 10),
          low: parseInt(assigned.low, 10),
        },
        overdue: parseInt(assigned.overdue, 10),
      },
      created_by_me: {
        total: parseInt(created.total, 10),
        open: parseInt(created.open, 10),
        resolved: parseInt(created.resolved, 10),
      },
      watching: {
        total: parseInt(watching.total, 10),
        recent_updates: parseInt(watching.recent_updates, 10),
      },
    };
  }
}
