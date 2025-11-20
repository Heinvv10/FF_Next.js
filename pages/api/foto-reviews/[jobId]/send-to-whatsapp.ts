// POST /api/foto-reviews/[jobId]/send-to-whatsapp
// Proxy to antigravity API - Send feedback to WhatsApp

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
    const url = `${ANTIGRAVITY_API_URL}/api/queue/${jobId}/send-to-whatsapp`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...req.body,
        sent_by: userId,
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
    console.error('Error sending to WhatsApp:', error);
    return apiResponse.internalError(res, error);
  }
}
