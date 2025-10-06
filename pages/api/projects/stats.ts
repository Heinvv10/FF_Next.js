import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';

/**
 * Projects Statistics API Route
 * GET /api/projects/stats - Get project statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Get project statistics directly from database
    const result = await sql`
      SELECT
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' OR status = 'in_progress' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_projects,
        COALESCE(SUM(budget::numeric), 0) as total_budget,
        COALESCE(AVG(budget::numeric), 0) as average_budget,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_projects,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_projects,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_projects
      FROM projects
    `;

    const stats = result[0];

    // Get projects by status breakdown
    const statusBreakdown = await sql`
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(budget::numeric), 0) as total_budget
      FROM projects
      GROUP BY status
      ORDER BY count DESC
    `;

    return res.status(200).json({
      success: true,
      data: {
        total: parseInt(stats.total_projects),
        active: parseInt(stats.active_projects),
        completed: parseInt(stats.completed_projects),
        planning: parseInt(stats.planning_projects),
        onHold: parseInt(stats.on_hold_projects),
        cancelled: parseInt(stats.cancelled_projects),
        totalBudget: parseFloat(stats.total_budget) || 0,
        averageBudget: parseFloat(stats.average_budget) || 0,
        highPriority: parseInt(stats.high_priority_projects),
        mediumPriority: parseInt(stats.medium_priority_projects),
        lowPriority: parseInt(stats.low_priority_projects),
        breakdown: statusBreakdown
      }
    });
  } catch (error) {
    log.error('Error fetching project statistics:', { data: error }, 'api');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project statistics'
    });
  }
}