import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.BACKEND_URL || 'http://localhost:3010';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __B1GCRM_BUILD_API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
  plugins: [react(), {
    name: 'backend-url',
    transformIndexHtml() {
      const apiUrl = process.env.VITE_API_URL || '';
      if (apiUrl && new URL(apiUrl).protocol !== 'https:') {
        throw new Error('VITE_API_URL must use HTTPS');
      }
      return [{ tag: 'script', injectTo: 'head-prepend', children:
        `window.__B1GCRM_API_URL__=${JSON.stringify(apiUrl).replace(/</g, '\\u003c')};` }];
    },
  }],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/media': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendTarget,
        ws: true,
      },
    },
  },
});
