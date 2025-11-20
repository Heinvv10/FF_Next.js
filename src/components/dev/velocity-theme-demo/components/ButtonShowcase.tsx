/**
 * Button Showcase Component
 * Displays interactive button styles
 */

import React from 'react';
import { useVelocityTheme, useVelocityDynamicStyles } from '@/config/themes/useVelocityTheme';

export const ButtonShowcase: React.FC = () => {
  const { styles, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });
  const dynamicStyles = useVelocityDynamicStyles();

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
        Interactive Elements
      </h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '1rem',
        alignItems: 'center',
      }}>
        {/* Primary Button */}
        <button
          style={styles.button.primary}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.button.primaryHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.button.primary);
          }}
          onMouseDown={(e) => {
            Object.assign(e.currentTarget.style, {
              ...styles.button.primary,
              ...styles.button.primaryActive,
            });
          }}
          onMouseUp={(e) => {
            Object.assign(e.currentTarget.style, styles.button.primaryHover);
          }}
        >
          Primary Button
        </button>

        {/* Neon Button */}
        <button
          style={styles.button.neon}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, {
              ...styles.button.neon,
              ...styles.button.neonHover,
            });
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.button.neon);
          }}
        >
          Neon Button
        </button>

        {/* Custom Gradient Button */}
        <button
          style={{
            ...dynamicStyles.createCustomGradient(['#00f5ff', '#6366f1', '#8a2be2']),
            border: 'none',
            color: theme.colors.text.primary,
            fontWeight: theme.typography.fontWeight.medium,
            borderRadius: theme.borderRadius.lg,
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            cursor: 'pointer',
            ...styles.transitions.smooth,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            Object.assign(e.currentTarget.style, styles.glow.medium);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Gradient Button
        </button>
      </div>
    </div>
  );
};
