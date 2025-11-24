/**
 * Plain Text Email Templates for RFQ Notifications
 */

import { RFQ } from '@/types/procurement.types';
import { BaseRFQGenerator } from '../../baseGenerator';

export class TextTemplates extends BaseRFQGenerator {
  static rfqIssued(rfq: RFQ, rfqUrl: string): string {
    const deadlineText = rfq.responseDeadline
      ? this.formatDeadline(rfq.responseDeadline)
      : 'Not specified';

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

  static deadlineExtended(rfq: RFQ, newDeadline: Date, rfqUrl: string): string {
    const deadlineText = this.formatDeadline(newDeadline);

    return `
RFQ Deadline Extended: ${rfq.title}

The response deadline for this RFQ has been extended.

New Deadline: ${deadlineText}

You now have additional time to prepare and submit your response.

View RFQ: ${rfqUrl}
    `.trim();
  }

  static cancelled(rfq: RFQ, reason: string): string {
    return `
RFQ Cancelled: ${rfq.title}

We regret to inform you that this RFQ has been cancelled.

Cancellation Reason: ${reason}

Thank you for your interest in this project. We apologize for any inconvenience caused.

We will contact you about future opportunities that may be suitable for your organization.
    `.trim();
  }

  static awardedWinner(rfq: RFQ): string {
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

  static awardedOther(rfq: RFQ, winnerName: string): string {
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

  static reminder(rfq: RFQ, hoursRemaining: number, responseUrl: string): string {
    return `
RFQ Response Reminder: ${rfq.title}

This is a reminder that your response to this RFQ is due soon.

Time Remaining: ${hoursRemaining} hours

Don't miss this opportunity! Submit your response now to be considered for this project.

Submit Response: ${responseUrl}

Late responses may not be considered. Please ensure your submission is complete and submitted on time.
    `.trim();
  }

  static responseConfirmation(rfq: RFQ, responseId: string): string {
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
