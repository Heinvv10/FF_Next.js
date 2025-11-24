/**
 * Glass Cards Showcase
 * Demonstrates different glassmorphism effects
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';

export const GlassCardsShowcase: React.FC = () => {
  const { styles, utils, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  const glassCards = [
    {
      style: styles.glass.light,
      animation: utils.getHoverAnimation('lift'),
      title: 'Glass Light',
      color: theme.colors.neon?.cyan || '#00f5ff',
      description: 'Subtle glassmorphism effect with light backdrop blur and transparency.'
    },
    {
      style: styles.glass.medium,
      animation: utils.getHoverAnimation('float'),
      title: 'Glass Medium',
      color: theme.colors.neon?.blue || '#0066ff',
      description: 'Enhanced glassmorphism with medium blur and improved visual depth.'
    },
    {
      style: styles.glass.heavy,
      animation: utils.getHoverAnimation('glow'),
      title: 'Glass Heavy',
      color: theme.colors.neon?.purple || '#6366f1',
      description: 'Strong glassmorphism effect with heavy backdrop filtering.'
    },
    {
      style: styles.glass.ultra,
      animation: styles.transitions.elastic,
      title: 'Glass Ultra',
      color: theme.colors.neon?.electric || '#00ffff',
      description: 'Maximum glassmorphism with ultra blur and premium neon borders.'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem',
    }}>
      {glassCards.map((card, index) => (
        <div
          key={index}
          style={{
            ...card.style,
            ...card.animation,
            padding: '1.5rem',
            cursor: 'pointer',
          }}
        >
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: card.color,
          }}>
            {card.title}
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
          }}>
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
};
