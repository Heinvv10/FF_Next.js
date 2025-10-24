/**
 * Contractor Onboarding Stage API
 * PUT /api/contractors/[contractorId]/onboarding/stages/[stageId] - Update stage
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { apiResponse } from '@/lib/apiResponse';
import { log } from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { contractorId, stageId } = req.query;

  // Validate parameters
  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
  }

  if (!stageId || typeof stageId !== 'string') {
    return apiResponse.validationError(res, { stageId: 'Invalid stage ID' });
  }

  try {
    switch (method) {
      case 'PUT':
        return await handlePut(contractorId, stageId, req, res);
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Onboarding Stage API error:', { data: error }, 'api/contractors/[contractorId]/onboarding/stages/[stageId]');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle PUT request - Update onboarding stage
 */
async function handlePut(
  contractorId: string,
  stageId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { status, completionPercentage, completedDocuments, startedAt, completedAt, notes } = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify stage belongs to contractor
    const stages = await neonContractorService.getOnboardingStages(contractorId);
    const stage = stages.find((s: any) => s.id === stageId);
    if (!stage) {
      return apiResponse.notFound(res, 'Onboarding stage', stageId);
    }

    // Validate status
    if (status && typeof status === 'string') {
      const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
      if (!validStatuses.includes(status)) {
        return apiResponse.validationError(res, {
          status: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Validate completion percentage
    if (completionPercentage !== undefined && typeof completionPercentage === 'number') {
      if (completionPercentage < 0 || completionPercentage > 100) {
        return apiResponse.validationError(res, {
          completionPercentage: 'Completion percentage must be between 0 and 100'
        });
      }
    }

    // Validate completed documents
    if (completedDocuments !== undefined && !Array.isArray(completedDocuments)) {
      return apiResponse.validationError(res, {
        completedDocuments: 'Completed documents must be an array'
      });
    }

    // Validate date formats
    if (startedAt && typeof startedAt === 'string') {
      const date = new Date(startedAt);
      if (isNaN(date.getTime())) {
        return apiResponse.validationError(res, {
          startedAt: 'Invalid date format'
        });
      }
    }

    if (completedAt && typeof completedAt === 'string') {
      const date = new Date(completedAt);
      if (isNaN(date.getTime())) {
        return apiResponse.validationError(res, {
          completedAt: 'Invalid date format'
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;
    if (completedDocuments !== undefined) updateData.completedDocuments = completedDocuments;
    if (startedAt !== undefined) updateData.startedAt = startedAt ? new Date(startedAt) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Update stage
    const updatedStage = await neonContractorService.updateOnboardingStage(stageId, updateData);

    return apiResponse.success(res, updatedStage, 'Onboarding stage updated successfully');
  } catch (error) {
    log.error('Error updating onboarding stage:', { data: error }, 'api/contractors/[contractorId]/onboarding/stages/[stageId]');
    throw error;
  }
}
