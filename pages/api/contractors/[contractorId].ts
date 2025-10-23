/**
 * Contractor API - Individual contractor operations
 * GET /api/contractors/[contractorId] - Get contractor by ID
 * PUT /api/contractors/[contractorId] - Update contractor
 * DELETE /api/contractors/[contractorId] - Delete contractor (soft delete by default)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { log } from '@/lib/logger';
import type { Contractor, ContractorFormData } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { contractorId } = req.query;

  if (!contractorId || typeof contractorId !== 'string') {
    return res.status(400).json({ error: 'Invalid contractor ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(contractorId, res);
      case 'PUT':
        return await handlePut(contractorId, req, res);
      case 'DELETE':
        return await handleDelete(contractorId, req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Contractor API error:', { data: error }, 'api/contractors/[contractorId]');
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET request - Get contractor by ID
 */
async function handleGet(
  id: string,
  res: NextApiResponse<Contractor | { error: string }>
) {
  try {
    const contractor = await neonContractorService.getContractorById(id);
    
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    return res.status(200).json({ success: true, data: contractor });
  } catch (error) {
    log.error('Error fetching contractor:', { data: error }, 'api/contractors/[contractorId]');
    throw error;
  }
}

/**
 * Handle PUT request - Update contractor
 */
async function handlePut(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<Contractor | { error: string }>
) {
  try {
    const data: Partial<ContractorFormData> = req.body;
    
    // Check if contractor exists
    const existing = await neonContractorService.getContractorById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    // Email validation if email is being updated
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    const contractor = await neonContractorService.updateContractor(id, data);

    return res.status(200).json({ success: true, data: contractor });
  } catch (error) {
    log.error('Error updating contractor:', { data: error }, 'api/contractors/[contractorId]');

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'A contractor with this registration number already exists'
      });
    }

    throw error;
  }
}

/**
 * Handle DELETE request - Delete contractor
 */
async function handleDelete(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  try {
    const { hard } = req.query;
    
    // Check if contractor exists
    const existing = await neonContractorService.getContractorById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    // For now, always do soft delete (set is_active = false)
    // Hard delete would require cascade deletion of related records
    await neonContractorService.deleteContractor(id);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    log.error('Error deleting contractor:', { data: error }, 'api/contractors/[contractorId]');
    throw error;
  }
}