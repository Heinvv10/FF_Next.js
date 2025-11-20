/**
 * RFQ Issued Email Template
 * Generates HTML and text content for new RFQ notifications
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent } from '../../types';
import { BaseRFQGenerator } from '../../baseGenerator';

export class RFQIssuedTemplate extends BaseRFQGenerator {
  static generate(rfq: RFQ, additionalData?: any): EmailContent {
    const rfqUrl = `${this.getBaseUrl()}${this.generateRFQLink(rfq.id)}`;
    const responseUrl = `${this.getBaseUrl()}${this.generateSupplierRFQLink(rfq.id, '/respond')}`;

    return {
      subject: `New RFQ: ${rfq.title}`,
      content: this.generateHTML(rfq, rfqUrl, responseUrl, additionalData),
      textContent: this.generateText(rfq, rfqUrl, additionalData)
    };
  }

  private static generateHTML(rfq: RFQ, rfqUrl: string, responseUrl: string, _additionalData?: any): string {
    const deadline = rfq.responseDeadline;
    const deadlineText = deadline ? this.formatDeadline(deadline) : 'Not specified';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New RFQ: ${rfq.title}</h2>

        <p>You have been invited to respond to a new Request for Quotation.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>RFQ Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Title:</strong> ${rfq.title}</li>
            <li><strong>Project ID:</strong> ${rfq.projectId}</li>
            <li><strong>Response Deadline:</strong> ${deadlineText}</li>
            ${rfq.description ? `<li><strong>Description:</strong> ${rfq.description}</li>` : ''}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${responseUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Submit Response
          </a>
          <br><br>
          <a href="${rfqUrl}" style="color: #6b7280; text-decoration: none;">
            View RFQ Details
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Please respond by ${deadlineText} to be considered for this project.
        </p>
      </div>
    `;
  }

  private static generateText(rfq: RFQ, rfqUrl: string, _additionalData?: any): string {
    const deadline = rfq.responseDeadline;
    const deadlineText = deadline ? this.formatDeadline(deadline) : 'Not specified';

    return `
New RFQ: ${rfq.title}

You have been invited to respond to a new Request for Quotation.

RFQ Details:
- Title: ${rfq.title}
- Project ID: ${rfq.projectId}
- Response Deadline: ${deadlineText}
${rfq.description ? `- Description: ${rfq.description}` : ''}

View RFQ Details: ${rfqUrl}

Please respond by ${deadlineText} to be considered for this project.
    `.trim();
  }
}
