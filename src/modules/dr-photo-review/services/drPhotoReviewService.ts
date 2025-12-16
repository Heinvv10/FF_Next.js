/**
 * DR Photo Review Service
 * API client for backend at localhost:8082
 */

import type {
    DRSession,
    DRDetails,
    DRStepPhoto,
    PhotoEvaluation,
    DREvaluationResult,
    VLMStatus,
    DR_PHOTO_STEPS,
} from '../types';

// Use local API proxy to avoid CORS issues
const API_BASE = '/api/dr-dashboard';
const BACKEND_BASE = 'http://localhost:8082/api/v1/dr-dashboard';
const DEFAULT_PROJECT = 'VPS';

/**
 * Fetch all DR sessions with photos
 */
export async function fetchSessions(): Promise<DRSession[]> {
    const response = await fetch(`${API_BASE}/sessions`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch sessions' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch photos for a specific DR
 */
export async function fetchDRPhotos(drNumber: string, project = DEFAULT_PROJECT): Promise<DRStepPhoto[]> {
    const response = await fetch(
        `${API_BASE}/sessions/${encodeURIComponent(drNumber)}/photos?project=${project}`
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch photos' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Map photos to include full URLs and step info
    return (data.photos || data || []).map((photo: any, index: number) => {
        const stepNumber = photo.step_number || index + 1;
        const stepInfo = getStepInfo(stepNumber);

        return {
            step_number: stepNumber,
            step_name: stepInfo.name,
            step_label: stepInfo.label,
            filename: photo.filename,
            url: `${API_BASE}/photos/${encodeURIComponent(drNumber)}/${encodeURIComponent(photo.filename)}`,
            critical: stepInfo.critical,
            timestamp: photo.timestamp,
            evaluation: photo.evaluation,
        };
    });
}

/**
 * Get step info from step number
 */
function getStepInfo(stepNumber: number): { name: string; label: string; critical: boolean } {
    const steps = [
        { step: 1, name: 'property_photo', label: 'Property Photo', critical: false },
        { step: 2, name: 'cable_from_pole', label: 'Cable from Pole', critical: false },
        { step: 3, name: 'cable_entry_outside', label: 'Cable Entry Outside', critical: true },
        { step: 4, name: 'cable_entry_inside', label: 'Cable Entry Inside', critical: false },
        { step: 5, name: 'wall_for_installation', label: 'Wall for Installation', critical: false },
        { step: 6, name: 'ont_back_after_install', label: 'ONT Back After Install', critical: false },
        { step: 7, name: 'power_meter_reading', label: 'Power Meter Reading', critical: true },
        { step: 8, name: 'ont_barcode_serial', label: 'ONT Barcode/Serial', critical: true },
        { step: 9, name: 'ups_serial_number', label: 'UPS Serial Number', critical: true },
        { step: 10, name: 'final_installation', label: 'Final Installation', critical: true },
        { step: 11, name: 'green_lights', label: 'Green Lights', critical: true },
    ];

    const step = steps.find((s) => s.step === stepNumber);
    return step || { name: `step_${stepNumber}`, label: `Step ${stepNumber}`, critical: false };
}

/**
 * Evaluate a single photo with AI
 */
export async function evaluatePhoto(
    drNumber: string,
    filename: string,
    stepNumber: number
): Promise<PhotoEvaluation> {
    const response = await fetch(
        `${API_BASE}/photos/${encodeURIComponent(drNumber)}/${encodeURIComponent(filename)}/evaluate?step_number=${stepNumber}`,
        { method: 'POST' }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Evaluation failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Evaluate all photos for a DR
 */
export async function evaluateAllPhotos(drNumber: string): Promise<DREvaluationResult> {
    const response = await fetch(
        `${API_BASE}/sessions/${encodeURIComponent(drNumber)}/evaluate`,
        { method: 'POST' }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Evaluation failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Get VLM (AI) service status
 */
export async function getVLMStatus(): Promise<VLMStatus> {
    try {
        const response = await fetch(`${API_BASE}/vlm/status`);

        if (!response.ok) {
            return { online: false, model: 'dr-verifier', error: `HTTP ${response.status}` };
        }

        return response.json();
    } catch (error) {
        return {
            online: false,
            model: 'dr-verifier',
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}

/**
 * Get photo URL for display
 */
export function getPhotoUrl(drNumber: string, filename: string): string {
    return `${API_BASE}/photos/${encodeURIComponent(drNumber)}/${encodeURIComponent(filename)}`;
}
