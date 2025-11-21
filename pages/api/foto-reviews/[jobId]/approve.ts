// POST /api/foto-reviews/[jobId]/approve
// Proxy to antigravity API - Approve review

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const ANTIGRAVITY_API_URL = process.env.ANTIGRAVITY_API_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res);
  }

  try {
    // Verify authentication
    // const { userId } = getAuth(req);
    // // if (!userId) {
      // return apiResponse.unauthorized(res);
    // }

    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return apiResponse.validationError(res, { jobId: 'Job ID is required' });
    }

    // Forward to antigravity API
    const url = `${ANTIGRAVITY_API_URL}/api/queue/${jobId}/approve`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...req.body,
        reviewer_id: 'system', // TODO: Replace with userId when auth is re-enabled
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return apiResponse.notFound(res, 'Job', jobId);
      }
      throw new Error(`Antigravity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return apiResponse.success(res, data);
  } catch (error) {
    console.error('Error approving review:', error);
    return apiResponse.internalError(res, error);
  }
}
