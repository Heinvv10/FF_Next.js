/**
 * Security Patterns
 * Regular expressions to detect and block dangerous content
 */

export const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /<script/i,
  /eval\(/i,
  /Function\(/i,
  /document\./i,
  /window\./i,
] as const;

/**
 * Check if a value matches any dangerous pattern
 */
export function containsDangerousPattern(value: string): { matches: boolean; pattern?: RegExp } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      return { matches: true, pattern };
    }
  }
  return { matches: false };
}
