/**
 * VELOCITY Theme Demo Component
 * Showcases all the premium VELOCITY theme features
 */

import React from 'react';
import { useVelocityTheme, useVelocityDynamicStyles } from '@/config/themes/useVelocityTheme';

const VelocityThemeDemo: React.FC = () => {
  const { styles, utils, theme } = useVelocityTheme({ 
    autoApplyVariables: true,
    optimizePerformance: true 
  });
  const dynamicStyles = useVelocityDynamicStyles();

  return (
    <div style={{ 
      minHeight: '100vh',
      background: theme.gradients?.ambient,
      padding: '2rem',
      color: theme.colors.text.primary,
    }}>
      {/* Header */}
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

      {/* Glass Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        {/* Glass Light Card */}
        <div style={{
          ...styles.glass.light,
          ...utils.getHoverAnimation('lift'),
          padding: '1.5rem',
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: theme.colors.neon?.cyan || '#00f5ff',
          }}>
            Glass Light
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
          }}>
            Subtle glassmorphism effect with light backdrop blur and transparency.
          </p>
        </div>

        {/* Glass Medium Card */}
        <div style={{
          ...styles.glass.medium,
          ...utils.getHoverAnimation('float'),
          padding: '1.5rem',
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: theme.colors.neon?.blue || '#0066ff',
          }}>
            Glass Medium
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
          }}>
            Enhanced glassmorphism with medium blur and improved visual depth.
          </p>
        </div>

        {/* Glass Heavy Card */}
        <div style={{
          ...styles.glass.heavy,
          ...utils.getHoverAnimation('glow'),
          padding: '1.5rem',
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: theme.colors.neon?.purple || '#6366f1',
          }}>
            Glass Heavy
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
          }}>
            Strong glassmorphism effect with heavy backdrop filtering.
          </p>
        </div>

        {/* Glass Ultra Card */}
        <div style={{
          ...styles.glass.ultra,
          padding: '1.5rem',
          cursor: 'pointer',
          ...styles.transitions.elastic,
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '1rem',
            color: theme.colors.neon?.electric || '#00ffff',
          }}>
            Glass Ultra
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
          }}>
            Maximum glassmorphism with ultra blur and premium neon borders.
          </p>
        </div>
      </div>

      {/* Elevation Showcase */}
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

      {/* Button Showcase */}
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

      {/* Neon Effects Showcase */}
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
          {(['cyan', 'blue', 'purple', 'plasma', 'laser', 'electric'] as const).map((color) => (
            <div
              key={color}
              style={{
                ...styles.neon[color],
                padding: '1rem',
                borderRadius: theme.borderRadius.lg,
                textAlign: 'center' as const,
                background: `rgba(${color === 'cyan' ? '0, 245, 255' : 
                             color === 'blue' ? '0, 102, 255' :
                             color === 'purple' ? '99, 102, 241' :
                             color === 'plasma' ? '138, 43, 226' :
                             color === 'laser' ? '255, 20, 147' :
                             '0, 255, 255'}, 0.1)`,
                ...styles.transitions.smooth,
              }}
            >
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                textTransform: 'uppercase' as const,
                letterSpacing: theme.typography.letterSpacing?.wider,
              }}>
                {color}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient Showcase */}
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
          {(['primary', 'neon', 'holographic', 'plasma', 'aurora'] as const).map((gradientType) => (
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
    </div>
  );
};

export default VelocityThemeDemo;