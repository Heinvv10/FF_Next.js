/**
 * DR Evaluation Hook
 * Manages AI evaluation state and operations
 */

import { useState, useCallback } from 'react';
import type { DRStepPhoto, DREvaluationResult, VLMStatus } from '../types';
import * as api from '../services/drPhotoReviewService';

export interface UseDREvaluationReturn {
    photos: DRStepPhoto[];
    evaluation: DREvaluationResult | null;
    vlmStatus: VLMStatus | null;
    isLoadingPhotos: boolean;
    isEvaluating: boolean;
    error: string | null;
    fetchPhotos: (drNumber: string) => Promise<void>;
    evaluateAll: (drNumber: string) => Promise<void>;
    checkVLMStatus: () => Promise<void>;
    clear: () => void;
}

export function useDREvaluation(): UseDREvaluationReturn {
    const [photos, setPhotos] = useState<DRStepPhoto[]>([]);
    const [evaluation, setEvaluation] = useState<DREvaluationResult | null>(null);
    const [vlmStatus, setVlmStatus] = useState<VLMStatus | null>(null);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPhotos = useCallback(async (drNumber: string) => {
        setIsLoadingPhotos(true);
        setError(null);

        try {
            const data = await api.fetchDRPhotos(drNumber);
            setPhotos(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch photos';
            setError(message);
            setPhotos([]);
        } finally {
            setIsLoadingPhotos(false);
        }
    }, []);

    const evaluateAll = useCallback(async (drNumber: string) => {
        setIsEvaluating(true);
        setError(null);

        try {
            const result = await api.evaluateAllPhotos(drNumber);
            setEvaluation(result);

            // Update photos with evaluation results
            if (result.evaluations) {
                setPhotos((prev) =>
                    prev.map((photo) => {
                        const evalResult = result.evaluations.find(
                            (e) => e.step_number === photo.step_number
                        );
                        return evalResult ? { ...photo, evaluation: evalResult } : photo;
                    })
                );
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Evaluation failed';
            setError(message);
        } finally {
            setIsEvaluating(false);
        }
    }, []);

    const checkVLMStatus = useCallback(async () => {
        try {
            const status = await api.getVLMStatus();
            setVlmStatus(status);
        } catch (err) {
            setVlmStatus({ online: false, model: 'dr-verifier', error: 'Check failed' });
        }
    }, []);

    const clear = useCallback(() => {
        setPhotos([]);
        setEvaluation(null);
        setError(null);
    }, []);

    return {
        photos,
        evaluation,
        vlmStatus,
        isLoadingPhotos,
        isEvaluating,
        error,
        fetchPhotos,
        evaluateAll,
        checkVLMStatus,
        clear,
    };
}
