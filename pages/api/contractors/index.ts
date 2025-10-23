/**
 * Contractors API - List and Create endpoints
 * GET /api/contractors - List all contractors with optional filters
 * POST /api/contractors - Create a new contractor
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';
import type { Contractor, ContractorFormData } from '@/types/contractor.types';

// Migration function to ensure columns exist
async function ensureContractorColumns() {
  try {
    const sql = neon(process.env.DATABASE_URL || '');

    // Check if columns exist
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      AND column_name IN ('specializations', 'certifications')
    `;

    const existingColumns = checkResult.map(row => row.column_name);

    // Add missing columns
    if (!existingColumns.includes('specializations')) {
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'
      `;
      console.log('Added specializations column');
    }

    if (!existingColumns.includes('certifications')) {
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'
      `;
      console.log('Added certifications column');
    }

    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    // Ensure required columns exist before processing requests
    await ensureContractorColumns();

    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Contractors API error:', { data: error }, 'api/contractors');
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET request - List contractors with filters
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<Contractor[] | { error: string }>
) {
  try {
    const {
      status,
      complianceStatus,
      ragOverall,
      isActive,
      search
    } = req.query;

    // Handle multiple status values
    let statusFilter: string | string[] | undefined;
    if (Array.isArray(status)) {
      statusFilter = status;
    } else if (status) {
      statusFilter = status as string;
    }

    const filters = {
      status: statusFilter,
      complianceStatus: complianceStatus as string,
      ragOverall: ragOverall as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const contractors = await neonContractorService.getContractors(filters);

    return res.status(200).json({ success: true, data: contractors });
  } catch (error) {
    log.error('Error fetching contractors:', { data: error }, 'api/contractors');
    throw error;
  }
}

/**
 * Handle POST request - Create new contractor
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<Contractor | { error: string }>
) {
  try {
    const data: ContractorFormData = req.body;
    
    // Basic validation
    if (!data.companyName || !data.registrationNumber || !data.contactPerson || !data.email) {
      return res.status(400).json({ 
        error: 'Missing required fields: companyName, registrationNumber, contactPerson, email' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const contractor = await neonContractorService.createContractor(data);

    return res.status(201).json({ success: true, data: contractor });
  } catch (error) {
    log.error('Error creating contractor:', { data: error }, 'api/contractors');
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({ 
        error: 'A contractor with this registration number already exists' 
      });
    }
    
    throw error;
  }
}