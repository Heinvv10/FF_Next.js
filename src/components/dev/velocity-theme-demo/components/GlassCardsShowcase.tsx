/**
 * Glass Cards Showcase Component
 * Displays grid of glassmorphism effect variations
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';
import { glassCardsData } from '../data/showcaseData';

export const GlassCardsShowcase: React.FC = () => {
  const { styles, utils, theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem',
    }}>
      {glassCardsData.map((card) => (
        <div
          key={card.type}
          style={{
            ...styles.glass[card.type],
            ...(card.animation !== 'none' ? utils.getHoverAnimation(card.animation!) : {}),
            padding: '1.5rem',
            ...(card.type === 'ultra' ? {
              cursor: 'pointer',
              ...styles.transitions.elastic,
            } : {}),
          }}
        >
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: card.neonColor,
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
