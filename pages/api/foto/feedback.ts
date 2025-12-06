/**
 * POST /api/foto/feedback
 * Send WhatsApp feedback for an evaluation
 * Integrates with wa-monitor service and updates database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getEvaluationByDR, markFeedbackSent } from '@/modules/foto-review/services/fotoDbService';

// Project WhatsApp group mappings (same as wa-monitor)
const PROJECT_GROUPS: Record<string, { jid: string; name: string }> = {
  'Velo Test': {
    jid: '120363421664266245@g.us',
    name: 'Velo Test'
  },
  'Lawley': {
    jid: '120363418298130331@g.us',
    name: 'Lawley Activation 3'
  },
  'Mohadin': {
    jid: '120363421532174586@g.us',
    name: 'Mohadin Activations 🥳'
  },
  'Mamelodi': {
    jid: '120363408849234743@g.us',
    name: 'Mamelodi POP1 Activations'
  }
};

/**
 * Send message to WhatsApp group via Sender API
 * Uses the same service as wa-monitor on VPS localhost:8081
 */
async function sendWhatsAppFeedback(drNumber: string, message: string, project?: string): Promise<void> {
  // Get project group JID
  const projectKey = project || 'Velo Test'; // Default to Velo Test for testing
  const groupConfig = PROJECT_GROUPS[projectKey];

  if (!groupConfig) {
    throw new Error(`No WhatsApp group configured for project: ${projectKey}`);
  }

  // Send to group without @mention (general announcement)
  // Using localhost because this runs on the VPS where WhatsApp service is hosted
  const response = await fetch('http://localhost:8081/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_jid: groupConfig.jid,
      message: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to send WhatsApp message: ${result.message || 'Unknown error'}`);
  }
}

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

    // Send via WhatsApp (using wa-monitor service on VPS)
    // Feature flag: USE_WHATSAPP_FEEDBACK to enable/disable actual WhatsApp sending
    const USE_WHATSAPP = process.env.USE_WHATSAPP_FEEDBACK === 'true';

    if (USE_WHATSAPP) {
      try {
        console.log(`[WhatsApp] Sending feedback for ${dr_number}...`);
        await sendWhatsAppFeedback(dr_number, message, evaluation.project);
        console.log(`[WhatsApp] Feedback sent successfully`);
      } catch (error) {
        console.error(`[WhatsApp] Failed to send feedback:`, error);
        // Don't fail the request if WhatsApp fails - still update database
        // This allows the system to work even if WhatsApp service is down
      }
    } else {
      console.log(`[MOCK] WhatsApp feedback for ${dr_number}:`);
      console.log(message);
    }

    // Update feedback_sent flag in database
    const updatedEvaluation = await markFeedbackSent(dr_number);

    return res.status(200).json({
      success: true,
      data: {
        dr_number: updatedEvaluation.dr_number,
        feedback_sent: updatedEvaluation.feedback_sent,
        feedback_sent_at: updatedEvaluation.feedback_sent_at,
        message: USE_WHATSAPP
          ? 'Feedback sent to WhatsApp successfully'
          : 'Feedback logged successfully (WhatsApp disabled)',
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
