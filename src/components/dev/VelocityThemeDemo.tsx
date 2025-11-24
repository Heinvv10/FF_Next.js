/**
 * VELOCITY Theme Demo Component
 * Showcases all the premium VELOCITY theme features
 */

import React from 'react';
import { useVelocityTheme } from '@/config/themes/useVelocityTheme';
import { DemoHeader } from './velocity-demo/DemoHeader';
import {
  GlassCardsShowcase,
  ElevationShowcase,
  ButtonShowcase,
  NeonEffectsShowcase,
  GradientShowcase
} from './velocity-demo/showcases';

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
