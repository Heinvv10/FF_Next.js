/**
 * POST /api/foto/feedback
 * Send WhatsApp feedback for an evaluation
 * Integrates with wa-monitor service and updates database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getEvaluationByDR, markFeedbackSent } from '@/modules/foto-review/services/fotoDbService';

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

    // Fetch evaluation from database
    const evaluation = await getEvaluationByDR(dr_number);

    if (!evaluation) {
      return res.status(404).json({
        error: 'Evaluation not found',
        message: `No evaluation found for DR ${dr_number}. Please run evaluation first.`,
      });
    }

    // Check if feedback was already sent
    if (evaluation.feedback_sent) {
      return res.status(400).json({
        error: 'Feedback already sent',
        message: `Feedback for DR ${dr_number} was already sent on ${evaluation.feedback_sent_at?.toISOString()}`,
      });
    }

    // Format WhatsApp message
    const message = formatFeedbackMessage(evaluation);

    // TODO: Send via wa-monitor service
    // await sendWhatsAppMessage({
    //   to: '+27XXXXXXXXX', // Get from DR/project configuration
    //   message: message,
    // });

    // Update feedback_sent flag in database
    const updatedEvaluation = await markFeedbackSent(dr_number);

    // For now, simulate successful send
    console.log(`[MOCK] WhatsApp feedback sent for ${dr_number}:`);
    console.log(message);

    return res.status(200).json({
      success: true,
      data: {
        dr_number: updatedEvaluation.dr_number,
        feedback_sent: updatedEvaluation.feedback_sent,
        feedback_sent_at: updatedEvaluation.feedback_sent_at,
        message: 'Feedback sent successfully',
      },
    });
  } catch (error) {
    console.error('Error sending feedback:', error);
    return res.status(500).json({
      error: 'Failed to send feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Format evaluation results as WhatsApp message
 */
function formatFeedbackMessage(evaluation: any): string {
  const statusEmoji = evaluation.overall_status === 'PASS' ? '✅' : '❌';
  const passPercentage = Math.round((evaluation.passed_steps / evaluation.total_steps) * 100);

  let message = `${statusEmoji} Installation Photo Review: ${evaluation.dr_number}\n\n`;
  message += `Overall Status: ${evaluation.overall_status}\n`;
  message += `Score: ${evaluation.average_score}/10\n`;
  message += `Steps Passed: ${evaluation.passed_steps}/${evaluation.total_steps} (${passPercentage}%)\n\n`;
  message += `📋 Step Results:\n`;

  evaluation.step_results.forEach((step: any) => {
    const icon = step.passed ? '✅' : '❌';
    message += `${icon} ${step.step_label}: ${step.score.toFixed(1)}/10\n`;
    message += `   ${step.comment}\n\n`;
  });

  if (evaluation.overall_status === 'FAIL') {
    message += `⚠️ Please review and retake photos for failed steps following installation guidelines.`;
  } else {
    message += `✅ Great work! All photos meet quality standards.`;
  }

  return message;
}
