/**
 * Version API Endpoint
 * Returns current build version for cache busting
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get version from environment or use timestamp
  const version = process.env.NEXT_PUBLIC_BUILD_VERSION || Date.now().toString();

  // Never cache this endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.status(200).json({
    version,
    timestamp: new Date().toISOString(),
  });
}
