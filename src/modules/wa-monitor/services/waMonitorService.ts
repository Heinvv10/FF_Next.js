/**
 * WA Monitor Backend Service
 * Database operations for QA review drops
 * Uses Neon PostgreSQL serverless client
 */

import { neon } from '@neondatabase/serverless';
import type { QaReviewDrop, WaMonitorSummary } from '../types/wa-monitor.types';

const sql = neon(process.env.DATABASE_URL || '');

// ==================== FETCH OPERATIONS ====================

/**
 * Get all QA review drops
 * Returns all drops ordered by created_at DESC (newest first)
 */
export async function getAllDrops(): Promise<QaReviewDrop[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        drop_number as "dropNumber",
        review_date as "reviewDate",
        user_name as "userName",
        completed_photos as "completedPhotos",
        outstanding_photos as "outstandingPhotos",
        outstanding_photos_loaded_to_1map as "outstandingPhotosLoadedTo1map",
        comment,
        created_at as "createdAt",
        updated_at as "updatedAt",
        project,
        assigned_agent as "assignedAgent",
        completed,
        incomplete,
        feedback_sent as "feedbackSent",
        sender_phone as "senderPhone",
        resubmitted,
        locked_by as "lockedBy",
        locked_at as "lockedAt",
        step_01_house_photo as "step_01_house_photo",
        step_02_cable_from_pole as "step_02_cable_from_pole",
        step_03_cable_entry_outside as "step_03_cable_entry_outside",
        step_04_cable_entry_inside as "step_04_cable_entry_inside",
        step_05_wall_for_installation as "step_05_wall_for_installation",
        step_06_ont_back_after_install as "step_06_ont_back_after_install",
        step_07_power_meter_reading as "step_07_power_meter_reading",
        step_08_ont_barcode as "step_08_ont_barcode",
        step_09_ups_serial as "step_09_ups_serial",
        step_10_final_installation as "step_10_final_installation",
        step_11_green_lights as "step_11_green_lights",
        step_12_customer_signature as "step_12_customer_signature"
      FROM qa_photo_reviews
      ORDER BY created_at DESC
    `;

    return rows.map(transformDbRowToDrop);
  } catch (error) {
    console.error('Error fetching all drops:', error);
    throw new Error('Failed to fetch QA review drops');
  }
}

/**
 * Get a single drop by ID
 */
export async function getDropById(id: string): Promise<QaReviewDrop | null> {
  try {
    const [row] = await sql`
      SELECT
        id,
        drop_number as "dropNumber",
        status,
        feedback_count as "feedbackCount",
        created_at as "createdAt",
        updated_at as "updatedAt",
        completed_at as "completedAt",
        notes
      FROM qa_reviews
      WHERE id = ${id}
    `;

    return row ? transformDbRowToDrop(row) : null;
  } catch (error) {
    console.error(`Error fetching drop ${id}:`, error);
    throw new Error('Failed to fetch QA review drop');
  }
}

/**
 * Get drops by status
 */
export async function getDropsByStatus(status: 'incomplete' | 'complete'): Promise<QaReviewDrop[]> {
  try {
    const rows = await sql`
      SELECT
        id,
        drop_number as "dropNumber",
        status,
        feedback_count as "feedbackCount",
        created_at as "createdAt",
        updated_at as "updatedAt",
        completed_at as "completedAt",
        notes
      FROM qa_reviews
      WHERE status = ${status}
      ORDER BY created_at DESC
    `;

    return rows.map(transformDbRowToDrop);
  } catch (error) {
    console.error(`Error fetching drops with status ${status}:`, error);
    throw new Error('Failed to fetch QA review drops by status');
  }
}

// ==================== SUMMARY OPERATIONS ====================

/**
 * Calculate summary statistics for all drops
 * Complete = All 12 QA checklist steps are TRUE
 * Incomplete = Any of the 12 QA checklist steps is FALSE
 */
export async function calculateSummary(): Promise<WaMonitorSummary> {
  try {
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE
          WHEN step_01_house_photo = true
            AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true
            AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true
            AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true
            AND step_08_ont_barcode = true
            AND step_09_ups_serial = true
            AND step_10_final_installation = true
            AND step_11_green_lights = true
            AND step_12_customer_signature = true
          THEN 1
        END) as complete,
        COUNT(CASE
          WHEN step_01_house_photo = false
            OR step_02_cable_from_pole = false
            OR step_03_cable_entry_outside = false
            OR step_04_cable_entry_inside = false
            OR step_05_wall_for_installation = false
            OR step_06_ont_back_after_install = false
            OR step_07_power_meter_reading = false
            OR step_08_ont_barcode = false
            OR step_09_ups_serial = false
            OR step_10_final_installation = false
            OR step_11_green_lights = false
            OR step_12_customer_signature = false
          THEN 1
        END) as incomplete,
        COALESCE(AVG(completed_photos), 0) as "avgCompletedPhotos",
        COALESCE(SUM(CASE WHEN feedback_sent IS NOT NULL THEN 1 ELSE 0 END), 0) as "totalFeedbackSent"
      FROM qa_photo_reviews
    `;

    return {
      total: parseInt(stats.total, 10),
      incomplete: parseInt(stats.incomplete, 10),
      complete: parseInt(stats.complete, 10),
      averageFeedbackCount: parseFloat(stats.avgCompletedPhotos),
      totalFeedback: parseInt(stats.totalFeedbackSent, 10),
    };
  } catch (error) {
    console.error('Error calculating summary:', error);
    throw new Error('Failed to calculate summary statistics');
  }
}

