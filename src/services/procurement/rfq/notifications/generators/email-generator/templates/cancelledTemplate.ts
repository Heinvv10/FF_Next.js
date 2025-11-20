/**
 * Cancelled Email Template
 * Generates HTML and text content for RFQ cancellation notifications
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';

export class CancelledTemplate {
  static generate(rfq: RFQ, additionalData?: any): EmailContent {
    return {
      subject: `RFQ Cancelled: ${rfq.title}`,
      content: this.generateHTML(rfq, additionalData),
      textContent: this.generateText(rfq, additionalData)
    };
  }

  private static generateHTML(rfq: RFQ, additionalData?: any): string {
    const reason = additionalData?.reason || 'No reason provided';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">RFQ Cancelled</h2>

        <p>We regret to inform you that RFQ "${rfq.title}" has been cancelled.</p>

        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0;">Cancellation Reason:</h3>
          <p style="margin: 0;">${reason}</p>
        </div>

        <p>Thank you for your interest in this project. We apologize for any inconvenience caused.</p>

        <p style="color: #6b7280; font-size: 14px;">
          We will contact you about future opportunities that may be suitable for your organization.
        </p>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, additionalData?: any): string {
    const reason = additionalData?.reason || 'No reason provided';

    return `
RFQ Cancelled: ${rfq.title}

We regret to inform you that this RFQ has been cancelled.

Cancellation Reason: ${reason}

Thank you for your interest in this project. We apologize for any inconvenience caused.

We will contact you about future opportunities that may be suitable for your organization.
    `.trim();
  }
}
