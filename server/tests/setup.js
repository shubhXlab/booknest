import { vi } from 'vitest';

vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    })),
    close: vi.fn(),
  };
  return { default: vi.fn(() => mockDb) };
});

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';