// LiveKit Config API
// Returns client-safe configuration

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return the public LiveKit URL for client connection
    const serverUrl = process.env.LIVEKIT_URL || '';

    return res.status(200).json({
        serverUrl,
        configured: !!serverUrl,
    });
}
