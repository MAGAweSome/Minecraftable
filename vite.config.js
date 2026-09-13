import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    target: 'esnext',
  },
});
