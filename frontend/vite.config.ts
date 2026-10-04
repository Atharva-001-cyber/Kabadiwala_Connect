import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Server-only development module; never imported by browser code.
import { localVisionPlugin } from './server/localVision.mjs';

export default defineConfig({
  plugins: [react(), localVisionPlugin(loadEnv('development', process.cwd(), 'LOCAL_VISION_')), {
    name: 'offline-shell-assets',
    generateBundle(_, bundle) {
      this.emitFile({ type: 'asset', fileName: 'offline-assets.json', source: JSON.stringify(
        ['/', ...Object.keys(bundle).filter(name => /\.(js|css)$/.test(name)).map(name => '/' + name)]
      ) });
    }
  }],
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
