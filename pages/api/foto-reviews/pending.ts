// GET /api/foto-reviews/pending
// Proxy to antigravity API server - Returns list of reviews awaiting approval

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const ANTIGRAVITY_API_URL = process.env.ANTIGRAVITY_API_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res, req.method || '', ['GET']);
  }

  try {
    // TODO: Re-enable auth in production
    // Verify authentication
    // const { userId } = getAuth(req);
    // if (!userId) {
    //   return apiResponse.unauthorized(res);
    // }

    // Forward query parameters to antigravity API
    const queryParams = new URLSearchParams();
    if (req.query.status) queryParams.set('status', req.query.status as string);
    if (req.query.project) queryParams.set('project', req.query.project as string);
    if (req.query.search) queryParams.set('search', req.query.search as string);
    if (req.query.page) queryParams.set('page', req.query.page as string);
    if (req.query.limit) queryParams.set('limit', req.query.limit as string);

    const url = `${ANTIGRAVITY_API_URL}/api/queue/pending-reviews?${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Antigravity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return apiResponse.success(res, data);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return apiResponse.internalError(res, error);
  }
}
