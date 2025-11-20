/**
 * RFQ Email Generator - Main Export
 * Delegates email generation to specific template modules
 */

import { RFQ } from '@/types/procurement.types';
import { EmailContent, EmailEvent } from '../types';
import { BaseRFQGenerator } from '../baseGenerator';
import {
  RFQIssuedTemplate,
  DeadlineExtendedTemplate,
  CancelledTemplate,
  AwardedTemplate,
  ReminderTemplate,
  ResponseConfirmationTemplate,
} from './templates';

export class RFQEmailGenerator extends BaseRFQGenerator {
  /**
   * Generate email content for RFQ events
   * Routes to appropriate template generator based on event type
   */
  static generateEmailContent(
    event: EmailEvent,
    rfq: RFQ,
    additionalData?: any
  ): EmailContent {
    switch (event) {
      case 'rfq_issued':
        return RFQIssuedTemplate.generate(rfq, additionalData);

      case 'deadline_extended':
        return DeadlineExtendedTemplate.generate(rfq, additionalData);

      case 'cancelled':
        return CancelledTemplate.generate(rfq, additionalData);

      case 'awarded':
        return AwardedTemplate.generate(rfq, additionalData);

      case 'reminder_deadline':
        return ReminderTemplate.generate(rfq, additionalData);

      case 'response_confirmation':
        return ResponseConfirmationTemplate.generate(rfq, additionalData);

      default:
        return {
          subject: `RFQ Update: ${rfq.title}`,
          content: `<p>There has been an update to RFQ: ${rfq.title}</p>`,
          textContent: `There has been an update to RFQ: ${rfq.title}`
        };
    }
  }
}
