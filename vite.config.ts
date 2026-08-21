import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: [
        'firebase',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        '@firebase/app',
        '@firebase/component',
        '@firebase/util',
        '@firebase/firestore',
        '@firebase/auth',
        'react',
        'react-dom',
      ],
    },
    optimizeDeps: {
      exclude: [
        'firebase',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        '@firebase/app',
        '@firebase/auth',
        '@firebase/firestore',
        '@firebase/component',
        '@firebase/util',
        '@firebase/logger',
      ],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      chunkSizeWarningLimit: 3000,
    },
  };
});
