// src/modules/ticketing/integrations/email/emailParser.ts
// Parse incoming emails into ticket data

import type { EmailTicket, EmailAttachment, CreateTicketInput } from '../../types';

interface ParsedEmail {
  from: string;
  fromName: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  receivedAt: string;
  messageId?: string;
  attachments: EmailAttachment[];
}

interface EmailParseResult {
  ticket: CreateTicketInput;
  attachments: EmailAttachment[];
  metadata: {
    messageId?: string;
    fromEmail: string;
    fromName: string;
    receivedAt: string;
  };
}

/**
 * Parse an incoming email into ticket creation data
 */
export function parseEmailToTicket(email: ParsedEmail): EmailParseResult {
  // Extract DR number if present in subject or body
  const drNumber = extractDRNumber(email.subject + ' ' + email.body);

  // Extract priority from subject keywords
  const priority = extractPriority(email.subject);

  // Clean and extract ticket type from subject
  const ticketType = extractTicketType(email.subject);

  // Parse the email body for useful content
  const description = cleanEmailBody(email.body);

  // Extract client name from sender
  const clientName = email.fromName || extractNameFromEmail(email.from);

  const ticket: CreateTicketInput = {
    source: 'email',
    external_id: email.messageId,
    title: cleanSubject(email.subject),
    description,
    priority,
    type: ticketType,
    dr_number: drNumber || undefined,
    client_name: clientName,
    client_email: email.from,
    tags: extractTags(email.subject + ' ' + email.body),
  };

  return {
    ticket,
    attachments: email.attachments,
    metadata: {
      messageId: email.messageId,
      fromEmail: email.from,
      fromName: email.fromName,
      receivedAt: email.receivedAt,
    },
  };
}

/**
 * Extract DR number from text (format: DR1234567 or DR-1234567)
 */
function extractDRNumber(text: string): string | null {
  const drPattern = /\bDR[-]?(\d{5,10})\b/i;
  const match = text.match(drPattern);
  if (match) {
    return `DR${match[1]}`;
  }
  return null;
}

/**
 * Extract priority from email subject keywords
 */
function extractPriority(subject: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('urgent') || lowerSubject.includes('critical') || lowerSubject.includes('emergency')) {
    return 'critical';
  }
  if (lowerSubject.includes('high priority') || lowerSubject.includes('important')) {
    return 'high';
  }
  if (lowerSubject.includes('low priority') || lowerSubject.includes('minor')) {
    return 'low';
  }
  return 'medium';
}

/**
 * Extract ticket type from subject keywords
 */
function extractTicketType(subject: string): 'fault' | 'maintenance' | 'installation' | 'query' | 'complaint' | 'other' | undefined {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('fault') || lowerSubject.includes('broken') || lowerSubject.includes('not working')) {
    return 'fault';
  }
  if (lowerSubject.includes('maintenance') || lowerSubject.includes('service')) {
    return 'maintenance';
  }
  if (lowerSubject.includes('install') || lowerSubject.includes('new connection')) {
    return 'installation';
  }
  if (lowerSubject.includes('query') || lowerSubject.includes('question') || lowerSubject.includes('enquiry')) {
    return 'query';
  }
  if (lowerSubject.includes('complaint') || lowerSubject.includes('unhappy') || lowerSubject.includes('dissatisfied')) {
    return 'complaint';
  }
  return undefined;
}

/**
 * Clean email subject line
 */
function cleanSubject(subject: string): string {
  // Remove common prefixes
  let cleaned = subject
    .replace(/^(re|fw|fwd|fyi):\s*/gi, '')
    .replace(/^\[.*?\]\s*/g, '')
    .trim();

  // Limit length
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 197) + '...';
  }

  return cleaned || 'Email Ticket';
}

/**
 * Clean email body content
 */
function cleanEmailBody(body: string): string {
  let cleaned = body
    // Remove email signatures
    .replace(/--\s*\n[\s\S]*$/m, '')
    // Remove forwarded message headers
    .replace(/-----\s*Original Message\s*-----[\s\S]*/i, '')
    .replace(/On .* wrote:[\s\S]*/i, '')
    // Remove excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Limit length
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 4997) + '...';
  }

  return cleaned;
}

/**
 * Extract name from email address
 */
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Convert john.doe or john_doe to John Doe
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract relevant tags from email content
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Add source tag
  tags.push('email');

  // Check for common keywords
  if (lowerText.includes('fibre') || lowerText.includes('fiber')) {
    tags.push('fibre');
  }
  if (lowerText.includes('installation')) {
    tags.push('installation');
  }
  if (lowerText.includes('outage')) {
    tags.push('outage');
  }
  if (lowerText.includes('slow') || lowerText.includes('speed')) {
    tags.push('speed-issue');
  }
  if (lowerText.includes('billing') || lowerText.includes('invoice')) {
    tags.push('billing');
  }

  return tags;
}

/**
 * Validate email webhook payload
 */
export function validateEmailPayload(payload: unknown): payload is ParsedEmail {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const email = payload as Record<string, unknown>;

  return (
    typeof email.from === 'string' &&
    typeof email.subject === 'string' &&
    typeof email.body === 'string'
  );
}

export type { ParsedEmail, EmailParseResult };
