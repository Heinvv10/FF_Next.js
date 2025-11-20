/**
 * VELOCITY Theme Demo Component
 * Showcases all the premium VELOCITY theme features
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 388 → 54 lines (86% reduction)
 *
 * Architecture:
 * - types/: Type definitions for demo components
 * - data/: Showcase data (glass cards, elevation, neon, gradients)
 * - components/: Showcase section components (6 components)
 *   - DemoHeader: Title and description
 *   - GlassCardsShowcase: Glassmorphism variations
 *   - ElevationShowcase: 8-level elevation system
 *   - ButtonShowcase: Interactive button styles
 *   - NeonEffectsShowcase: Neon color effects
 *   - GradientShowcase: Premium gradients
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';
import {
  DemoHeader,
  GlassCardsShowcase,
  ElevationShowcase,
  ButtonShowcase,
  NeonEffectsShowcase,
  GradientShowcase,
} from './velocity-theme-demo/components';

const VelocityThemeDemo: React.FC = () => {
  const { theme } = useVelocityTheme({
    autoApplyVariables: true,
    optimizePerformance: true
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.gradients?.ambient,
      padding: '2rem',
      color: theme.colors.text.primary,
    }}>
      <DemoHeader />
      <GlassCardsShowcase />
      <ElevationShowcase />
      <ButtonShowcase />
      <NeonEffectsShowcase />
      <GradientShowcase />
    </div>
  );
};

export default VelocityThemeDemo;
