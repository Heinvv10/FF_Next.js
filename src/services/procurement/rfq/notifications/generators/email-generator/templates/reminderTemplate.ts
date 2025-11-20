/**
 * Reminder Email Template
 * Generates HTML and text content for RFQ deadline reminder notifications
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';
import { BaseRFQGenerator } from '../../baseGenerator';

export class ReminderTemplate extends BaseRFQGenerator {
  static generate(rfq: RFQ, _additionalData?: any): EmailContent {
    const hoursRemaining = this.getHoursRemaining(rfq);
    const responseUrl = `${this.getBaseUrl()}${this.generateSupplierRFQLink(rfq.id, '/respond')}`;

    return {
      subject: `RFQ Response Reminder: ${rfq.title} - ${hoursRemaining} hours remaining`,
      content: this.generateHTML(rfq, hoursRemaining, responseUrl),
      textContent: this.generateText(rfq, hoursRemaining, responseUrl)
    };
  }

  private static generateHTML(rfq: RFQ, hoursRemaining: number, responseUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">RFQ Response Reminder</h2>

        <p>This is a reminder that your response to RFQ "${rfq.title}" is due soon.</p>

        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0;">Time Remaining:</h3>
          <p style="font-size: 24px; margin: 0; color: #dc2626;">
            <strong>${hoursRemaining} hours</strong>
          </p>
        </div>

        <p>Don't miss this opportunity! Submit your response now to be considered for this project.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${responseUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Submit Response Now
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Late responses may not be considered. Please ensure your submission is complete and submitted on time.
        </p>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, hoursRemaining: number, responseUrl: string): string {
    return `
RFQ Response Reminder: ${rfq.title}

This is a reminder that your response to this RFQ is due soon.

Time Remaining: ${hoursRemaining} hours

Don't miss this opportunity! Submit your response now to be considered for this project.

Submit Response: ${responseUrl}

Late responses may not be considered. Please ensure your submission is complete and submitted on time.
    `.trim();
  }
}
