// GET /api/foto-reviews/image?jobId={jobId}
// Proxy to antigravity API - Serve property photos

import type { NextApiRequest, NextApiResponse } from 'next';

const ANTIGRAVITY_API_URL = process.env.ANTIGRAVITY_API_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Proxy to antigravity API
    const url = `${ANTIGRAVITY_API_URL}/api/queue/image/${jobId}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Image not found' });
      }
      throw new Error(`Antigravity API error: ${response.statusText}`);
    }

    // Get image buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Get content type from antigravity response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set headers and send image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
