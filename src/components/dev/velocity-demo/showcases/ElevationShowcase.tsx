/**
 * Elevation Showcase
 * Demonstrates the 8-level elevation system
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';

export const ElevationShowcase: React.FC = () => {
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
        Elevation System
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
          <div
            key={level}
            style={{
              ...styles.elevation[level as keyof typeof styles.elevation],
              background: theme.colors.surface.primary,
              padding: '1rem',
              borderRadius: theme.borderRadius.lg,
              textAlign: 'center' as const,
              ...styles.transitions.smooth,
            }}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.transforms.hover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.tertiary,
              marginBottom: '0.5rem',
            }}>
              Level
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.neon?.cyan || '#00f5ff',
            }}>
              {level}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
