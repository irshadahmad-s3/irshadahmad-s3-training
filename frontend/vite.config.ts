import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tasks': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (request) => request.headers.accept?.includes('text/html') ? request.url : undefined,
      },
    },
  },
});
