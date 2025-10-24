/**
 * Contractor Team API - Individual team operations
 * PUT /api/contractors/[contractorId]/teams/[teamId] - Update team
 * DELETE /api/contractors/[contractorId]/teams/[teamId] - Delete team
 * PATCH /api/contractors/[contractorId]/teams/[teamId]/availability - Update availability (handled separately)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { apiResponse } from '@/lib/apiResponse';
import { log } from '@/lib/logger';
import type { ContractorTeam, TeamFormData } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { contractorId, teamId } = req.query;

  // Validate parameters
  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
  }

  if (!teamId || typeof teamId !== 'string') {
    return apiResponse.validationError(res, { teamId: 'Invalid team ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(contractorId, teamId, res);
      case 'PUT':
        return await handlePut(contractorId, teamId, req, res);
      case 'DELETE':
        return await handleDelete(contractorId, teamId, res);
      case 'PATCH':
        return await handlePatch(contractorId, teamId, req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Team API error:', { data: error }, 'api/contractors/[contractorId]/teams/[teamId]');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle GET request - Get team by ID
 */
async function handleGet(
  contractorId: string,
  teamId: string,
  res: NextApiResponse
) {
  try {
    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Get all teams and find the specific one
    const teams = await neonContractorService.getContractorTeams(contractorId);
    const team = teams.find(t => t.id === teamId);

    if (!team) {
      return apiResponse.notFound(res, 'Team', teamId);
    }

    // Verify team belongs to contractor
    if (team.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        teamId: 'Team does not belong to this contractor'
      });
    }

    return apiResponse.success(res, team);
  } catch (error) {
    log.error('Error fetching team:', { data: error }, 'api/contractors/[contractorId]/teams/[teamId]');
    throw error;
  }
}

/**
 * Handle PUT request - Update team
 */
async function handlePut(
  contractorId: string,
  teamId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data: Partial<TeamFormData> = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify team exists and belongs to contractor
    const teams = await neonContractorService.getContractorTeams(contractorId);
    const existingTeam = teams.find(t => t.id === teamId);

    if (!existingTeam) {
      return apiResponse.notFound(res, 'Team', teamId);
    }

    if (existingTeam.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        teamId: 'Team does not belong to this contractor'
      });
    }

    // Validate team type if provided
    if (data.teamType) {
      const validTeamTypes = ['installation', 'maintenance', 'survey', 'fiber_splicing', 'excavation', 'other'];
      if (!validTeamTypes.includes(data.teamType)) {
        return apiResponse.validationError(res, {
          teamType: `Invalid team type. Must be one of: ${validTeamTypes.join(', ')}`
        });
      }
    }

    // Validate team size if provided
    if (data.teamSize !== undefined) {
      if (data.teamSize < 1 || data.teamSize > 100) {
        return apiResponse.validationError(res, {
          teamSize: 'Team size must be between 1 and 100'
        });
      }
    }

    // Validate availability if provided
    if (data.availability) {
      const validAvailability = ['available', 'busy', 'on_leave', 'inactive'];
      if (!validAvailability.includes(data.availability)) {
        return apiResponse.validationError(res, {
          availability: `Invalid availability. Must be one of: ${validAvailability.join(', ')}`
        });
      }
    }

    // Validate lead email if provided
    if (data.leadEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.leadEmail)) {
        return apiResponse.validationError(res, {
          leadEmail: 'Invalid email format'
        });
      }
    }

    // Update team
    const updatedTeam = await neonContractorService.updateTeam(teamId, data);

    return apiResponse.success(res, updatedTeam, 'Team updated successfully');
  } catch (error) {
    log.error('Error updating team:', { data: error }, 'api/contractors/[contractorId]/teams/[teamId]');

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return apiResponse.validationError(res, {
        teamName: 'A team with this name already exists for this contractor'
      });
    }

    throw error;
  }
}

/**
 * Handle DELETE request - Delete team
 */
async function handleDelete(
  contractorId: string,
  teamId: string,
  res: NextApiResponse
) {
  try {
    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify team exists and belongs to contractor
    const teams = await neonContractorService.getContractorTeams(contractorId);
    const existingTeam = teams.find(t => t.id === teamId);

    if (!existingTeam) {
      return apiResponse.notFound(res, 'Team', teamId);
    }

    if (existingTeam.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        teamId: 'Team does not belong to this contractor'
      });
    }

    // Delete team
    await neonContractorService.deleteTeam(teamId);

    return apiResponse.success(res, { id: teamId }, 'Team deleted successfully');
  } catch (error) {
    log.error('Error deleting team:', { data: error }, 'api/contractors/[contractorId]/teams/[teamId]');
    throw error;
  }
}

/**
 * Handle PATCH request - Partial updates (availability, etc.)
 */
async function handlePatch(
  contractorId: string,
  teamId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { availability } = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify team exists and belongs to contractor
    const teams = await neonContractorService.getContractorTeams(contractorId);
    const existingTeam = teams.find(t => t.id === teamId);

    if (!existingTeam) {
      return apiResponse.notFound(res, 'Team', teamId);
    }

    if (existingTeam.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        teamId: 'Team does not belong to this contractor'
      });
    }

    // Validate availability
    if (availability) {
      const validAvailability = ['available', 'busy', 'on_leave', 'inactive'];
      if (!validAvailability.includes(availability)) {
        return apiResponse.validationError(res, {
          availability: `Invalid availability. Must be one of: ${validAvailability.join(', ')}`
        });
      }

      // Update only availability
      const updatedTeam = await neonContractorService.updateTeam(teamId, { availability });
      return apiResponse.success(res, updatedTeam, 'Team availability updated successfully');
    }

    // If no recognized field provided
    return apiResponse.validationError(res, {
      message: 'No valid fields provided for update. Supported fields: availability'
    });
  } catch (error) {
    log.error('Error patching team:', { data: error }, 'api/contractors/[contractorId]/teams/[teamId]');
    throw error;
  }
}
