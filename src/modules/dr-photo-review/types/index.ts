/**
 * DR Photo Review Module Types
 * TypeScript definitions for the DR Photo Review system
 * connecting to backend API at localhost:8082
 */

/**
 * The 11 verification steps for fiber installations
 */
export const DR_PHOTO_STEPS = [
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
] as const;

export type PhotoStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * DR Session from /api/v1/dr-dashboard/sessions
 */
export interface DRSession {
    dr_number: string;
    project: string;
    status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
    current_step: number;
    steps_completed: number;
    needs_review: boolean;
    photo_count?: number;
}

/**
 * Photo step info with filename
 */
export interface DRStepPhoto {
    step_number: PhotoStepNumber;
    step_name: string;
    step_label: string;
    filename: string;
    url: string;
    critical: boolean;
    timestamp?: string;
    evaluation?: PhotoEvaluation;
}

/**
 * DR Details with steps and photos
 */
export interface DRDetails {
    dr_number: string;
    project: string;
    status: string;
    current_step: number;
    steps: DRStepPhoto[];
}

/**
 * Photo evaluation result from AI
 */
export interface PhotoEvaluation {
    status: 'completed' | 'pending' | 'failed';
    score: number;
    pass: boolean;
    findings: string[];
    step_number: number;
    evaluated_at?: string;
}

/**
 * Full DR evaluation result
 */
export interface DREvaluationResult {
    dr_number: string;
    status: 'completed' | 'pending' | 'failed';
    overall_score: number;
    overall_pass: boolean;
    evaluations: PhotoEvaluation[];
    summary?: string;
    evaluated_at?: string;
}

/**
 * VLM (AI) service status
 */
export interface VLMStatus {
    online: boolean;
    model: string;
    last_check?: string;
    error?: string;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Component Props
 */
export interface DRSessionListProps {
    sessions: DRSession[];
    selectedDR: string | null;
    onSelect: (drNumber: string) => void;
    isLoading: boolean;
    error: string | null;
}

export interface DRPhotoGalleryProps {
    steps: DRStepPhoto[];
    drNumber: string;
    isLoading: boolean;
}

export interface DREvaluationPanelProps {
    drNumber: string;
    evaluation: DREvaluationResult | null;
    isEvaluating: boolean;
    onEvaluate: () => void;
    error?: string;
}

export interface VLMStatusIndicatorProps {
    status: VLMStatus | null;
}
