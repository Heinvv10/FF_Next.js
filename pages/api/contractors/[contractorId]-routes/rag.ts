/**
 * Contractor RAG API - RAG score management
 * PUT /api/contractors/[contractorId]/rag - Update RAG scores
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
      case 'PUT':
        return await handlePut(contractorId, req, res);
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('RAG API error:', { data: error }, 'api/contractors/[contractorId]/rag');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle PUT request - Update RAG scores
 */
async function handlePut(
  contractorId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { scores, reason, changedBy } = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Validate required fields
    if (!scores || typeof scores !== 'object') {
      return apiResponse.validationError(res, {
        scores: 'scores object is required'
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return apiResponse.validationError(res, {
        reason: 'Change reason is required'
      });
    }

    if (!changedBy || typeof changedBy !== 'string' || changedBy.trim() === '') {
      return apiResponse.validationError(res, {
        changedBy: 'changedBy is required'
      });
    }

    // Validate RAG values
    const validRAGValues = ['red', 'amber', 'green'];
    const validScoreTypes = ['overall', 'financial', 'compliance', 'performance', 'safety'];

    for (const [scoreType, value] of Object.entries(scores)) {
      if (!validScoreTypes.includes(scoreType)) {
        return apiResponse.validationError(res, {
          [scoreType]: `Invalid score type. Must be one of: ${validScoreTypes.join(', ')}`
        });
      }

      if (value && !validRAGValues.includes(value)) {
        return apiResponse.validationError(res, {
          [scoreType]: `Invalid RAG value. Must be one of: ${validRAGValues.join(', ')}`
        });
      }
    }

    // Update RAG scores
    const updatedContractor = await neonContractorService.updateRAGScores(
      contractorId,
      scores,
      reason,
      changedBy
    );

    return apiResponse.success(res, updatedContractor, 'RAG scores updated successfully');
  } catch (error) {
    log.error('Error updating RAG scores:', { data: error }, 'api/contractors/[contractorId]/rag');
    throw error;
  }
}
