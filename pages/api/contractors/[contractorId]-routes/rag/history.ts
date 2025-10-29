/**
 * Contractor RAG History API - RAG score history
 * GET /api/contractors/[contractorId]/rag/history - Get RAG score change history
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
    log.error('RAG History API error:', { data: error }, 'api/contractors/[contractorId]/rag/history');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle GET request - Get RAG score history
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

    // Get score_type filter from query params
    const { scoreType } = req.query;

    // Validate scoreType if provided
    if (scoreType && typeof scoreType === 'string') {
      const validScoreTypes = ['overall', 'financial', 'compliance', 'performance', 'safety'];
      if (!validScoreTypes.includes(scoreType)) {
        return apiResponse.validationError(res, {
          scoreType: `Invalid score type. Must be one of: ${validScoreTypes.join(', ')}`
        });
      }
    }

    // Get RAG history
    const history = await neonContractorService.getRAGHistory(
      contractorId,
      typeof scoreType === 'string' ? scoreType : undefined
    );

    return apiResponse.success(res, history);
  } catch (error) {
    log.error('Error fetching RAG history:', { data: error }, 'api/contractors/[contractorId]/rag/history');
    throw error;
  }
}
