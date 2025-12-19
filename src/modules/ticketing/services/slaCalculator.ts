// src/modules/ticketing/services/slaCalculator.ts
// Business logic for SLA (Service Level Agreement) calculation and tracking
import { neon } from '@neondatabase/serverless';
import type { SLAConfig } from '../types';

const sql = neon(process.env.DATABASE_URL!);

export interface SLACalculationResult {
  sla_config_id: string;
  sla_config_name: string;
  response_deadline: Date;
  resolution_deadline: Date;
  is_breached: boolean;
  time_remaining_minutes: number;
  breach_status: 'none' | 'response_breached' | 'resolution_breached' | 'both_breached';
  business_hours_used: number;
  warning_threshold_reached: boolean;
}

export interface SLAPauseResumeResult {
  ticket_id: string;
  paused_at: Date | null;
  paused_duration_minutes: number;
  total_pause_time_minutes: number;
  adjusted_deadline: Date;
}

export class SLACalculator {
  /**
   * Calculate SLA deadlines and current status for a ticket
   * Handles both 24/7 and business hours configurations
   */
  static async calculateSLA(params: {
    ticket_id: string;
    sla_config_id: string;
    created_at: Date;
    priority: string;
    current_time?: Date;
  }): Promise<SLACalculationResult> {
    const currentTime = params.current_time || new Date();

    // Get SLA configuration
    const slaQuery = `SELECT * FROM sla_configs WHERE id = $1`;
    const slaResult = await sql.query(slaQuery, [params.sla_config_id]);

    if (slaResult.rows.length === 0) {
      throw new Error(`SLA configuration not found: ${params.sla_config_id}`);
    }

    const slaConfig = slaResult.rows[0] as SLAConfig;

    // Get priority-specific deadlines
    const responseMinutes = this.getResponseTime(slaConfig, params.priority);
    const resolutionMinutes = this.getResolutionTime(slaConfig, params.priority);

    // Calculate deadlines based on business hours setting
    let responseDeadline: Date;
    let resolutionDeadline: Date;
    let businessHoursUsed = 0;

    if (slaConfig.business_hours_only) {
      // Calculate with business hours consideration
      const responseResult = this.addBusinessHours(
        params.created_at,
        responseMinutes,
        slaConfig
      );
      responseDeadline = responseResult.deadline;
      businessHoursUsed = responseResult.businessHoursUsed;

      const resolutionResult = this.addBusinessHours(
        params.created_at,
        resolutionMinutes,
        slaConfig
      );
      resolutionDeadline = resolutionResult.deadline;
    } else {
      // Simple 24/7 calculation
      responseDeadline = new Date(
        params.created_at.getTime() + responseMinutes * 60000
      );
      resolutionDeadline = new Date(
        params.created_at.getTime() + resolutionMinutes * 60000
      );
      businessHoursUsed = Math.floor(
        (currentTime.getTime() - params.created_at.getTime()) / 60000
      );
    }

    // Check if SLA is breached
    const responseBreached = currentTime > responseDeadline;
    const resolutionBreached = currentTime > resolutionDeadline;

    let breachStatus: 'none' | 'response_breached' | 'resolution_breached' | 'both_breached' =
      'none';
    if (responseBreached && resolutionBreached) {
      breachStatus = 'both_breached';
    } else if (resolutionBreached) {
      breachStatus = 'resolution_breached';
    } else if (responseBreached) {
      breachStatus = 'response_breached';
    }

    // Calculate time remaining until resolution deadline
    const timeRemainingMs = resolutionDeadline.getTime() - currentTime.getTime();
    const timeRemainingMinutes = Math.floor(timeRemainingMs / 60000);

    // Check if warning threshold reached (80% of time elapsed)
    const totalSLATime = resolutionMinutes;
    const elapsedTime = resolutionMinutes - timeRemainingMinutes;
    const warningThresholdReached = elapsedTime / totalSLATime >= 0.8;

    return {
      sla_config_id: slaConfig.id,
      sla_config_name: slaConfig.name,
      response_deadline: responseDeadline,
      resolution_deadline: resolutionDeadline,
      is_breached: resolutionBreached,
      time_remaining_minutes: timeRemainingMinutes,
      breach_status: breachStatus,
      business_hours_used: businessHoursUsed,
      warning_threshold_reached: warningThresholdReached,
    };
  }