/**
 * Get daily drops count per project
 * Returns count of drops submitted today grouped by project
 * Uses whatsapp_message_date to reflect actual submission date, not database insert date
 */
export async function getDailyDropsPerProject(date?: string): Promise<Array<{ date: string; project: string; count: number }>> {
  try {
    // If date provided, use it; otherwise use current date in SAST
    let targetDate: string;
    if (date) {
      targetDate = date;
    } else {
      // Get current date in SAST timezone
      const result = await sql`SELECT CURRENT_DATE AT TIME ZONE 'Africa/Johannesburg' as today`;
      targetDate = result[0].today;
    }

    const rows = await sql`
      SELECT
        TO_CHAR(DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg'), 'YYYY-MM-DD') as date,
        COALESCE(project, 'Unknown') as project,
        COUNT(DISTINCT drop_number) as count
      FROM qa_photo_reviews
      WHERE DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg') = ${targetDate}::date
      GROUP BY DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg'), project
      ORDER BY project ASC
    `;

    return rows.map((row: any) => ({
      date: row.date,  // Now returns 'YYYY-MM-DD' string instead of timestamp
      project: row.project,
      count: parseInt(row.count, 10),
    }));
  } catch (error) {
    console.error('Error getting daily drops per project:', error);
    throw new Error('Failed to get daily drops per project');
  }
}

// ==================== HELPERS ====================

/**
 * Transform database row to QaReviewDrop object
 * Handles date parsing and type conversion
 * Maps qa_photo_reviews table to QaReviewDrop interface
 * Status is calculated from the 12 QA checklist steps
 */
