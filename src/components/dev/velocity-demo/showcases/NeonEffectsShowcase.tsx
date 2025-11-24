/**
 * Neon Effects Showcase
 * Demonstrates neon color effects
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';

export const NeonEffectsShowcase: React.FC = () => {
  const { styles, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  const neonColors = [
    { name: 'cyan', rgb: '0, 245, 255' },
    { name: 'blue', rgb: '0, 102, 255' },
    { name: 'purple', rgb: '99, 102, 241' },
    { name: 'plasma', rgb: '138, 43, 226' },
    { name: 'laser', rgb: '255, 20, 147' },
    { name: 'electric', rgb: '0, 255, 255' },
  ] as const;

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
        {neonColors.map((color) => (
          <div
            key={color.name}
            style={{
              ...styles.neon[color.name as keyof typeof styles.neon],
              padding: '1rem',
              borderRadius: theme.borderRadius.lg,
              textAlign: 'center' as const,
              background: `rgba(${color.rgb}, 0.1)`,
              ...styles.transitions.smooth,
            }}
          >
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              textTransform: 'uppercase' as const,
              letterSpacing: theme.typography.letterSpacing?.wider,
            }}>
              {color.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
