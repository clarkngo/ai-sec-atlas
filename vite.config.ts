import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://<user>.github.io/ai-sec-atlas/ on GitHub Pages.
export default defineConfig({
  base: '/ai-sec-atlas/',
  plugins: [react(), tailwindcss()],
});
