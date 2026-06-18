import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: ['node_modules', 'dist', 'coverage', '**/*.d.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    setupFiles: ['./tests/setup/test-server.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@utils': resolve(__dirname, './src/utils'),
      '@db': resolve(__dirname, './src/db'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@services': resolve(__dirname, './src/services'),
      '@routes': resolve(__dirname, './src/routes'),
      '@repositories': resolve(__dirname, './src/repositories'),
      '@middleware': resolve(__dirname, './src/middleware'),
      '@constants': resolve(__dirname, './src/constants'),
      '@schemas': resolve(__dirname, './src/schemas'),
      '@di': resolve(__dirname, './src/di'),
      '@interfaces': resolve(__dirname, './src/interfaces'),
    },
  },
});
