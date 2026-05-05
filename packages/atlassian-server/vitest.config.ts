import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/server.ts', 'src/tools/**/*.ts', 'src/utils/format.ts', 'src/**/types.ts'],
      thresholds: {
        lines: 75,
        functions: 85,
        branches: 50,
        statements: 75,
      },
    },
  },
});
