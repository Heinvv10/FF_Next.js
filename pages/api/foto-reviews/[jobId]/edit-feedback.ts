// PATCH /api/foto-reviews/[jobId]/edit-feedback
// Proxy to antigravity API - Edit feedback

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const ANTIGRAVITY_API_URL = process.env.ANTIGRAVITY_API_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return apiResponse.methodNotAllowed(res);
  }

  try {
    // Verify authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return apiResponse.unauthorized(res);
    }

    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return apiResponse.validationError(res, { jobId: 'Job ID is required' });
    }

    // Forward to antigravity API
    const url = `${ANTIGRAVITY_API_URL}/api/queue/${jobId}/edit-feedback`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...req.body,
        editor_id: userId,
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
    console.error('Error editing feedback:', error);
    return apiResponse.internalError(res, error);
  }
}
