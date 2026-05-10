import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SOGNA: Global Orchestration Config
 * Optimizado para eficiencia de memoria, arquitectura profunda y feedback visual de motores.
 */
export default defineConfig({
  plugins: [react()],
  root: 'src',
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, '../../Sognatore/src/core'),
      '@engines': path.resolve(__dirname, '../engines'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@memory': path.resolve(__dirname, '../../Sognatore/src/core/memory'),
    },
  },
  build: {
    outDir: '../dist',
    minify: 'esbuild',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    manifest: true,
    rollupOptions: {
      output: {
        // FEEDBACK VISUAL: Segmentación granular para control de peso de motores
        manualChunks(id) {
          if (id.includes('Curator/engines/Sentinel')) return 'engine-sentinel';
          if (id.includes('Curator/engines/Animator')) return 'engine-animator';
          if (id.includes('Curator/engines/Predatore')) return 'engine-predatore';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
