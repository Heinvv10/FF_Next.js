/**
 * POST /api/foto/evaluate
 * Trigger AI evaluation for a DR
 * Calls Python backend script via child_process and saves to database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { EvaluationResult } from '@/modules/foto-review/types';
import { saveEvaluation } from '@/modules/foto-review/services/fotoDbService';
import {
  executePythonEvaluation,
  PythonEvaluationError,
} from '@/modules/foto-review/services/fotoPythonService';
import { validateDrNumber } from '@/modules/foto-review/utils/drValidator';

// Feature flag: Use Python backend or mock data
const USE_PYTHON_BACKEND = process.env.USE_PYTHON_BACKEND === 'true';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dr_number } = req.body;

    console.log('[evaluate API] Received request for DR:', dr_number);

    // Validate DR number format and check for SQL injection
    const validation = validateDrNumber(dr_number);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid DR number',
        message: validation.error,
      });
    }

    // Use sanitized DR number
    const sanitizedDr = validation.sanitized!;

    let evaluation: EvaluationResult;

    if (USE_PYTHON_BACKEND) {
      console.log('[evaluate API] Using Python backend for evaluation');
      try {
        evaluation = await executePythonEvaluation(sanitizedDr);
        console.log('[evaluate API] Python evaluation successful');
      } catch (error) {
        if (error instanceof PythonEvaluationError) {
          console.error('[evaluate API] Python evaluation error:', {
            message: error.message,
            code: error.code,
            stderr: error.stderr,
          });

          return res.status(500).json({
            error: 'Python evaluation failed',
            message: error.message,
            code: error.code,
            details: error.stderr,
          });
        }
        throw error;
      }
    } else {
      console.log('[evaluate API] Using mock evaluation data (Python backend disabled)');
      evaluation = generateMockEvaluation(sanitizedDr);
    }

    // Save to database
    console.log('[evaluate API] Saving evaluation for DR:', sanitizedDr);
    const savedEvaluation = await saveEvaluation(evaluation);
    console.log('[evaluate API] Saved successfully:', savedEvaluation.dr_number);

    return res.status(200).json({
      success: true,
      data: savedEvaluation,
      message: USE_PYTHON_BACKEND
        ? 'AI evaluation completed and saved successfully'
        : 'Mock evaluation completed and saved successfully (Python backend disabled)',
    });
  } catch (error) {
    console.error('Error evaluating DR:', error);
    return res.status(500).json({
      error: 'Failed to evaluate DR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Generate mock evaluation data for testing
 */
function generateMockEvaluation(dr_number: string): EvaluationResult {
  const totalSteps = 12;
  const passRate = 0.7 + Math.random() * 0.25; // 70-95% pass rate
  const passedSteps = Math.floor(totalSteps * passRate);
  const averageScore = passRate * 10;

  const stepLabels = [
    'House Photo',
    'Cable Span from Pole',
    'Cable Entry Outside',
    'Cable Entry Inside',
    'Wall for Installation',
    'ONT Back After Install',
    'Power Meter Reading',
    'ONT Barcode',
    'UPS Serial Number',
    'Final Installation',
    'Green Lights on ONT',
    'Customer Signature',
  ];

  return {
    dr_number,
    overall_status: passedSteps >= totalSteps * 0.75 ? 'PASS' : 'FAIL',
    average_score: parseFloat(averageScore.toFixed(1)),
    total_steps: totalSteps,
    passed_steps: passedSteps,
    step_results: stepLabels.map((label, index) => ({
      step_number: index + 1,
      step_name: label.toLowerCase().replace(/\s+/g, '_'),
      step_label: label,
      passed: index < passedSteps,
      score: index < passedSteps
        ? 7 + Math.random() * 3 // 7-10 for passed
        : 3 + Math.random() * 4, // 3-7 for failed
      comment: index < passedSteps
        ? `${label} is clearly visible and meets quality standards.`
        : `${label} needs improvement. Please retake photo with better quality.`,
    })),
    feedback_sent: false,
    evaluation_date: new Date(),
    markdown_report: undefined,
  };
}
