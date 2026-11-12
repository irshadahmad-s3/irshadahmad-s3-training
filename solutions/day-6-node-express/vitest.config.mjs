import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/auth.js', 'src/auth.repository.js', 'src/task.repository.js', 'src/notes.js'],
      exclude: ['src/**/*.test.js'],
      thresholds: { lines: 80 },
    },
  },
});
