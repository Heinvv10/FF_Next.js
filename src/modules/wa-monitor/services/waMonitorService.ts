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
      ORDER BY resubmitted DESC, created_at DESC
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
export async function getDailyDropsPerProject(): Promise<Array<{ date: string; project: string; count: number }>> {
  try {
    const rows = await sql`
      SELECT
        DATE(COALESCE(whatsapp_message_date, created_at)) as date,
        COALESCE(project, 'Unknown') as project,
        COUNT(*) as count
      FROM qa_photo_reviews
      WHERE DATE(COALESCE(whatsapp_message_date, created_at)) = CURRENT_DATE
      GROUP BY DATE(COALESCE(whatsapp_message_date, created_at)), project
      ORDER BY project ASC
    `;

    return rows.map((row: any) => ({
      date: row.date,
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
 */
function transformDbRowToDrop(row: any): QaReviewDrop {
  // Determine status based on incomplete/completed flags
  const status: 'incomplete' | 'complete' = row.incomplete
    ? 'incomplete'
    : row.completed
      ? 'complete'
      : 'incomplete'; // default to incomplete if neither flag is set

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
    completed: row.completed || false,
    incomplete: row.incomplete || false,
    feedbackSent: row.feedbackSent ? new Date(row.feedbackSent) : null,
    senderPhone: row.senderPhone || null,
    resubmitted: row.resubmitted || false,
    // QA Steps (12 steps from WA Monitor)
    step_01_house_photo: row.step_01_house_photo || false,
    step_02_cable_from_pole: row.step_02_cable_from_pole || false,
    step_03_cable_entry_outside: row.step_03_cable_entry_outside || false,
    step_04_cable_entry_inside: row.step_04_cable_entry_inside || false,
    step_05_wall_for_installation: row.step_05_wall_for_installation || false,
    step_06_ont_back_after_install: row.step_06_ont_back_after_install || false,
    step_07_power_meter_reading: row.step_07_power_meter_reading || false,
    step_08_ont_barcode: row.step_08_ont_barcode || false,
    step_09_ups_serial: row.step_09_ups_serial || false,
    step_10_final_installation: row.step_10_final_installation || false,
    step_11_green_lights: row.step_11_green_lights || false,
    step_12_customer_signature: row.step_12_customer_signature || false,
  };
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
