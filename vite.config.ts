import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const useOptimizedImages = process.env.VITE_USE_OPTIMIZED_IMAGES === 'true';

export default defineConfig({
  plugins: [react()],
  base: '/d-league/',
  publicDir: useOptimizedImages ? '.optimized-public' : 'public',
});
