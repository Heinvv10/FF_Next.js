/**
 * POST /api/foto/feedback
 * Send WhatsApp feedback for an evaluation
 * Integrates with wa-monitor service
 */

import type { NextApiRequest, NextApiResponse } from 'next';

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

    // TODO: Fetch evaluation from database
    // const evaluation = await getEvaluationFromDB(dr_number);

    // TODO: Format WhatsApp message
    // const message = formatFeedbackMessage(evaluation);

    // TODO: Send via wa-monitor service
    // await sendWhatsAppMessage(message);

    // TODO: Update feedback_sent flag in database
    // await updateFeedbackSent(dr_number);

    // For now, simulate successful send
    return res.status(200).json({
      success: true,
      data: {
        message: 'Feedback sent successfully',
        sent_at: new Date(),
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
