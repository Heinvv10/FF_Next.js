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
  },
  'Mamelodi': {
    jid: '120363408849234743@g.us',
    name: 'Mamelodi POP1 Activations'
  }
};

interface SendFeedbackRequest {
  dropId: string;
  dropNumber: string;
  message: string;
  project?: string;
}

interface QAReview {
  drop_number: string;
  submitted_by: string | null;
  project: string;
  step_01_house_photo: boolean;
  step_02_cable_from_pole: boolean;
  step_03_cable_entry_outside: boolean;
  step_04_cable_entry_inside: boolean;
  step_05_wall_for_installation: boolean;
  step_06_ont_back_after_install: boolean;
  step_07_power_meter_reading: boolean;
  step_08_ont_barcode: boolean;
  step_09_ups_serial: boolean;
  step_10_final_installation: boolean;
  step_11_green_lights: boolean;
  step_12_customer_signature: boolean;
}

interface WhatsAppApiResponse {
  success: boolean;
  message?: string;
}

/**
 * Send message to WhatsApp group via Sender API with optional @mention
 * Uses second phone number (+27 71 155 8396) for sending messages
 * If recipientJID is null/empty, sends as group message without @mention
 */
async function sendWhatsAppMessage(
  groupJID: string,
  recipientJID: string | null,
  message: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use Sender API (port 8081) - Second WhatsApp number
    // Sender API format with @mentions: { group_jid: "JID", recipient_jid: "JID", message: "text" }

    // Check if we have recipient info for @mention
    if (recipientJID && recipientJID.trim() !== '' && recipientJID !== 'Unknown') {
      // Ensure recipient_jid is in WhatsApp JID format (phone@s.whatsapp.net)
      const formattedRecipientJID = recipientJID.includes('@')
        ? recipientJID
        : `${recipientJID}@s.whatsapp.net`;

      // Send with @mention
      const requestBody = {
        group_jid: groupJID,
        recipient_jid: formattedRecipientJID,
        message: message,
      };

      const response = await fetch('http://localhost:8081/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `WhatsApp Sender API error: HTTP ${response.status} - ${errorText}`
        };
      }

      const result: WhatsAppApiResponse = await response.json();
      return {
        success: result.success || false,
        message: result.message || 'Message sent with @mention'
      };
    } else {
      // No recipient info - send as simple group message via bridge
      const requestBody = {
        recipient: groupJID,
        message: message,
      };

      const response = await fetch('http://localhost:8080/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `WhatsApp Bridge API error: HTTP ${response.status} - ${errorText}`
        };
      }

      const result: WhatsAppApiResponse = await response.json();
      return {
        success: result.success || false,
        message: result.message || 'Group message sent successfully'
      };
    }
  } catch (error) {
    console.error('WhatsApp API communication error:', error);
    return {
      success: false,
      message: `Failed to communicate with WhatsApp API: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Format QA checklist for WhatsApp message
 */
function formatQAChecklist(review: QAReview, customMessage: string): string {
  const checkmark = '[OK]';
  const cross = '[MISSING]';

  const steps = [
    { label: 'House photo', value: review.step_01_house_photo },
    { label: 'Cable from pole', value: review.step_02_cable_from_pole },
    { label: 'Cable entry (outside)', value: review.step_03_cable_entry_outside },
    { label: 'Cable entry (inside)', value: review.step_04_cable_entry_inside },
    { label: 'Wall for installation', value: review.step_05_wall_for_installation },
    { label: 'ONT back after install', value: review.step_06_ont_back_after_install },
    { label: 'Power meter reading', value: review.step_07_power_meter_reading },
    { label: 'ONT barcode', value: review.step_08_ont_barcode },
    { label: 'UPS serial', value: review.step_09_ups_serial },
    { label: 'Final installation', value: review.step_10_final_installation },
    { label: 'Green lights', value: review.step_11_green_lights },
    { label: 'Customer signature', value: review.step_12_customer_signature },
  ];

  const allPassed = steps.every(step => step.value);
  const statusText = allPassed ? 'APPROVED' : 'REJECTED';

  let message = `${review.drop_number} ${statusText}\n\n`;

  // Add checklist
  for (const step of steps) {
    const symbol = step.value ? checkmark : cross;
    message += `${symbol} ${step.label}\n`;
  }

  // Add custom message if provided
  if (customMessage && customMessage.trim()) {
    message += `\n${customMessage.trim()}`;
  }

  return message;
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
    const { dropId, message }: SendFeedbackRequest = req.body;

    // Validation
    if (!dropId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required field: dropId' }
      });
    }

    // 1. Get drop details from database
    const drops = await sql<QAReview[]>`
      SELECT
        drop_number,
        submitted_by,
        project,
        step_01_house_photo,
        step_02_cable_from_pole,
        step_03_cable_entry_outside,
        step_04_cable_entry_inside,
        step_05_wall_for_installation,
        step_06_ont_back_after_install,
        step_07_power_meter_reading,
        step_08_ont_barcode,
        step_09_ups_serial,
        step_10_final_installation,
        step_11_green_lights,
        step_12_customer_signature
      FROM qa_photo_reviews
      WHERE id = ${dropId}
      LIMIT 1
    `;

    if (drops.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Drop not found' }
      });
    }

    const drop = drops[0];

    // 2. Get group JID for project
    const groupConfig = PROJECT_GROUPS[drop.project];
    if (!groupConfig) {
      return res.status(400).json({
        success: false,
        error: { message: `Unknown project: ${drop.project}. Cannot determine WhatsApp group.` }
      });
    }

    console.log(`📤 Sending feedback for ${drop.drop_number} to ${groupConfig.name} (${groupConfig.jid})`);

    // Log mention status
    if (drop.submitted_by && drop.submitted_by.trim() !== '' && drop.submitted_by !== 'Unknown') {
      console.log(`   With @mention: ${drop.submitted_by}`);
    } else {
      console.log(`   Without @mention (no sender info - manually added drop)`);
    }

    // 3. Format feedback message with checklist
    const feedbackMessage = formatQAChecklist(drop, message || '');

    // 4. Send to WhatsApp (with or without mention depending on sender info)
    const whatsappResult = await sendWhatsAppMessage(
      groupConfig.jid,
      drop.submitted_by,
      feedbackMessage
    );

    if (!whatsappResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to send WhatsApp message',
          details: whatsappResult.message
        }
      });
    }

    // 6. Update database with feedback_sent timestamp
    await updateFeedbackSentTimestamp(dropId);

    console.log(`✅ Feedback sent successfully for ${drop.drop_number}`);

    return res.status(200).json({
      success: true,
      data: {
        dropNumber: drop.drop_number,
        project: drop.project,
        group: groupConfig.name,
        recipient: drop.submitted_by,
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
