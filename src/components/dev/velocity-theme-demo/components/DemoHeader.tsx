/**
 * Demo Header Component
 * Displays the main demo title and description
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';

export const DemoHeader: React.FC = () => {
  const { styles, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  return (
    <div style={{
      ...styles.glass.ultra,
      padding: '2rem',
      marginBottom: '2rem',
      textAlign: 'center' as const,
    }}>
      <h1 style={{
        fontSize: theme.typography.fontSize['4xl'],
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: '0.5rem',
        background: theme.gradients?.neon,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        VELOCITY Theme Demo
      </h1>
      <p style={{
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
        letterSpacing: theme.typography.letterSpacing?.wide,
      }}>
        Premium high-tech theme with glassmorphism and neon effects
      </p>
    </div>
  );
};
