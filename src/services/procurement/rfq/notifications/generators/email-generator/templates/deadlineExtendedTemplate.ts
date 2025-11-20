/**
 * Deadline Extended Email Template
 * Generates HTML and text content for RFQ deadline extension notifications
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';
import { BaseRFQGenerator } from '../../baseGenerator';

export class DeadlineExtendedTemplate extends BaseRFQGenerator {
  static generate(rfq: RFQ, additionalData?: any): EmailContent {
    const newDeadline = additionalData?.newDeadline || rfq.responseDeadline;
    const rfqUrl = `${this.getBaseUrl()}${this.generateRFQLink(rfq.id)}`;

    return {
      subject: `RFQ Deadline Extended: ${rfq.title}`,
      content: this.generateHTML(rfq, newDeadline, rfqUrl, additionalData),
      textContent: this.generateText(rfq, newDeadline, rfqUrl, additionalData)
    };
  }

  private static generateHTML(rfq: RFQ, newDeadline: Date, rfqUrl: string, _additionalData?: any): string {
    const deadlineText = this.formatDeadline(newDeadline);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">RFQ Deadline Extended</h2>

        <p>The response deadline for RFQ "${rfq.title}" has been extended.</p>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0;">New Deadline:</h3>
          <p style="font-size: 18px; margin: 0; color: #059669;">
            <strong>${deadlineText}</strong>
          </p>
        </div>

        <p>You now have additional time to prepare and submit your response.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${rfqUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View RFQ
          </a>
        </div>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, newDeadline: Date, rfqUrl: string, _additionalData?: any): string {
    const deadlineText = this.formatDeadline(newDeadline);

    return `
RFQ Deadline Extended: ${rfq.title}

The response deadline for this RFQ has been extended.

New Deadline: ${deadlineText}

You now have additional time to prepare and submit your response.

View RFQ: ${rfqUrl}
    `.trim();
  }
}
