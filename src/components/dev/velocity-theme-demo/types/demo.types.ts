/**
 * VELOCITY Theme Demo Types
 * Type definitions for demo components
 */

/**
 * Glass card configuration
 */
export interface GlassCardConfig {
  type: 'light' | 'medium' | 'heavy' | 'ultra';
  title: string;
  description: string;
  neonColor: string;
  animation?: 'lift' | 'float' | 'glow' | 'none';
}

/**
 * Neon color configuration
 */
export type NeonColor = 'cyan' | 'blue' | 'purple' | 'plasma' | 'laser' | 'electric';

/**
 * Gradient type configuration
 */
export type GradientType = 'primary' | 'neon' | 'holographic' | 'plasma' | 'aurora';

/**
 * Elevation level (1-8)
 */
export type ElevationLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Neon effect data
 */
export interface NeonEffectData {
  color: NeonColor;
  rgbValues: string;
}

/**
 * Gradient showcase data
 */
export interface GradientData {
  type: GradientType;
}
