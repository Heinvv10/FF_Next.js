/**
 * Contractor Onboarding Complete API
 * POST /api/contractors/[contractorId]/onboarding/complete - Complete onboarding
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
      case 'POST':
        return await handlePost(contractorId, req, res);
      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Onboarding Complete API error:', { data: error }, 'api/contractors/[contractorId]/onboarding/complete');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle POST request - Complete onboarding
 */
async function handlePost(
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

    // Check if already completed
    if (contractor.onboardingCompletedAt) {
      return apiResponse.validationError(res, {
        onboarding: `Onboarding already completed on ${contractor.onboardingCompletedAt}`
      });
    }

    try {
      // Complete onboarding (will throw error if prerequisites not met)
      const updatedContractor = await neonContractorService.completeOnboarding(contractorId);

      return apiResponse.success(res, updatedContractor, 'Onboarding completed successfully');
    } catch (error: any) {
      // Check if it's a validation error (missing stages)
      if (error.message && error.message.includes('Missing stages')) {
        return apiResponse.validationError(res, {
          stages: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    log.error('Error completing onboarding:', { data: error }, 'api/contractors/[contractorId]/onboarding/complete');
    throw error;
  }
}
