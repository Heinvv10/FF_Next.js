/**
 * Awarded Email Template
 * Generates HTML and text content for RFQ award decision notifications
 * Handles both winner and non-winner variants
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';
import { BaseRFQGenerator } from '../../baseGenerator';

export class AwardedTemplate extends BaseRFQGenerator {
  static generate(rfq: RFQ, additionalData?: any): EmailContent {
    const rfqUrl = `${this.getBaseUrl()}${this.generateRFQLink(rfq.id)}`;

    return {
      subject: `RFQ Award Decision: ${rfq.title}`,
      content: this.generateHTML(rfq, rfqUrl, additionalData),
      textContent: this.generateText(rfq, additionalData)
    };
  }

  private static generateHTML(rfq: RFQ, rfqUrl: string, additionalData?: any): string {
    const isWinner = additionalData?.isWinner || false;

    return isWinner
      ? this.generateWinnerHTML(rfq, rfqUrl)
      : this.generateNonWinnerHTML(rfq, additionalData);
  }

  private static generateWinnerHTML(rfq: RFQ, rfqUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Congratulations! RFQ Awarded to You</h2>

        <p>We are pleased to inform you that your response to RFQ "${rfq.title}" has been selected.</p>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0;">Next Steps:</h3>
          <ul>
            <li>You will be contacted by our procurement team within 2 business days</li>
            <li>Please prepare any required documentation</li>
            <li>A purchase order will be issued shortly</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${rfqUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Award Details
          </a>
        </div>

        <p>Thank you for your participation and we look forward to working with you.</p>
      </div>
    `;
  }

  private static generateNonWinnerHTML(rfq: RFQ, additionalData?: any): string {
    const winnerName = additionalData?.winnerName || 'the selected supplier';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">RFQ Award Decision: ${rfq.title}</h2>

        <p>Thank you for your response to RFQ "${rfq.title}".</p>

        <p>After careful evaluation, we have decided to award this project to ${winnerName}.</p>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">
            We appreciate the time and effort you invested in preparing your response.
            Your proposal was thoroughly reviewed and considered.
          </p>
        </div>

        <p>We hope to work with you on future opportunities and will keep your organization in mind for similar projects.</p>

        <p style="color: #6b7280; font-size: 14px;">
          Thank you for your continued partnership and interest in our projects.
        </p>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, additionalData?: any): string {
    const isWinner = additionalData?.isWinner || false;

    return isWinner
      ? this.generateWinnerText(rfq)
      : this.generateNonWinnerText(rfq, additionalData);
  }

  private static generateWinnerText(rfq: RFQ): string {
    return `
Congratulations! RFQ Awarded to You

We are pleased to inform you that your response to RFQ "${rfq.title}" has been selected.

Next Steps:
- You will be contacted by our procurement team within 2 business days
- Please prepare any required documentation
- A purchase order will be issued shortly

Thank you for your participation and we look forward to working with you.
    `.trim();
  }

  private static generateNonWinnerText(rfq: RFQ, additionalData?: any): string {
    const winnerName = additionalData?.winnerName || 'the selected supplier';

    return `
RFQ Award Decision: ${rfq.title}

Thank you for your response to this RFQ.

After careful evaluation, we have decided to award this project to ${winnerName}.

We appreciate the time and effort you invested in preparing your response.
Your proposal was thoroughly reviewed and considered.

We hope to work with you on future opportunities and will keep your organization in mind for similar projects.

Thank you for your continued partnership and interest in our projects.
    `.trim();
  }
}
