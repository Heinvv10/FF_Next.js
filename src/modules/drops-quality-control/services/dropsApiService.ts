import { Pool } from '@neondatabase/serverless';
import {
  Drop,
  ChecklistItem,
  DropSubmission,
  DropReview,
  QualityMetric,
  DropsContractor,
  ChecklistValidation,
  ApiResponse,
  DashboardResponse,
  DropWithDetails,
  CHECKLIST_TEMPLATE
} from '../types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class DropsApiService {
  // Drops CRUD operations
  static async getDrops(filters?: {
    status?: string;
    qc_status?: string;
    contractor_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<DropWithDetails[]>> {
    try {
      let query = `
        SELECT
          d.id,
          d.drop_number,
          d.pole_number,
          d.address as customer_address,
          d.status,
          d.qc_status,
          d.qc_updated_at,
          d.created_at as drop_created_at,
          c.id as contractor_id,
          c.name as contractor_name,
          c.whatsapp_number,
          ds.id as submission_id,
          ds.status as submission_status,
          ds.submitted_at,
          ds.completion_score as submission_score,
          ds.notes as submission_notes,
          dr.id as review_id,
          dr.status as review_status,
          dr.feedback,
          dr.reviewed_at,
          dr.reviewed_by,
          dr.missing_steps,
          COALESCE(
            (SELECT COUNT(*)
             FROM checklist_items ci
             WHERE ci.drop_id = d.id AND ci.is_completed = true), 0
          ) as completed_steps,
          COALESCE(
            (SELECT COUNT(*)
             FROM checklist_items ci
             WHERE ci.drop_id = d.id), 14
          ) as total_steps
        FROM drops d
        LEFT JOIN drop_submissions ds ON d.id = ds.drop_id
        LEFT JOIN drops_contractors c ON ds.contractor_id = c.id
        LEFT JOIN drop_reviews dr ON ds.id = dr.submission_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.qc_status) {
        query += ` AND d.qc_status = $${paramIndex}`;
        params.push(filters.qc_status);
        paramIndex++;
      }

      if (filters?.contractor_id) {
        query += ` AND ds.contractor_id = $${paramIndex}`;
        params.push(filters.contractor_id);
        paramIndex++;
      }

      query += ` ORDER BY d.created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);

      const drops = result.rows.map(row => ({
        id: row.id,
        drop_number: row.drop_number,
        pole_number: row.pole_number,
        customer_address: row.customer_address,
        status: row.status,
        qc_status: row.qc_status,
        qc_updated_at: row.qc_updated_at,
        created_at: row.drop_created_at,
        contractor: row.contractor_id ? {
          id: row.contractor_id,
          name: row.contractor_name,
          whatsapp_number: row.whatsapp_number,
        } : undefined,
        submission: row.submission_id ? {
          id: row.submission_id,
          status: row.submission_status,
          completion_score: row.submission_score,
          notes: row.submission_notes,
          submitted_at: row.submitted_at,
        } : undefined,
        review: row.review_id ? {
          id: row.review_id,
          status: row.review_status,
          feedback: row.feedback,
          missing_steps: row.missing_steps,
          reviewed_at: row.reviewed_at,
          reviewed_by: row.reviewed_by,
        } : undefined,
        completed_steps: parseInt(row.completed_steps),
        total_steps: parseInt(row.total_steps),
      }));

      return { success: true, data: drops };
    } catch (error) {
      console.error('Error fetching drops:', error);
      return { success: false, error: 'Failed to fetch drops' };
    }
  }

  static async getDropById(id: string): Promise<ApiResponse<DropWithDetails>> {
    try {
      const result = await pool.query(`
        SELECT
          d.id,
          d.drop_number,
          d.pole_number,
          d.address as customer_address,
          d.status,
          d.qc_status,
          d.qc_updated_at,
          d.created_at as drop_created_at,
          c.id as contractor_id,
          c.name as contractor_name,
          c.whatsapp_number,
          ds.id as submission_id,
          ds.status as submission_status,
          ds.submitted_at,
          ds.completion_score as submission_score,
          ds.notes as submission_notes,
          dr.id as review_id,
          dr.status as review_status,
          dr.feedback,
          dr.reviewed_at,
          dr.reviewed_by,
          dr.missing_steps,
          COALESCE(
            (SELECT COUNT(*)
             FROM checklist_items ci
             WHERE ci.drop_id = d.id AND ci.is_completed = true), 0
          ) as completed_steps,
          COALESCE(
            (SELECT COUNT(*)
             FROM checklist_items ci
             WHERE ci.drop_id = d.id), 14
          ) as total_steps
        FROM drops d
        LEFT JOIN drop_submissions ds ON d.id = ds.drop_id
        LEFT JOIN drops_contractors c ON ds.contractor_id = c.id
        LEFT JOIN drop_reviews dr ON ds.id = dr.submission_id
        WHERE d.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Drop not found' };
      }

      const row = result.rows[0];
      const drop: DropWithDetails = {
        id: row.id,
        drop_number: row.drop_number,
        pole_number: row.pole_number,
        customer_address: row.customer_address,
        status: row.status,
        qc_status: row.qc_status,
        qc_updated_at: row.qc_updated_at,
        created_at: row.drop_created_at,
        contractor: row.contractor_id ? {
          id: row.contractor_id,
          name: row.contractor_name,
          whatsapp_number: row.whatsapp_number,
        } : undefined,
        submission: row.submission_id ? {
          id: row.submission_id,
          status: row.submission_status,
          completion_score: row.submission_score,
          notes: row.submission_notes,
          submitted_at: row.submitted_at,
        } : undefined,
        review: row.review_id ? {
          id: row.review_id,
          status: row.review_status,
          feedback: row.feedback,
          missing_steps: row.missing_steps,
          reviewed_at: row.reviewed_at,
          reviewed_by: row.reviewed_by,
        } : undefined,
        completed_steps: parseInt(row.completed_steps),
        total_steps: parseInt(row.total_steps),
      };

      return { success: true, data: drop };
    } catch (error) {
      console.error('Error fetching drop:', error);
      return { success: false, error: 'Failed to fetch drop' };
    }
  }

  static async updateDropQCStatus(id: string, qc_status: 'pending' | 'approved' | 'needs-rectification'): Promise<ApiResponse<Drop>> {
    try {
      const result = await pool.query(`
        UPDATE drops
        SET qc_status = $1, qc_updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [qc_status, id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Drop not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating drop QC status:', error);
      return { success: false, error: 'Failed to update drop QC status' };
    }
  }

  // Checklist operations
  static async getDropChecklist(drop_id: string): Promise<ApiResponse<ChecklistItem[]>> {
    try {
      const result = await pool.query(`
        SELECT * FROM checklist_items
        WHERE drop_id = $1
        ORDER BY step_number
      `, [drop_id]);

      // If no checklist items exist, create them from template
      if (result.rows.length === 0) {
        await this.createChecklistFromTemplate(drop_id);
        return await this.getDropChecklist(drop_id);
      }

      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error fetching checklist:', error);
      return { success: false, error: 'Failed to fetch checklist' };
    }
  }

  static async createChecklistFromTemplate(drop_id: string): Promise<void> {
    try {
      for (const item of CHECKLIST_TEMPLATE) {
        await pool.query(`
          INSERT INTO checklist_items
          (drop_id, step_number, step_name, phase, is_completed)
          VALUES ($1, $2, $3, $4, false)
          ON CONFLICT (drop_id, step_number) DO NOTHING
        `, [drop_id, item.step_number, item.step_name, item.phase]);
      }
    } catch (error) {
      console.error('Error creating checklist from template:', error);
      throw error;
    }
  }

  static async updateChecklistItem(
    drop_id: string,
    step_number: number,
    updates: Partial<ChecklistItem>
  ): Promise<ApiResponse<ChecklistItem>> {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');

      const values = Object.values(updates);
      const result = await pool.query(`
        UPDATE checklist_items
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE drop_id = $1 AND step_number = $2
        RETURNING *
      `, [drop_id, step_number, ...values]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Checklist item not found' };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating checklist item:', error);
      return { success: false, error: 'Failed to update checklist item' };
    }
  }

  static async validateChecklist(drop_id: string): Promise<ApiResponse<ChecklistValidation>> {
    try {
      const checklistResult = await pool.query(`
        SELECT * FROM checklist_items
        WHERE drop_id = $1
        ORDER BY step_number
      `, [drop_id]);

      const checklistItems = checklistResult.rows;

      const completedSteps = checklistItems.filter(item => item.is_completed);
      const missingSteps = checklistItems
        .filter(item => !item.is_completed)
        .map(item => item.step_number);

      const phaseCompletion = {
        A: checklistItems.filter(item => item.phase === 'A' && item.is_completed).length / 5,
        B: checklistItems.filter(item => item.phase === 'B' && item.is_completed).length / 3,
        C: checklistItems.filter(item => item.phase === 'C' && item.is_completed).length / 2,
        D: checklistItems.filter(item => item.phase === 'D' && item.is_completed).length / 3,
        E: checklistItems.filter(item => item.phase === 'E' && item.is_completed).length / 1,
      };

      const issues: string[] = [];

      // Validate powermeter reading range for step 12
      const step12 = checklistItems.find(item => item.step_number === 12);
      if (step12 && step12.powermeter_reading) {
        const reading = parseFloat(step12.powermeter_reading as any);
        if (reading < -25 || reading > -10) {
          issues.push('Step 12: Powermeter reading outside acceptable range (-25 to -10 dBm)');
        }
      }

      const validation: ChecklistValidation = {
        is_valid: missingSteps.length === 0 && issues.length === 0,
        completed_steps: completedSteps.length,
        missing_steps: missingSteps,
        completion_rate: (completedSteps.length / checklistItems.length) * 100,
        phase_completion,
        issues,
      };

      return { success: true, data: validation };
    } catch (error) {
      console.error('Error validating checklist:', error);
      return { success: false, error: 'Failed to validate checklist' };
    }
  }

  // Submission operations
  static async createSubmission(submission: Omit<DropSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<DropSubmission>> {
    try {
      const result = await pool.query(`
        INSERT INTO drop_submissions
        (drop_id, contractor_id, status, completion_score, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        submission.drop_id,
        submission.contractor_id,
        submission.status,
        submission.completion_score,
        submission.notes
      ]);

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error creating submission:', error);
      return { success: false, error: 'Failed to create submission' };
    }
  }

  // Review operations
  static async createReview(review: Omit<DropReview, 'id' | 'reviewed_at' | 'created_at'>): Promise<ApiResponse<DropReview>> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create the review
      const reviewResult = await client.query(`
        INSERT INTO drop_reviews
        (submission_id, reviewed_by, status, feedback, missing_steps, completion_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        review.submission_id,
        review.reviewed_by,
        review.status,
        review.feedback,
        review.missing_steps,
        review.completion_score
      ]);

      // Update drop QC status
      const submissionResult = await client.query(`
        SELECT drop_id FROM drop_submissions WHERE id = $1
      `, [review.submission_id]);

      if (submissionResult.rows.length > 0) {
        await client.query(`
          UPDATE drops
          SET qc_status = $1, qc_updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [review.status, submissionResult.rows[0].drop_id]);
      }

      await client.query('COMMIT');
      return { success: true, data: reviewResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating review:', error);
      return { success: false, error: 'Failed to create review' };
    } finally {
      client.release();
    }
  }

  // Contractor operations
  static async getContractors(): Promise<ApiResponse<DropsContractor[]>> {
    try {
      const result = await pool.query('SELECT * FROM drops_contractors ORDER BY name');
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error fetching contractors:', error);
      return { success: false, error: 'Failed to fetch contractors' };
    }
  }

  static async getContractorById(id: string): Promise<ApiResponse<DropsContractor>> {
    try {
      const result = await pool.query('SELECT * FROM drops_contractors WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return { success: false, error: 'Contractor not found' };
      }
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error fetching contractor:', error);
      return { success: false, error: 'Failed to fetch contractor' };
    }
  }

  // Dashboard operations
  static async getDashboardData(): Promise<ApiResponse<DashboardResponse>> {
    try {
      const dropsResult = await this.getDrops({ limit: 100 });

      if (!dropsResult.success || !dropsResult.data) {
        return { success: false, error: 'Failed to fetch dashboard data' };
      }

      const drops = dropsResult.data;
      const totalDrops = drops.length;
      const pendingDrops = drops.filter(d => d.qc_status === 'pending').length;
      const approvedDrops = drops.filter(d => d.qc_status === 'approved').length;
      const needsRectificationDrops = drops.filter(d => d.qc_status === 'needs-rectification').length;

      const averageCompletionRate = drops.length > 0
        ? drops.reduce((sum, drop) => sum + (drop.completed_steps / drop.total_steps), 0) / drops.length * 100
        : 0;

      const dashboardData: DashboardResponse = {
        drops,
        total_drops: totalDrops,
        pending_drops: pendingDrops,
        approved_drops: approvedDrops,
        needs_rectification_drops: needsRectificationDrops,
        average_completion_rate: Math.round(averageCompletionRate),
      };

      return { success: true, data: dashboardData };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return { success: false, error: 'Failed to fetch dashboard data' };
    }
  }
}