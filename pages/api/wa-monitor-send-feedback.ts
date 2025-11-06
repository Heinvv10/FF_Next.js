/**
 * WA Monitor Send Feedback API
 * Sends QA feedback to WhatsApp groups via WhatsApp Bridge
 * Updates feedback_sent timestamp in database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// WhatsApp Bridge configuration
const WHATSAPP_BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:8080/api';

// Project WhatsApp group mappings
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
  }
};

interface SendFeedbackRequest {
  dropId: string;
  dropNumber: string;
  message: string;
  project?: string;
}

interface WhatsAppApiResponse {
  success: boolean;
  message?: string;
}

/**
 * Send message to WhatsApp group via Bridge API
 */
async function sendWhatsAppMessage(recipient: string, message: string): Promise<{ success: boolean; message: string }> {
  try {
    // Add FF App header to make it clear the message is from the app
    const formattedMessage = `🤖 *[FF App - QA Feedback]*\n\n${message}`;

    const response = await fetch(`${WHATSAPP_BRIDGE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient,
        message: formattedMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `WhatsApp API error: HTTP ${response.status} - ${errorText}`
      };
    }

    const result: WhatsAppApiResponse = await response.json();
    return {
      success: result.success || false,
      message: result.message || 'Message sent successfully'
    };
  } catch (error) {
    console.error('WhatsApp Bridge communication error:', error);
    return {
      success: false,
      message: `Failed to communicate with WhatsApp Bridge: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Update feedback_sent timestamp in database
 */
async function updateFeedbackSentTimestamp(dropId: string): Promise<void> {
  await sql`
    UPDATE qa_photo_reviews
    SET
      feedback_sent = NOW(),
      updated_at = NOW()
    WHERE id = ${dropId}
  `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    });
  }

  try {
    const { dropId, dropNumber, message, project }: SendFeedbackRequest = req.body;

    // Validation
    if (!dropId || !dropNumber || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: dropId, dropNumber, message' }
      });
    }

    // Determine WhatsApp group (default to Velo Test for testing)
    const targetProject = project || 'Velo Test';
    const groupConfig = PROJECT_GROUPS[targetProject] || PROJECT_GROUPS['Velo Test'];

    console.log(`📤 Sending feedback for ${dropNumber} to ${groupConfig.name} (${groupConfig.jid})`);

    // Send to WhatsApp
    const whatsappResult = await sendWhatsAppMessage(groupConfig.jid, message);

    if (!whatsappResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to send WhatsApp message',
          details: whatsappResult.message
        }
      });
    }

    // Update database with feedback_sent timestamp
    await updateFeedbackSentTimestamp(dropId);

    console.log(`✅ Feedback sent successfully for ${dropNumber}`);

    return res.status(200).json({
      success: true,
      data: {
        dropNumber,
        project: targetProject,
        group: groupConfig.name,
        sentAt: new Date().toISOString()
      },
      message: `Feedback sent to ${groupConfig.name}`
    });

  } catch (error) {
    console.error('Error sending feedback:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