  /**
   * Get response time in minutes for a given priority
   */
  private static getResponseTime(
    slaConfig: SLAConfig,
    priority: string
  ): number {
    switch (priority.toLowerCase()) {
      case 'critical':
        return slaConfig.critical_response_minutes || 15;
      case 'high':
        return slaConfig.high_response_minutes || 60;
      case 'medium':
        return slaConfig.medium_response_minutes || 240;
      case 'low':
        return slaConfig.low_response_minutes || 480;
      default:
        return slaConfig.medium_response_minutes || 240;
    }
  }

  /**
   * Get resolution time in minutes for a given priority
   */
  private static getResolutionTime(
    slaConfig: SLAConfig,
    priority: string
  ): number {
    switch (priority.toLowerCase()) {
      case 'critical':
        return slaConfig.critical_resolution_minutes || 240;
      case 'high':
        return slaConfig.high_resolution_minutes || 480;
      case 'medium':
        return slaConfig.medium_resolution_minutes || 1440;
      case 'low':
        return slaConfig.low_resolution_minutes || 2880;
      default:
        return slaConfig.medium_resolution_minutes || 1440;
    }
  }

  /**
   * Add business hours to a start time, skipping weekends and non-business hours
   */
  private static addBusinessHours(
    startTime: Date,
    minutesToAdd: number,
    slaConfig: SLAConfig
  ): { deadline: Date; businessHoursUsed: number } {
    const businessHourStart = slaConfig.business_hour_start || 9; // Default 9 AM
    const businessHourEnd = slaConfig.business_hour_end || 17; // Default 5 PM
    const businessHoursPerDay = businessHourEnd - businessHourStart;

    let currentTime = new Date(startTime);
    let remainingMinutes = minutesToAdd;
    let businessHoursUsed = 0;

    while (remainingMinutes > 0) {
      const dayOfWeek = currentTime.getDay();
      const currentHour = currentTime.getHours();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Jump to Monday 9 AM
        const daysToMonday = dayOfWeek === 0 ? 1 : 2;
        currentTime.setDate(currentTime.getDate() + daysToMonday);
        currentTime.setHours(businessHourStart, 0, 0, 0);
        continue;
      }

      // Before business hours - jump to start of business day
      if (currentHour < businessHourStart) {
        currentTime.setHours(businessHourStart, 0, 0, 0);
        continue;
      }

      // After business hours - jump to next day
      if (currentHour >= businessHourEnd) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHourStart, 0, 0, 0);
        continue;
      }

      // Within business hours - calculate available time today
      const minutesUntilEndOfDay =
        (businessHourEnd - currentHour) * 60 - currentTime.getMinutes();

      if (remainingMinutes <= minutesUntilEndOfDay) {
        // Can complete within today
        currentTime = new Date(currentTime.getTime() + remainingMinutes * 60000);
        businessHoursUsed += remainingMinutes;
        remainingMinutes = 0;
      } else {
        // Need to continue to next business day
        remainingMinutes -= minutesUntilEndOfDay;
        businessHoursUsed += minutesUntilEndOfDay;
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHourStart, 0, 0, 0);
      }
    }

    return {
      deadline: currentTime,
      businessHoursUsed,
    };
  }

  /**
   * Pause SLA timer for a ticket
   * Used when waiting for customer response or external dependencies
   */
  static async pauseSLA(ticketId: string): Promise<SLAPauseResumeResult> {
    const pausedAt = new Date();

    const updateQuery = `
      UPDATE tickets
      SET sla_paused_at = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, sla_paused_at, sla_paused_duration, due_at
    `;

    const result = await sql.query(updateQuery, [pausedAt, ticketId]);

    if (result.rows.length === 0) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticket = result.rows[0];

    return {
      ticket_id: ticketId,
      paused_at: pausedAt,
      paused_duration_minutes: 0,
      total_pause_time_minutes: ticket.sla_paused_duration || 0,
      adjusted_deadline: ticket.due_at,
    };
  }

  /**
   * Resume SLA timer for a ticket
   * Calculates pause duration and adjusts deadline
   */
  static async resumeSLA(ticketId: string): Promise<SLAPauseResumeResult> {
    const resumedAt = new Date();

    // Get current ticket state
    const ticketQuery = `SELECT * FROM tickets WHERE id = $1`;
    const ticketResult = await sql.query(ticketQuery, [ticketId]);

    if (ticketResult.rows.length === 0) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticket = ticketResult.rows[0];

    if (!ticket.sla_paused_at) {
      throw new Error(`Ticket ${ticketId} is not currently paused`);
    }

    // Calculate pause duration
    const pauseDurationMs =
      resumedAt.getTime() - new Date(ticket.sla_paused_at).getTime();
    const pauseDurationMinutes = Math.floor(pauseDurationMs / 60000);

    // Calculate total pause time
    const totalPauseMinutes =
      (ticket.sla_paused_duration || 0) + pauseDurationMinutes;

    // Adjust deadline by adding pause duration
    const originalDeadline = new Date(ticket.due_at);
    const adjustedDeadline = new Date(
      originalDeadline.getTime() + pauseDurationMs
    );

    // Update ticket
    const updateQuery = `
      UPDATE tickets
      SET
        sla_paused_at = NULL,
        sla_paused_duration = $1,
        due_at = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, sla_paused_at, sla_paused_duration, due_at
    `;

    const result = await sql.query(updateQuery, [
      totalPauseMinutes,
      adjustedDeadline,
      ticketId,
    ]);

    return {
      ticket_id: ticketId,
      paused_at: null,
      paused_duration_minutes: pauseDurationMinutes,
      total_pause_time_minutes: totalPauseMinutes,
      adjusted_deadline: adjustedDeadline,
    };
  }

  /**
   * Check if ticket SLA is at risk (80% of time elapsed)
   */
  static async checkSLAAtRisk(ticketId: string): Promise<boolean> {
    const ticketQuery = `
      SELECT created_at, due_at, sla_paused_at, sla_config_id, priority
      FROM tickets
      WHERE id = $1
    `;
    const ticketResult = await sql.query(ticketQuery, [ticketId]);

    if (ticketResult.rows.length === 0) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticket = ticketResult.rows[0];

    // If paused, not at risk
    if (ticket.sla_paused_at) {
      return false;
    }

    const slaCalc = await this.calculateSLA({
      ticket_id: ticketId,
      sla_config_id: ticket.sla_config_id,
      created_at: new Date(ticket.created_at),
      priority: ticket.priority,
    });

    return slaCalc.warning_threshold_reached;
  }

  /**
   * Get all tickets with breached SLAs
   */
  static async getBreachedTickets(params: {
    project_id?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const whereConditions: string[] = [
      "status NOT IN ('closed', 'cancelled', 'resolved')",
      'sla_breached = TRUE',
    ];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    if (params.priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      queryParams.push(params.priority);
      paramIndex++;
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    queryParams.push(limit);
    const limitParam = paramIndex;
    paramIndex++;

    queryParams.push(offset);
    const offsetParam = paramIndex;

    const query = `
      SELECT *
      FROM tickets
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at ASC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, queryParams);
    return result.rows;
  }

  /**
   * Update ticket SLA breach status
   * Should be called periodically or when ticket status changes
   */
  static async updateSLABreachStatus(ticketId: string): Promise<void> {
    const ticketQuery = `
      SELECT created_at, sla_config_id, priority, status, sla_paused_at
      FROM tickets
      WHERE id = $1
    `;
    const ticketResult = await sql.query(ticketQuery, [ticketId]);

    if (ticketResult.rows.length === 0) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticket = ticketResult.rows[0];

    // Don't update if ticket is closed or paused
    if (
      ['closed', 'cancelled', 'resolved'].includes(ticket.status) ||
      ticket.sla_paused_at
    ) {
      return;
    }

    const slaCalc = await this.calculateSLA({
      ticket_id: ticketId,
      sla_config_id: ticket.sla_config_id,
      created_at: new Date(ticket.created_at),
      priority: ticket.priority,
    });

    const updateQuery = `
      UPDATE tickets
      SET
        sla_breached = $1,
        updated_at = NOW()
      WHERE id = $2
    `;

    await sql.query(updateQuery, [slaCalc.is_breached, ticketId]);
  }
}
