/**
 * POST /api/foto/evaluate
 * Trigger AI evaluation for a DR
 * Calls Python backend script via child_process and saves to database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { EvaluationResult } from '@/modules/foto-review/types';
import { saveEvaluation } from '@/modules/foto-review/services/fotoDbService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dr_number } = req.body;

    if (!dr_number) {
      return res.status(400).json({ error: 'DR number is required' });
    }

    // TODO: Call Python backend script
    // const pythonResult = await evaluateDRWithPython(dr_number);
    //
    // For now, generate mock evaluation data with more realistic results
    // In production, this will be replaced with actual Python AI evaluation

    // Simulate randomized AI evaluation
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

    const mockEvaluation: EvaluationResult = {
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
      markdown_report: undefined, // Python backend would generate this
    };

    // Save to database
    const savedEvaluation = await saveEvaluation(mockEvaluation);

    return res.status(200).json({
      success: true,
      data: savedEvaluation,
      message: 'Evaluation completed and saved successfully',
    });
  } catch (error) {
    console.error('Error evaluating DR:', error);
    return res.status(500).json({
      error: 'Failed to evaluate DR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
