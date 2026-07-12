import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./tests/unit/api/__mocks__/prisma.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/api/**', 'features/services/**'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
