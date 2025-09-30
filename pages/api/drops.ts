import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the request
  log.info('API Request', {
    method: req.method,
    path: req.url,
    query: req.query,
    ip: req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query drops data from our DROPS quality control system
    // This uses the dashboard view we created during migration
    const drops = await sql`
      SELECT 
        d.id,
        d.drop_number,
        d.pole_number,
        d.address as customer_address,
        d.customer_name,
        d.status,
        d.qc_status,
        d.created_at as drop_created_at,
        COALESCE(
          (SELECT COUNT(*)
           FROM checklist_items ci
           WHERE ci.drop_id = d.id AND ci.is_completed = true), 0
        ) as completed_steps,
        14 as total_steps,
        -- Add contractor information if available
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
        c.id as contractor_id,
        c.name as contractor_name,
        c.whatsapp_number
      FROM drops d
      LEFT JOIN drop_submissions ds ON d.id = ds.drop_id
      LEFT JOIN drops_contractors c ON ds.contractor_id = c.id
      LEFT JOIN drop_reviews dr ON ds.id = dr.submission_id
      ORDER BY d.created_at DESC
    `;

    // Transform the data to match the expected format for the contractor portal
    const transformedDrops = drops.map((drop: any) => ({
      id: drop.id,
      drop_number: drop.drop_number,
      pole_number: drop.pole_number,
      customer_address: drop.customer_address || 'Address not specified',
      customer_name: drop.customer_name || 'Customer name not specified',
      status: drop.status || 'planned',
      qc_status: drop.qc_status || 'pending',
      created_at: drop.drop_created_at,
      completed_steps: parseInt(drop.completed_steps) || 0,
      total_steps: parseInt(drop.total_steps) || 14,
      completion_percentage: Math.round((parseInt(drop.completed_steps) || 0) / 14 * 100),
      
      // Submission information
      submission: drop.submission_id ? {
        id: drop.submission_id,
        status: drop.submission_status,
        submitted_at: drop.submitted_at,
        completion_score: drop.submission_score,
        notes: drop.submission_notes
      } : null,
      
      // Review information
      review: drop.review_id ? {
        id: drop.review_id,
        status: drop.review_status,
        feedback: drop.feedback,
        reviewed_at: drop.reviewed_at,
        reviewed_by: drop.reviewed_by,
        missing_steps: drop.missing_steps
      } : null,
      
      // Contractor information
      contractor: drop.contractor_id ? {
        id: drop.contractor_id,
        name: drop.contractor_name,
        whatsapp_number: drop.whatsapp_number
      } : null
    }));

    log.info('DROPS API Response', { 
      total_drops: transformedDrops.length,
      status_breakdown: {
        pending: transformedDrops.filter(d => d.qc_status === 'pending').length,
        approved: transformedDrops.filter(d => d.qc_status === 'approved').length,
        needs_rectification: transformedDrops.filter(d => d.qc_status === 'needs-rectification').length
      }
    });

    res.status(200).json(transformedDrops);

  } catch (error) {
    log.error('DROPS API Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ 
      error: 'Failed to fetch drops data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}