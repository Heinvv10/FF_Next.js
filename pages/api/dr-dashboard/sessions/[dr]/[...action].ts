/**
 * DR Session Details and Actions API
 * Handles photos and evaluation for a specific DR
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Mock photos for testing
const MOCK_PHOTOS = [
    { step_number: 1, filename: 'step_1_property.jpg', timestamp: '2024-12-16T10:00:00Z' },
    { step_number: 2, filename: 'step_2_cable.jpg', timestamp: '2024-12-16T10:05:00Z' },
    { step_number: 3, filename: 'step_3_entry_outside.jpg', timestamp: '2024-12-16T10:10:00Z' },
    { step_number: 4, filename: 'step_4_entry_inside.jpg', timestamp: '2024-12-16T10:15:00Z' },
    { step_number: 5, filename: 'step_5_wall.jpg', timestamp: '2024-12-16T10:20:00Z' },
    { step_number: 6, filename: 'step_6_ont_back.jpg', timestamp: '2024-12-16T10:25:00Z' },
    { step_number: 7, filename: 'step_7_power_meter.jpg', timestamp: '2024-12-16T10:30:00Z' },
    { step_number: 8, filename: 'step_8_ont_barcode.jpg', timestamp: '2024-12-16T10:35:00Z' },
    { step_number: 9, filename: 'step_9_ups_serial.jpg', timestamp: '2024-12-16T10:40:00Z' },
    { step_number: 10, filename: 'step_10_final.jpg', timestamp: '2024-12-16T10:45:00Z' },
    { step_number: 11, filename: 'step_11_green_lights.jpg', timestamp: '2024-12-16T10:50:00Z' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { dr, action } = req.query;
    const drNumber = Array.isArray(dr) ? dr[0] : dr;
    const actionPath = Array.isArray(action) ? action.join('/') : action;

    if (!drNumber) {
        return res.status(400).json({ error: 'DR number required' });
    }

    // Handle different actions
    switch (actionPath) {
        case 'photos':
            return handlePhotos(req, res, drNumber);
        case 'evaluate':
            return handleEvaluate(req, res, drNumber);
        default:
            return handleDetails(req, res, drNumber);
    }
}

// Get photos for a DR
function handlePhotos(req: NextApiRequest, res: NextApiResponse, drNumber: string) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return mock photos (in real implementation, fetch from storage)
    return res.status(200).json({
        dr_number: drNumber,
        photos: MOCK_PHOTOS,
    });
}

// Evaluate all photos for a DR
async function handleEvaluate(req: NextApiRequest, res: NextApiResponse, drNumber: string) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Generate mock evaluation results
    // In real implementation, this would call the VLM for each photo
    const evaluations = MOCK_PHOTOS.map((photo) => ({
        step_number: photo.step_number,
        accepted: Math.random() > 0.2, // 80% pass rate for demo
        confidence: 0.75 + Math.random() * 0.2,
        details: `Step ${photo.step_number} evaluation completed`,
        fibertime_compliance: {
            compliant: Math.random() > 0.3,
        },
    }));

    const passedSteps = evaluations.filter((e) => e.accepted).length;
    const overallPass = passedSteps >= 9; // Need 9/11 to pass

    return res.status(200).json({
        dr_number: drNumber,
        status: 'completed',
        overall_score: (passedSteps / 11) * 100,
        overall_pass: overallPass,
        evaluations,
        summary: overallPass
            ? `DR ${drNumber}: PASSED with ${passedSteps}/11 steps approved`
            : `DR ${drNumber}: FAILED - Only ${passedSteps}/11 steps approved`,
        evaluated_at: new Date().toISOString(),
    });
}

// Get DR details
function handleDetails(req: NextApiRequest, res: NextApiResponse, drNumber: string) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(200).json({
        dr_number: drNumber,
        project: 'VPS',
        status: 'in_progress',
        current_step: 11,
        steps: MOCK_PHOTOS,
    });
}
