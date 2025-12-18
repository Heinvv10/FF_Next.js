// POST /api/foto-reviews/[jobId]/send-to-whatsapp
// Send feedback to WhatsApp using direct foto/feedback API

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const ANTIGRAVITY_API_URL = process.env.ANTIGRAVITY_API_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method || '', ['POST']);
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

    // Get job details from Antigravity API to extract DR number and feedback
    const jobUrl = `${ANTIGRAVITY_API_URL}/api/queue/status/${jobId}`;
    const jobResponse = await fetch(jobUrl);

    if (!jobResponse.ok) {
      if (jobResponse.status === 404) {
        return apiResponse.notFound(res, 'Job', jobId);
      }
      throw new Error(`Failed to fetch job details: ${jobResponse.statusText}`);
    }

    const jobData = await jobResponse.json();

    // Extract the required fields
    const dr_number = jobData.dr_number;
    const message = jobData.edited_feedback || jobData.original_feedback;
    const project = jobData.project;

    if (!dr_number) {
      throw new Error('Job is missing DR number');
    }

    if (!message) {
      throw new Error('Job is missing feedback message');
    }

    // Call the direct foto/feedback API (which has WhatsApp integration working)
    const feedbackUrl = '/api/foto/feedback';
    const feedbackResponse = await fetch(`${req.headers.host ? 'http://' + req.headers.host : ''}${feedbackUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dr_number,
        message,
        project,
      }),
    });

    if (!feedbackResponse.ok) {
      const errorData = await feedbackResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || 'Failed to send feedback');
    }

    const feedbackData = await feedbackResponse.json();

    // Return success response in the format expected by frontend
    return apiResponse.success(res, {
      success: true,
      sent_at: new Date().toISOString(),
      message: 'Feedback sent to WhatsApp successfully',
      details: feedbackData,
    });
  } catch (error) {
    console.error('Error sending to WhatsApp:', error);
    return apiResponse.internalError(res, error);
  }
}
