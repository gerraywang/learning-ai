import { defineConfig } from 'vite';

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
