import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  plugins: [
    react(),
    {
      name: 'mirror-build-artifacts',
      closeBundle() {
        try {
          const distDir = path.resolve(__dirname, 'dist');
          const buildDir = path.resolve(__dirname, 'build');
          if (fs.existsSync(distDir)) {
            fs.cpSync(distDir, buildDir, { recursive: true, force: true });
          }
        } catch (err) {
          console.warn('Artifact mirroring notice:', err);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
