/**
 * Contractor Teams API - Team management endpoints
 * GET /api/contractors/[id]/teams - List teams for a contractor
 * POST /api/contractors/[id]/teams - Create a new team for a contractor
 * PUT /api/contractors/[id]/teams/[teamId] - Update team (handled separately if needed)
 * DELETE /api/contractors/[id]/teams/[teamId] - Delete team (handled separately if needed)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { log } from '@/lib/logger';
import { apiResponse } from '@/lib/apiResponse';
import type { ContractorTeam, TeamFormData } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(id, res);
      case 'POST':
        return await handlePost(id, req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Contractor Teams API error:', { data: error }, 'api/contractors/[id]/teams');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle GET request - List teams for a contractor
 */
async function handleGet(
  contractorId: string,
  res: NextApiResponse<ContractorTeam[] | { error: string }>
) {
  try {
    // Check if contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    const teams = await neonContractorService.getContractorTeams(contractorId);

    return apiResponse.success(res, teams);
  } catch (error) {
    log.error('Error fetching contractor teams:', { data: error }, 'api/contractors/[id]/teams');
    throw error;
  }
}

/**
 * Handle POST request - Create new team for contractor
 */
async function handlePost(
  contractorId: string,
  req: NextApiRequest,
  res: NextApiResponse<ContractorTeam | { error: string }>
) {
  try {
    const data: TeamFormData = req.body;
    
    // Check if contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Basic validation
    if (!data.teamName || !data.teamType || !data.teamSize) {
      return apiResponse.validationError(res, {
        required: 'Missing required fields: teamName, teamType, teamSize'
      });
    }

    // Validate team size
    if (data.teamSize < 1 || data.teamSize > 100) {
      return apiResponse.validationError(res, {
        teamSize: 'Team size must be between 1 and 100'
      });
    }

    // Email validation for lead email if provided
    if (data.leadEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.leadEmail)) {
        return apiResponse.validationError(res, { leadEmail: 'Invalid lead email format' });
      }
    }

    const team = await neonContractorService.createTeam(contractorId, data);

    return apiResponse.created(res, team, 'Team created successfully');
  } catch (error) {
    log.error('Error creating team:', { data: error }, 'api/contractors/[id]/teams');

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiResponse.validationError(res, {
        teamName: 'A team with this name already exists for this contractor'
      });
    }

    throw error;
  }
}