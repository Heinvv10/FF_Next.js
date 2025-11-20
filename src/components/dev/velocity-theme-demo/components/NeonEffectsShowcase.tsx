/**
 * Neon Effects Showcase Component
 * Displays neon color effects
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';
import { neonEffectsData } from '../data/showcaseData';

export const NeonEffectsShowcase: React.FC = () => {
  const { styles, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  return (
    <div style={{
      ...styles.glass.medium,
      padding: '2rem',
      marginBottom: '3rem',
    }}>
      <h2 style={{
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: '1.5rem',
        color: theme.colors.text.accent,
      }}>
        Neon Effects
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
      }}>
        {neonEffectsData.map((effect) => (
          <div
            key={effect.color}
            style={{
              ...styles.neon[effect.color],
              padding: '1rem',
              borderRadius: theme.borderRadius.lg,
              textAlign: 'center' as const,
              background: `rgba(${effect.rgbValues}, 0.1)`,
              ...styles.transitions.smooth,
            }}
          >
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              textTransform: 'uppercase' as const,
              letterSpacing: theme.typography.letterSpacing?.wider,
            }}>
              {effect.color}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
