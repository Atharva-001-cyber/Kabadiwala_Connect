import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export default defineConfig({
  plugins: [react(), {
    name: 'offline-shell-assets',
    generateBundle(_, bundle) {
      const publicAssets = ['/models/best.onnx', '/models/device-candidate-v1.onnx', '/manifest.webmanifest', '/eco-recycle-logo.png'];
      const assets = ['/', ...Object.keys(bundle).filter(name => /\.(js|mjs|css|wasm)$/.test(name)).map(name => '/' + name), ...publicAssets];
      const hash = createHash('sha256');
      for (const entry of Object.values(bundle)) hash.update(entry.type === 'chunk' ? entry.code : entry.source);
      for (const path of publicAssets) hash.update(readFileSync(new URL('./public' + path, import.meta.url)));
      hash.update(readFileSync(new URL('./index.html', import.meta.url)));
      const template = readFileSync(new URL('./public/offline-sw.js', import.meta.url), 'utf8');
      hash.update(template);
      this.emitFile({ type: 'asset', fileName: 'offline-sw.js', source: template.replace('/* BUILD_CONFIG */', `const RELEASE = ${JSON.stringify(hash.digest('hex').slice(0, 20))}; const ASSETS = ${JSON.stringify(assets)};`) });
      this.emitFile({ type: 'asset', fileName: 'offline-assets.json', source: JSON.stringify(
        assets
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
