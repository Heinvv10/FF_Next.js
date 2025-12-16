/**
 * Mock Sessions API for DR Dashboard Testing
 * Returns demo DR session data for UI testing
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Mock DR sessions for testing
const MOCK_SESSIONS = [
    {
        dr_number: 'DR001234',
        project: 'VPS',
        status: 'completed',
        current_step: 11,
        steps_completed: 11,
        needs_review: false,
        photo_count: 11,
    },
    {
        dr_number: 'DR001235',
        project: 'VPS',
        status: 'in_progress',
        current_step: 7,
        steps_completed: 6,
        needs_review: true,
        photo_count: 7,
    },
    {
        dr_number: 'DR001236',
        project: 'VPS',
        status: 'needs_review',
        current_step: 11,
        steps_completed: 11,
        needs_review: true,
        photo_count: 11,
    },
    {
        dr_number: 'DR001237',
        project: 'VPS',
        status: 'pending',
        current_step: 1,
        steps_completed: 0,
        needs_review: false,
        photo_count: 1,
    },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return mock sessions
    res.status(200).json(MOCK_SESSIONS);
}
