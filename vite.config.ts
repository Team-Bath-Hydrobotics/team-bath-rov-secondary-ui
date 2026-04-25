import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/detection-api': {
          target: env.VITE_DETECTION_API_URL ?? 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/detection-api/, ''),
        },
        '/photogrammetry-api': {
          target: env.VITE_PHOTOGRAMMETRY_API_URL ?? 'http://localhost:8100',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/photogrammetry-api/, ''),
        },
      },
    },
  };
});
