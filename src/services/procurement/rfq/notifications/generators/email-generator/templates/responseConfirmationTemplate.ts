/**
 * Response Confirmation Email Template
 * Generates HTML and text content for RFQ response confirmation notifications
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';

export class ResponseConfirmationTemplate {
  static generate(rfq: RFQ, additionalData?: any): EmailContent {
    return {
      subject: `Response Received: ${rfq.title}`,
      content: this.generateHTML(rfq, additionalData),
      textContent: this.generateText(rfq, additionalData)
    };
  }

  private static generateHTML(rfq: RFQ, additionalData?: any): string {
    const responseId = additionalData?.responseId || 'N/A';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Response Received - Thank You!</h2>

        <p>Thank you for submitting your response to RFQ "${rfq.title}".</p>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0;">Submission Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>RFQ:</strong> ${rfq.title}</li>
            <li><strong>Response ID:</strong> ${responseId}</li>
            <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>

        <p>Your response is now being evaluated by our procurement team. We will contact you with our decision soon.</p>

        <p style="color: #6b7280; font-size: 14px;">
          If you need to make any changes to your response, please contact us immediately.
        </p>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, additionalData?: any): string {
    const responseId = additionalData?.responseId || 'N/A';

    return `
Response Received - Thank You!

Thank you for submitting your response to RFQ "${rfq.title}".

Submission Details:
- RFQ: ${rfq.title}
- Response ID: ${responseId}
- Submitted: ${new Date().toLocaleString()}

Your response is now being evaluated by our procurement team. We will contact you with our decision soon.

If you need to make any changes to your response, please contact us immediately.
    `.trim();
  }
}
