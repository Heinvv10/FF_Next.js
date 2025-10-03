/**
 * Individual Contractor API Endpoint
 * GET /api/contractors/[id] - Get specific contractor
 * PUT /api/contractors/[id] - Update contractor
 * DELETE /api/contractors/[id] - Delete contractor
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { contractorNeonService } from '@/services/contractor/contractorNeonService';
import { log } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Contractor ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return await getContractor(req, res, id);
      case 'PUT':
        return await updateContractor(req, res, id);
      case 'DELETE':
        return await deleteContractor(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    log.error('Contractor API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getContractor(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const contractor = await contractorNeonService.getContractorById(id);

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    return res.status(200).json({
      success: true,
      data: contractor
    });
  } catch (error) {
    log.error('Error fetching contractor:', error);
    return res.status(500).json({
      error: 'Failed to fetch contractor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateContractor(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const updateData = req.body;

    const updatedContractor = await contractorNeonService.updateContractor(id, updateData);

    if (!updatedContractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    return res.status(200).json({
      success: true,
      data: updatedContractor,
      message: 'Contractor updated successfully'
    });
  } catch (error) {
    log.error('Error updating contractor:', error);
    return res.status(500).json({
      error: 'Failed to update contractor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function deleteContractor(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const deleted = await contractorNeonService.deleteContractor(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Contractor deleted successfully'
    });
  } catch (error) {
    log.error('Error deleting contractor:', error);
    return res.status(500).json({
      error: 'Failed to delete contractor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}