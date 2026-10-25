import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const iconCacheAndMimePlugin = (): Plugin => {
  const applyIconHeaders = (req: any, res: any, next: () => void) => {
    const rawUrl = (req.url || '').split('?')[0];
    const isIconAsset =
      /^\/(favicon|apple-touch-icon|web-app-manifest-|site\.webmanifest)/.test(rawUrl) ||
      rawUrl.startsWith('/assets/aistudio/');

    if (isIconAsset) {
      let mimeType: string | null = null;
      if (rawUrl.endsWith('.ico')) mimeType = 'image/x-icon';
      else if (rawUrl.endsWith('.png')) mimeType = 'image/png';
      else if (rawUrl.endsWith('.svg')) mimeType = 'image/svg+xml';
      else if (rawUrl.endsWith('.webmanifest') || rawUrl.endsWith('manifest.json')) mimeType = 'application/manifest+json';
      else if (rawUrl.endsWith('.xml')) mimeType = 'application/xml';

      const origSetHeader = res.setHeader.bind(res);
      res.setHeader = (name: string, value: any) => {
        if (typeof name === 'string' && name.toLowerCase() === 'cache-control') {
          return origSetHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
        if (mimeType && typeof name === 'string' && name.toLowerCase() === 'content-type') {
          return origSetHeader('Content-Type', mimeType);
        }
        return origSetHeader(name, value);
      };

      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = (statusCode: number, ...args: any[]) => {
        origSetHeader('Cache-Control', 'public, max-age=604800, immutable');
        if (mimeType) {
          origSetHeader('Content-Type', mimeType);
        }
        return origWriteHead(statusCode, ...args);
      };

      origSetHeader('Cache-Control', 'public, max-age=604800, immutable');
      if (mimeType) {
        origSetHeader('Content-Type', mimeType);
      }
    }
    next();
  };

  return {
    name: 'icon-cache-and-mime-headers',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/%PUBLIC_URL%/g, '');
      }
    },
    configureServer(server) {
      server.middlewares.use(applyIconHeaders);
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyIconHeaders);
    }
  };
};

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  plugins: [iconCacheAndMimePlugin(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
});
