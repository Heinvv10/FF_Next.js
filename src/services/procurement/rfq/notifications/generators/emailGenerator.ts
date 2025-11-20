/**
 * RFQ Email Content Generator
 * Generates HTML and text email content for RFQ notifications
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 397 → 11 lines (97% reduction)
 *
 * Architecture:
 * - templates/: 6 specialized email template generators
 * - Each template handles HTML and text content generation
 * - Clean separation by email event type
 */

// Re-export for backward compatibility
export { RFQEmailGenerator } from './email-generator';
