/**
 * Contractor Onboarding Stages API
 * GET /api/contractors/[contractorId]/onboarding/stages - List all onboarding stages
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
  const { contractorId } = req.query;

  // Validate parameters
  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(contractorId, req, res);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Onboarding Stages API error:', { data: error }, 'api/contractors/[contractorId]/onboarding/stages');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle GET request - Get all onboarding stages for contractor
 */
async function handleGet(
  contractorId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Get onboarding stages
    const stages = await neonContractorService.getOnboardingStages(contractorId);

    return apiResponse.success(res, stages);
  } catch (error) {
    log.error('Error fetching onboarding stages:', { data: error }, 'api/contractors/[contractorId]/onboarding/stages');
    throw error;
  }
}
