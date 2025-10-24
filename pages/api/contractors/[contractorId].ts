/**
 * Contractor API - Individual contractor operations
 * GET /api/contractors/[contractorId] - Get contractor by ID
 * PUT /api/contractors/[contractorId] - Update contractor
 * DELETE /api/contractors/[contractorId] - Delete contractor (soft delete by default)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { log } from '@/lib/logger';
import { apiResponse } from '@/lib/apiResponse';
import type { Contractor, ContractorFormData } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { contractorId } = req.query;

  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
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
    return apiResponse.internalError(res, error);
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
      return apiResponse.notFound(res, 'Contractor', id);
    }

    return apiResponse.success(res, contractor);
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
      return apiResponse.notFound(res, 'Contractor', id);
    }

    // Email validation if email is being updated
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return apiResponse.validationError(res, { email: 'Invalid email format' });
      }
    }

    const contractor = await neonContractorService.updateContractor(id, data);

    return apiResponse.success(res, contractor, 'Contractor updated successfully');
  } catch (error) {
    log.error('Error updating contractor:', { data: error }, 'api/contractors/[contractorId]');

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiResponse.validationError(res, {
        registrationNumber: 'A contractor with this registration number already exists'
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
      return apiResponse.notFound(res, 'Contractor', id);
    }

    // For now, always do soft delete (set is_active = false)
    // Hard delete would require cascade deletion of related records
    await neonContractorService.deleteContractor(id);

    return apiResponse.success(res, { id }, 'Contractor deleted successfully');
  } catch (error) {
    log.error('Error deleting contractor:', { data: error }, 'api/contractors/[contractorId]');
    throw error;
  }
}