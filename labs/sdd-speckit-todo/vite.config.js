import { defineConfig } from 'vitest/config';

// 単体テストは Node、画面のテストは jsdom で動かす（research.md R5）
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.js'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'ui',
          include: ['tests/ui/**/*.test.js'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
