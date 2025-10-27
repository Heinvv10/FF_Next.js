/**
 * Test Utilities
 * Custom render functions and helpers for component testing
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

/**
 * Custom render function that wraps component with MemoryRouter
 * Use this for components that depend on react-router-dom hooks
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
}

export function renderWithRouter(
  ui: ReactElement,
  {
    routerProps = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';
export { renderWithRouter as render };
