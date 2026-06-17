import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SOGNA: Global Orchestration Config
 * Optimizado para eficiencia de memoria, arquitectura profunda y feedback visual de motores.
 */
export default defineConfig({
  root: 'src',
  server: {
    port: 5173,
    open: false,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
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
          if (id.includes('/Sentinel/') || id.includes('\\Sentinel\\')) return 'engine-sentinel';
          if (id.includes('engines/Animator')) return 'engine-animator';
          if (id.includes('/Predatore/')) return 'engine-predatore';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
