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
      '/auth': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/notes': 'http://localhost:3000',
      '/api-docs': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
