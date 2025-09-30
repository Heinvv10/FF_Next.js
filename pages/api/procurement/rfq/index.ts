import type { NextApiRequest, NextApiResponse } from 'next';
import type { RFQ } from '../../../../src/types/procurement/rfq.types';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logCreate, logUpdate, logDelete } from '@/lib/db-logger';
import { apiResponse, ErrorCode } from '../../../../src/lib/apiResponse';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

// Simple in-memory cache (5 minute TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(projectId: string): string {
  return `rfq:${projectId}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { projectId } = req.query;

  if (req.method === 'GET') {
    try {
      // Check cache first
      const cacheKey = getCacheKey(projectId as string);
      const cachedData = getFromCache(cacheKey);

      if (cachedData) {
        console.log(`🎯 Cache hit for ${cacheKey}`);
        return res.status(200).json(cachedData);
      }

      console.log(`🔍 Cache miss for ${cacheKey}, querying database`);
      // Query real data from database
      let rfqData;
      let itemsData;
      
      if (projectId && projectId !== 'all') {
        // Get RFQs for specific project
        rfqData = await sql`
          SELECT * FROM rfqs 
          WHERE project_id = ${projectId}
          ORDER BY created_at DESC
        `;
        
        // Get RFQ items
        if (rfqData.length > 0) {
          const rfqIds = rfqData.map(r => r.id);
          itemsData = await sql`
            SELECT * FROM rfq_items
            WHERE rfq_id = ANY(${rfqIds})
            ORDER BY line_number
          `;
        } else {
          itemsData = [];
        }
      } else {
        // Get all RFQs with quotes count
        rfqData = await sql`
          SELECT 
            r.*,
            (SELECT COUNT(*) FROM quotes WHERE quotes.rfq_id = r.id)::int as quotes_received
          FROM rfqs r
          ORDER BY r.created_at DESC
          LIMIT 100
        `;
        
        // Get items for recent RFQs
        if (rfqData.length > 0) {
          const rfqIds = rfqData.slice(0, 20).map(r => r.id);
          itemsData = await sql`
            SELECT * FROM rfq_items
            WHERE rfq_id = ANY(${rfqIds})
            ORDER BY line_number
            LIMIT 200
          `;
        } else {
          itemsData = [];
        }
      }
      
      // Group items by RFQ
      const itemsByRfq = itemsData.reduce((acc, item) => {
        if (!acc[item.rfq_id]) acc[item.rfq_id] = [];
        acc[item.rfq_id].push(item);
        return acc;
      }, {} as Record<string, typeof itemsData>);
      
      // Transform data to match expected format
      const transformedRFQs: RFQ[] = rfqData.map(rfq => ({
        id: rfq.id,
        rfqNumber: rfq.rfq_number,
        projectId: rfq.project_id,
        title: rfq.title,
        description: rfq.description || '',
        status: rfq.status as 'draft' | 'open' | 'evaluating' | 'awarded' | 'cancelled',
        createdDate: rfq.created_at || new Date().toISOString(),
        dueDate: rfq.response_deadline || new Date().toISOString(),
        items: (itemsByRfq[rfq.id] || []).map(item => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.uom,
          specifications: typeof item.specifications === 'string' 
            ? item.specifications 
            : JSON.stringify(item.specifications || '')
        })),
        suppliers: rfq.invited_suppliers || [],
        quotesReceived: rfq.quotes_received || 0,
        totalValue: rfq.total_budget_estimate ? Number(rfq.total_budget_estimate) : 0,
        createdBy: rfq.created_by || 'System',
        updatedAt: rfq.updated_at || new Date().toISOString()
      }));
      
      // Add aggregated stats
      const stats = {
        totalRFQs: transformedRFQs.length,
        openRFQs: transformedRFQs.filter(r => r.status === 'open').length,
        totalValue: transformedRFQs.reduce((sum, rfq) => sum + rfq.totalValue, 0),
        avgQuotesPerRFQ: transformedRFQs.length > 0 
          ? transformedRFQs.reduce((sum, rfq) => sum + rfq.quotesReceived, 0) / transformedRFQs.length 
          : 0,
      };

      // Check if we should use paginated response
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 100;
      
      if (req.query.page || req.query.limit) {
        // Return paginated response
        return apiResponse.paginated(
          res,
          transformedRFQs,
          {
            page,
            pageSize: limit,
            total: transformedRFQs.length,
          },
          undefined,
          { stats }
        );
      } else {
        // Return standard response with stats in meta
        return apiResponse.success(
          res,
          {
            rfqs: transformedRFQs,
            total: transformedRFQs.length,
          },
          undefined,
          200,
          { stats }
        );
      }
    } catch (error) {
      return apiResponse.databaseError(res, error, 'Failed to fetch RFQs');
    }
  } else if (req.method === 'POST') {
    try {
      const newRFQ = req.body;
      
      // Validate required fields
      const validationErrors: Record<string, string> = {};
      
      if (!newRFQ.title) {
        validationErrors.title = 'RFQ title is required';
      }
      
      if (!newRFQ.projectId && !projectId) {
        validationErrors.projectId = 'Project ID is required';
      }
      
      if (newRFQ.items && !Array.isArray(newRFQ.items)) {
        validationErrors.items = 'Items must be an array';
      }
      
      if (newRFQ.status && !['draft', 'open', 'evaluating', 'awarded', 'cancelled'].includes(newRFQ.status)) {
        validationErrors.status = 'Invalid RFQ status';
      }
      
      // Return validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        return apiResponse.validationError(res, validationErrors);
      }
      
      // Generate RFQ number if not provided
      const rfqNumber = newRFQ.rfqNumber || `RFQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const responseDeadline = newRFQ.responseDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Insert new RFQ into database
      const insertedRFQs = await sql`
        INSERT INTO rfqs (
          rfq_number, project_id, title, description, status, 
          response_deadline, invited_suppliers, total_budget_estimate, created_by
        )
        VALUES (
          ${rfqNumber},
          ${newRFQ.projectId || projectId},
          ${newRFQ.title},
          ${newRFQ.description || ''},
          ${newRFQ.status || 'draft'},
          ${responseDeadline},
          ${JSON.stringify(newRFQ.suppliers || newRFQ.supplierIds || [])},
          ${newRFQ.totalValue || 0},
          ${newRFQ.createdBy || 'System'}
        )
        RETURNING *
      `;
      
      // Log RFQ creation
      if (insertedRFQs[0]) {
        logCreate('rfq', insertedRFQs[0].id, {
          rfq_number: insertedRFQs[0].rfq_number,
          project_id: insertedRFQs[0].project_id,
          title: insertedRFQs[0].title,
          total_budget: insertedRFQs[0].total_budget_estimate
        });
      }
      
      // Transform the response to match RFQ type
      const createdRFQ: RFQ = {
        id: insertedRFQs[0].id,
        rfqNumber: insertedRFQs[0].rfq_number,
        projectId: insertedRFQs[0].project_id,
        title: insertedRFQs[0].title,
        description: insertedRFQs[0].description || '',
        status: insertedRFQs[0].status as 'draft' | 'open' | 'evaluating' | 'awarded' | 'cancelled',
        createdDate: insertedRFQs[0].created_at || new Date().toISOString(),
        dueDate: insertedRFQs[0].response_deadline || new Date().toISOString(),
        items: [],
        suppliers: insertedRFQs[0].invited_suppliers || [],
        quotesReceived: 0,
        totalValue: Number(insertedRFQs[0].total_budget_estimate || 0),
        createdBy: insertedRFQs[0].created_by || 'System',
        updatedAt: insertedRFQs[0].updated_at || new Date().toISOString()
      };
      
      return apiResponse.created(res, createdRFQ, 'RFQ created successfully');
    } catch (error: any) {
      // Check for specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return apiResponse.error(
          res,
          ErrorCode.CONFLICT,
          'An RFQ with this number already exists'
        );
      }
      
      if (error.code === '23503') { // Foreign key violation
        return apiResponse.error(
          res,
          ErrorCode.VALIDATION_ERROR,
          'Invalid project ID or related reference'
        );
      }
      
      return apiResponse.databaseError(res, error, 'Failed to create RFQ');
    }
  } else {
    return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST']);
  }
})