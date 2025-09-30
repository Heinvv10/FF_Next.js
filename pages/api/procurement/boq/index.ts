import type { NextApiRequest, NextApiResponse } from 'next';
import type { BOQItem } from '../../../../src/types/procurement/boq.types';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logCreate, logUpdate } from '@/lib/db-logger';

// Initialize database connection with logging
const sql = createLoggedSql(process.env.DATABASE_URL!);

// Simple in-memory cache (5 minute TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(projectId: string): string {
  return `boq:${projectId}`;
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
      let boqData;
      let items;
      
      if (projectId && projectId !== 'all') {
        // Optimized: Get BOQ data for specific project with selective columns
        boqData = await sql`
          SELECT
            id,
            project_id,
            title,
            version,
            status,
            created_at,
            updated_at
          FROM boqs
          WHERE project_id = ${projectId}
          ORDER BY created_at DESC
          LIMIT 50
        `;

        // Optimized: Get only essential BOQ items data
        if (boqData.length > 0) {
          items = await sql`
            SELECT
              id,
              boq_id,
              project_id,
              item_code,
              description,
              uom,
              quantity,
              unit_price,
              total_price,
              category,
              catalog_item_name,
              procurement_status,
              line_number,
              created_at,
              updated_at
            FROM boq_items
            WHERE project_id = ${projectId}
            ORDER BY line_number
            LIMIT 1000
          `;
        } else {
          items = [];
        }
      } else {
        // Optimized: Get all BOQs with efficient count query
        const boqWithCount = await sql`
          SELECT
            b.id,
            b.project_id,
            b.title,
            b.version,
            b.status,
            b.created_at,
            b.updated_at,
            COALESCE(items_count.count, 0)::int as items_count
          FROM boqs b
          LEFT JOIN (
            SELECT boq_id, COUNT(*) as count
            FROM boq_items
            GROUP BY boq_id
          ) items_count ON b.id = items_count.boq_id
          ORDER BY b.created_at DESC
          LIMIT 50
        `;

        boqData = boqWithCount;

        // Optimized: Get items only for the most recent BOQs to reduce data
        if (boqData.length > 0) {
          const recentBoqIds = boqData.slice(0, 10).map(b => b.id); // Only first 10 BOQs
          items = await sql`
            SELECT
              id,
              boq_id,
              project_id,
              item_code,
              description,
              uom,
              quantity,
              unit_price,
              total_price,
              category,
              catalog_item_name,
              procurement_status,
              line_number,
              created_at,
              updated_at
            FROM boq_items
            WHERE boq_id = ANY(${recentBoqIds})
            ORDER BY line_number
            LIMIT 500
          `;
        } else {
          items = [];
        }
      }
      
      // Transform data to match expected format
      const transformedItems: BOQItem[] = items.map(item => ({
        id: item.id,
        projectId: item.project_id,
        itemCode: item.item_code || '',
        description: item.description,
        unit: item.uom,
        quantity: Number(item.quantity),
        unitPrice: item.unit_price ? Number(item.unit_price) : 0,
        totalPrice: item.total_price ? Number(item.total_price) : 0,
        category: item.category || 'Materials',
        supplier: item.catalog_item_name || '',
        status: item.procurement_status || 'pending',
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
      }));
      
      // Add aggregated stats
      const stats = {
        totalValue: transformedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        totalItems: transformedItems.length,
        boqCount: boqData.length,
        categories: [...new Set(transformedItems.map(item => item.category))],
      };

      // Prepare response data
      const responseData = {
        items: transformedItems,
        total: transformedItems.length,
        boqs: boqData,
        stats
      };

      // Store in cache
      setCache(cacheKey, responseData);

      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching BOQ items:', error);
      res.status(500).json({ error: 'Failed to fetch BOQ items' });
    }
  } else if (req.method === 'POST') {
    try {
      const newItem = req.body;
      
      // Insert new BOQ item into database
      const insertedItems = await sql`
        INSERT INTO boq_items (
          boq_id, project_id, item_code, description, uom, quantity, 
          unit_price, total_price, category, catalog_item_name, procurement_status
        )
        VALUES (
          ${newItem.boqId || null}, 
          ${newItem.projectId || projectId},
          ${newItem.itemCode || ''}, 
          ${newItem.description}, 
          ${newItem.unit || newItem.uom}, 
          ${newItem.quantity}, 
          ${newItem.unitPrice || 0}, 
          ${newItem.totalPrice || 0}, 
          ${newItem.category || 'Materials'}, 
          ${newItem.supplier || ''}, 
          ${newItem.status || 'pending'}
        )
        RETURNING *
      `;
      
      // Log BOQ item creation
      if (insertedItems[0]) {
        logCreate('boq_item', insertedItems[0].id, {
          project_id: insertedItems[0].project_id,
          item_code: insertedItems[0].item_code,
          description: insertedItems[0].description,
          quantity: insertedItems[0].quantity,
          total_price: insertedItems[0].total_price
        });
      }
      
      res.status(201).json({ 
        message: 'BOQ item created successfully',
        item: insertedItems[0]
      });
    } catch (error) {
      console.error('Error creating BOQ item:', error);
      res.status(500).json({ error: 'Failed to create BOQ item' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
})