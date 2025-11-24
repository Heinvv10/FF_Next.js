/**
 * Email Subject Line Generators
 */

import { RFQ } from '@/types/procurement.types';
import { EmailEvent } from '../../types';

export function generateSubject(event: EmailEvent, rfq: RFQ, hoursRemaining?: number): string {
  switch (event) {
    case 'rfq_issued':
      return `New RFQ: ${rfq.title}`;

    case 'deadline_extended':
      return `RFQ Deadline Extended: ${rfq.title}`;

    case 'cancelled':
      return `RFQ Cancelled: ${rfq.title}`;

    case 'awarded':
      return `RFQ Award Decision: ${rfq.title}`;

    case 'reminder_deadline':
      return `RFQ Response Reminder: ${rfq.title} - ${hoursRemaining} hours remaining`;

    case 'response_confirmation':
      return `Response Received: ${rfq.title}`;

    default:
      return `RFQ Update: ${rfq.title}`;
  }
}
