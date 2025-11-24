/**
 * Gradient Showcase
 * Demonstrates premium gradient effects
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';

export const GradientShowcase: React.FC = () => {
  const { styles, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  const gradients = ['primary', 'neon', 'holographic', 'plasma', 'aurora'] as const;

  return (
    <div style={{
      ...styles.glass.medium,
      padding: '2rem',
    }}>
      <h2 style={{
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: '1.5rem',
        color: theme.colors.text.accent,
      }}>
        Premium Gradients
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        {gradients.map((gradientType) => (
          <div
            key={gradientType}
            style={{
              ...styles.gradients[gradientType],
              height: '100px',
              borderRadius: theme.borderRadius.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: theme.typography.fontWeight.semibold,
              fontSize: theme.typography.fontSize.lg,
              textTransform: 'capitalize' as const,
              color: theme.colors.text.primary,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              ...styles.transitions.smooth,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              Object.assign(e.currentTarget.style, styles.elevation[3]);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {gradientType}
          </div>
        ))}
      </div>
    </div>
  );
};