function transformDbRowToDrop(row: any): QaReviewDrop {
  // Parse all 12 QA steps
  const step_01 = row.step_01_house_photo || false;
  const step_02 = row.step_02_cable_from_pole || false;
  const step_03 = row.step_03_cable_entry_outside || false;
  const step_04 = row.step_04_cable_entry_inside || false;
  const step_05 = row.step_05_wall_for_installation || false;
  const step_06 = row.step_06_ont_back_after_install || false;
  const step_07 = row.step_07_power_meter_reading || false;
  const step_08 = row.step_08_ont_barcode || false;
  const step_09 = row.step_09_ups_serial || false;
  const step_10 = row.step_10_final_installation || false;
  const step_11 = row.step_11_green_lights || false;
  const step_12 = row.step_12_customer_signature || false;

  // Calculate status: Complete = ALL 12 steps are true
  const allStepsComplete = step_01 && step_02 && step_03 && step_04 && step_05 && step_06 &&
                           step_07 && step_08 && step_09 && step_10 && step_11 && step_12;

  const status: 'incomplete' | 'complete' = allStepsComplete ? 'complete' : 'incomplete';
  const completed = allStepsComplete;
  const incomplete = !allStepsComplete;

  return {
    id: row.id,
    dropNumber: row.dropNumber,
    status,
    reviewDate: new Date(row.reviewDate),
    userName: row.userName || '',
    completedPhotos: row.completedPhotos || 0,
    outstandingPhotos: row.outstandingPhotos || 12,
    outstandingPhotosLoadedTo1map: row.outstandingPhotosLoadedTo1map || false,
    comment: row.comment || null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    project: row.project || null,
    assignedAgent: row.assignedAgent || null,
    completed,
    incomplete,
    feedbackSent: row.feedbackSent ? new Date(row.feedbackSent) : null,
    senderPhone: row.senderPhone || null,
    resubmitted: row.resubmitted || false,
    lockedBy: row.lockedBy || null,
    lockedAt: row.lockedAt ? new Date(row.lockedAt) : null,
    // QA Steps (12 steps from WA Monitor)
    step_01_house_photo: step_01,
    step_02_cable_from_pole: step_02,
    step_03_cable_entry_outside: step_03,
    step_04_cable_entry_inside: step_04,
    step_05_wall_for_installation: step_05,
    step_06_ont_back_after_install: step_06,
    step_07_power_meter_reading: step_07,
    step_08_ont_barcode: step_08,
    step_09_ups_serial: step_09,
    step_10_final_installation: step_10,
    step_11_green_lights: step_11,
    step_12_customer_signature: step_12,
  };
}

/**
 * Get project stats by time period (real-time calculation)
 * Returns stats for today, this week, this month, and all-time
 */
export async function getProjectStats(projectName: string): Promise<{
  today: { total: number; complete: number; incomplete: number; completionRate: number };
  week: { total: number; complete: number; incomplete: number; completionRate: number };
  month: { total: number; complete: number; incomplete: number; completionRate: number };
  allTime: { total: number; complete: number; incomplete: number; completionRate: number };
}> {
  try {
    // Get current date in SAST timezone
    const [dateInfo] = await sql`
      SELECT
        CURRENT_DATE AT TIME ZONE 'Africa/Johannesburg' as today,
        (CURRENT_DATE AT TIME ZONE 'Africa/Johannesburg' - INTERVAL '7 days')::date as week_start,
        (CURRENT_DATE AT TIME ZONE 'Africa/Johannesburg' - INTERVAL '30 days')::date as month_start
    `;

    // Today's stats
    const [todayStats] = await sql`
      SELECT
        COUNT(DISTINCT drop_number) as total,
        COUNT(DISTINCT CASE
          WHEN step_01_house_photo = true AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true AND step_08_ont_barcode = true
            AND step_09_ups_serial = true AND step_10_final_installation = true
            AND step_11_green_lights = true AND step_12_customer_signature = true
          THEN drop_number
        END) as complete
      FROM qa_photo_reviews
      WHERE project = ${projectName}
        AND DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg') = ${dateInfo.today}::date
    `;

    // This week's stats
    const [weekStats] = await sql`
      SELECT
        COUNT(DISTINCT drop_number) as total,
        COUNT(DISTINCT CASE
          WHEN step_01_house_photo = true AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true AND step_08_ont_barcode = true
            AND step_09_ups_serial = true AND step_10_final_installation = true
            AND step_11_green_lights = true AND step_12_customer_signature = true
          THEN drop_number
        END) as complete
      FROM qa_photo_reviews
      WHERE project = ${projectName}
        AND DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg') >= ${dateInfo.week_start}::date
    `;

    // This month's stats
    const [monthStats] = await sql`
      SELECT
        COUNT(DISTINCT drop_number) as total,
        COUNT(DISTINCT CASE
          WHEN step_01_house_photo = true AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true AND step_08_ont_barcode = true
            AND step_09_ups_serial = true AND step_10_final_installation = true
            AND step_11_green_lights = true AND step_12_customer_signature = true
          THEN drop_number
        END) as complete
      FROM qa_photo_reviews
      WHERE project = ${projectName}
        AND DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg') >= ${dateInfo.month_start}::date
    `;

    // All-time stats
    const [allTimeStats] = await sql`
      SELECT
        COUNT(DISTINCT drop_number) as total,
        COUNT(DISTINCT CASE
          WHEN step_01_house_photo = true AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true AND step_08_ont_barcode = true
            AND step_09_ups_serial = true AND step_10_final_installation = true
            AND step_11_green_lights = true AND step_12_customer_signature = true
          THEN drop_number
        END) as complete
      FROM qa_photo_reviews
      WHERE project = ${projectName}
    `;

    // Helper to calculate stats
    const calcStats = (total: number, complete: number) => ({
      total: parseInt(total as any, 10) || 0,
      complete: parseInt(complete as any, 10) || 0,
      incomplete: (parseInt(total as any, 10) || 0) - (parseInt(complete as any, 10) || 0),
      completionRate: total > 0 ? Math.round((complete / total) * 100) : 0,
    });

    return {
      today: calcStats(todayStats.total, todayStats.complete),
      week: calcStats(weekStats.total, weekStats.complete),
      month: calcStats(monthStats.total, monthStats.complete),
      allTime: calcStats(allTimeStats.total, allTimeStats.complete),
    };
  } catch (error) {
    console.error(`Error getting project stats for ${projectName}:`, error);
    throw new Error('Failed to get project stats');
  }
}

