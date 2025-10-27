import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock @neondatabase/serverless
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => {
    const sqlFunction = vi.fn().mockResolvedValue([]);
    return sqlFunction;
  }),
}));
