import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/fast2sms-api': {
        target: 'https://www.fast2sms.com/dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/fast2sms-api/, '')
      }
    }
  }
});