/**
 * Get all projects stats summary (for Projects page overview)
 * Returns today's stats for all projects combined
 */
export async function getAllProjectsStatsSummary(): Promise<{
  total: number;
  complete: number;
  incomplete: number;
  completionRate: number;
  byProject: Array<{ project: string; total: number; complete: number; completionRate: number }>;
}> {
  try {
    // Get current date in SAST timezone
    const [dateInfo] = await sql`
      SELECT CURRENT_DATE AT TIME ZONE 'Africa/Johannesburg' as today
    `;

    // Today's stats by project
    const projectStats = await sql`
      SELECT
        COALESCE(project, 'Unknown') as project,
        COUNT(DISTINCT drop_number) as total,
        COUNT(DISTINCT CASE
          WHEN step_01_house_photo = true AND step_02_cable_from_pole = true
            AND step_03_cable_entry_outside = true AND step_04_cable_entry_inside = true
            AND step_05_wall_for_installation = true AND step_06_ont_back_after_install = true
            AND step_07_power_meter_reading = true AND step_08_ont_barcode = true
            AND step_09_ups_serial = true AND step_10_final_installation = true
            AND step_11_green_lights = true AND step_12_customer_signature = true
          THEN drop_number
        END) as complete
      FROM qa_photo_reviews
      WHERE DATE(COALESCE(whatsapp_message_date, created_at) AT TIME ZONE 'Africa/Johannesburg') = ${dateInfo.today}::date
      GROUP BY project
      ORDER BY total DESC
    `;

    const total = projectStats.reduce((sum, p) => sum + parseInt(p.total as any, 10), 0);
    const complete = projectStats.reduce((sum, p) => sum + parseInt(p.complete as any, 10), 0);

    return {
      total,
      complete,
      incomplete: total - complete,
      completionRate: total > 0 ? Math.round((complete / total) * 100) : 0,
      byProject: projectStats.map(p => ({
        project: p.project,
        total: parseInt(p.total as any, 10),
        complete: parseInt(p.complete as any, 10),
        completionRate: p.total > 0 ? Math.round((parseInt(p.complete as any, 10) / parseInt(p.total as any, 10)) * 100) : 0,
      })),
    };
  } catch (error) {
    console.error('Error getting all projects stats summary:', error);
    throw new Error('Failed to get all projects stats summary');
  }
}

/**
 * Validate database connection
 */
export async function validateConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
