/**
 * DR Evaluation Panel Component
 * Shows evaluation controls and results
 */

'use client';

import { Play, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { DREvaluationResult } from '../types';

interface DREvaluationPanelProps {
    drNumber: string;
    evaluation: DREvaluationResult | null;
    isEvaluating: boolean;
    onEvaluate: () => void;
    error?: string;
}

export function DREvaluationPanel({
    drNumber,
    evaluation,
    isEvaluating,
    onEvaluate,
    error,
}: DREvaluationPanelProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Evaluation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Powered by dr-verifier VLM model
                </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Evaluate Button */}
                <button
                    onClick={onEvaluate}
                    disabled={isEvaluating}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${isEvaluating
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isEvaluating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Evaluating...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5" />
                            Run AI Evaluation
                        </>
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Evaluation Results */}
                {evaluation && (
                    <div className="space-y-4">
                        {/* Overall Score */}
                        <div
                            className={`p-4 rounded-lg ${evaluation.overall_pass
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {evaluation.overall_pass ? (
                                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    )}
                                    <span
                                        className={`text-lg font-semibold ${evaluation.overall_pass
                                                ? 'text-green-700 dark:text-green-400'
                                                : 'text-red-700 dark:text-red-400'
                                            }`}
                                    >
                                        {evaluation.overall_pass ? 'PASSED' : 'FAILED'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {evaluation.overall_score.toFixed(1)}/10
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Overall Score</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        {evaluation.summary && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{evaluation.summary}</p>
                            </div>
                        )}

                        {/* Step Results */}
                        {evaluation.evaluations && evaluation.evaluations.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Step Results
                                </h4>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    {evaluation.evaluations.map((stepEval) => (
                                        <div
                                            key={stepEval.step_number}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-2">
                                                {stepEval.pass ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    Step {stepEval.step_number}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-sm font-medium ${stepEval.pass ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                            >
                                                {stepEval.score}/10
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timestamp */}
                        {evaluation.evaluated_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                Evaluated: {new Date(evaluation.evaluated_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
