import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql } from '@/lib/db-logger';
import { apiResponse } from '@/lib/apiResponse';

// Initialize database connection with logging
function getDatabaseConnection() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }
  return createLoggedSql(dbUrl);
}

// Cache for stats (5 minute TTL)
const statsCache = new Map<string, { data: any; timestamp: number }>();
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, req.method!, ['GET']);
  }

  const { projectId } = req.query;
  const cacheKey = `action-items-stats:${projectId || 'all'}`;

  try {
    // Check cache first
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
      console.log(`🎯 Stats cache hit for ${cacheKey}`);
      return res.status(200).json(cached.data);
    }

    console.log(`🔍 Stats cache miss for ${cacheKey}, querying database`);

    // Get database connection
    const sql = getDatabaseConnection();

    // Build where clause for project filtering
    let whereClause = '';
    if (projectId && projectId !== 'all') {
      whereClause = `WHERE project_id = ${projectId}`;
    }

    // Check if action_items table exists first
    let statsResult;
    try {
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'action_items'
        );
      `;
      
      const tableExists = await sql.unsafe(tableCheckQuery);
      
      if (!tableExists[0]?.exists) {
        console.log('⚠️ action_items table does not exist, returning empty stats');
        statsResult = [];
      } else {
        // Simplified statistics query - basic counts only
        const statsQuery = `
          SELECT
            COUNT(*) as total_items,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
            COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue,
            COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
            COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
            COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
            COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned,
            COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned
          FROM action_items
          ${whereClause}
        `;
        
        statsResult = await sql.unsafe(statsQuery);
      }
    } catch (tableError) {
      console.log('⚠️ Error checking action_items table, assuming it does not exist:', tableError);
      statsResult = [];
    }

    if (!statsResult || statsResult.length === 0) {
      return apiResponse.success(res, {
        summary: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          overdue: 0,
          upcoming: 0,
          unassigned: 0,
          assigned: 0
        },
        priority: {
          high: 0,
          medium: 0,
          low: 0
        },
        dueDates: {
          overdue: 0,
          thisWeek: 0,
          thisMonth: 0
        },
        performance: {
          completionRate: 0,
          onTimeCompletionRate: 0,
          completedOnTime: 0,
          completedLate: 0
        },
        breakdowns: {
          categories: [],
          projects: [],
          assignees: []
        },
        trends: [],
        generatedAt: new Date().toISOString()
      }, 'No action items found');
    }

    const stats = statsResult[0];

    // Calculate derived metrics with null checks
    const totalItems = parseInt(stats.total_items || '0');
    const completed = parseInt(stats.completed || '0');
    const completionRate = totalItems > 0
      ? ((completed / totalItems) * 100).toFixed(1)
      : 0;

    // Prepare simplified response data
    const responseData = {
      summary: {
        total: totalItems,
        pending: parseInt(stats.pending || '0'),
        inProgress: parseInt(stats.in_progress || '0'),
        completed: completed,
        cancelled: parseInt(stats.cancelled || '0'),
        overdue: parseInt(stats.overdue || '0'),
        upcoming: 0, // Simplified - not calculated
        unassigned: parseInt(stats.unassigned || '0'),
        assigned: parseInt(stats.assigned || '0')
      },
      priority: {
        high: parseInt(stats.high_priority || '0'),
        medium: parseInt(stats.medium_priority || '0'),
        low: parseInt(stats.low_priority || '0')
      },
      dueDates: {
        overdue: parseInt(stats.overdue || '0'),
        thisWeek: 0, // Simplified - not calculated
        thisMonth: 0  // Simplified - not calculated
      },
      performance: {
        completionRate: parseFloat(completionRate.toString()),
        onTimeCompletionRate: 0, // Simplified - not calculated
        completedOnTime: 0,      // Simplified - not calculated
        completedLate: 0         // Simplified - not calculated
      },
      breakdowns: {
        categories: [],  // Simplified - not calculated
        projects: [],    // Simplified - not calculated
        assignees: []    // Simplified - not calculated
      },
      trends: [],      // Simplified - not calculated
      generatedAt: new Date().toISOString()
    };

    // Store in cache
    statsCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return apiResponse.success(res, responseData, 'Action items statistics retrieved successfully');
  } catch (error) {
    console.error('Error fetching action items statistics:', error);
    return apiResponse.databaseError(res, error, 'Failed to fetch action items statistics');
  }
});