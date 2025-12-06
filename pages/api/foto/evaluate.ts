/**
 * POST /api/foto/evaluate
 * Trigger AI evaluation for a DR
 * Calls Python backend script via child_process
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { EvaluationResult } from '@/modules/foto-review/types';

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
    // const result = await evaluateDRWithPython(dr_number);
    //
    // For now, return mock evaluation data

    const mockEvaluation: EvaluationResult = {
      dr_number,
      overall_status: 'PASS',
      average_score: 8.5,
      total_steps: 12,
      passed_steps: 10,
      step_results: [
        {
          step_number: 1,
          step_name: 'house_photo',
          step_label: 'House Photo',
          passed: true,
          score: 9.0,
          comment: 'House is clearly visible from the street. Good photo quality.',
        },
        {
          step_number: 2,
          step_name: 'cable_span',
          step_label: 'Cable Span from Pole',
          passed: true,
          score: 8.5,
          comment: 'Full cable span visible. Installation looks professional.',
        },
        {
          step_number: 3,
          step_name: 'ont_barcode',
          step_label: 'ONT Barcode',
          passed: false,
          score: 5.0,
          comment: 'Barcode is partially obscured. Please retake with better lighting.',
        },
        {
          step_number: 4,
          step_name: 'final_installation',
          step_label: 'Final Installation',
          passed: true,
          score: 9.5,
          comment: 'Installation is neat and professional. Cable management is excellent.',
        },
      ],
      feedback_sent: false,
      evaluation_date: new Date(),
    };

    // TODO: Save to database
    // await saveEvaluationToDB(mockEvaluation);

    return res.status(200).json({
      success: true,
      data: mockEvaluation,
    });
  } catch (error) {
    console.error('Error evaluating DR:', error);
    return res.status(500).json({
      error: 'Failed to evaluate DR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
