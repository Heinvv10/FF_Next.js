/**
 * VELOCITY Theme Demo Data
 * Configuration data for demo showcases
 */

import type { GlassCardConfig, NeonEffectData, GradientData } from '../types/demo.types';

/**
 * Glass card configurations
 */
export const glassCardsData: GlassCardConfig[] = [
  {
    type: 'light',
    title: 'Glass Light',
    description: 'Subtle glassmorphism effect with light backdrop blur and transparency.',
    neonColor: '#00f5ff',
    animation: 'lift',
  },
  {
    type: 'medium',
    title: 'Glass Medium',
    description: 'Enhanced glassmorphism with medium blur and improved visual depth.',
    neonColor: '#0066ff',
    animation: 'float',
  },
  {
    type: 'heavy',
    title: 'Glass Heavy',
    description: 'Strong glassmorphism effect with heavy backdrop filtering.',
    neonColor: '#6366f1',
    animation: 'glow',
  },
  {
    type: 'ultra',
    title: 'Glass Ultra',
    description: 'Maximum glassmorphism with ultra blur and premium neon borders.',
    neonColor: '#00ffff',
    animation: 'none',
  },
];

/**
 * Elevation levels (1-8)
 */
export const elevationLevels: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Neon effect color data
 */
export const neonEffectsData: NeonEffectData[] = [
  { color: 'cyan', rgbValues: '0, 245, 255' },
  { color: 'blue', rgbValues: '0, 102, 255' },
  { color: 'purple', rgbValues: '99, 102, 241' },
  { color: 'plasma', rgbValues: '138, 43, 226' },
  { color: 'laser', rgbValues: '255, 20, 147' },
  { color: 'electric', rgbValues: '0, 255, 255' },
];

/**
 * Gradient showcase data
 */
export const gradientsData: GradientData[] = [
  { type: 'primary' },
  { type: 'neon' },
  { type: 'holographic' },
  { type: 'plasma' },
  { type: 'aurora' },
];
