import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

const defaultAllowedHosts = ['localhost', '127.0.0.1'];

function getAllowedHosts(): string[] {
  const rawAllowedHosts = process.env.VITE_ALLOWED_HOSTS ?? defaultAllowedHosts.join(',');
  return rawAllowedHosts
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
}

function serveStaticSubpaths(): Plugin {
  return {
    name: 'serve-static-subpaths',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url.startsWith('/docs/') || url.startsWith('/storybook/') || url.startsWith('/playground/')) {
          const filePath = path.join(process.cwd(), 'public', url);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            return res.end(fs.readFileSync(filePath));
          }
          // SPA fallback within subpath
          const root = url.startsWith('/docs/') ? 'docs' : url.startsWith('/playground/') ? 'playground' : 'storybook';
          const indexPath = path.join(process.cwd(), 'public', root, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.setHeader('Content-Type', 'text/html');
            return res.end(fs.readFileSync(indexPath));
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/dxp/',
  plugins: [serveStaticSubpaths(), react()],
  server: {
    port: 5020,
    allowedHosts: getAllowedHosts(),
    proxy: {
      '/api': {
        target: 'http://localhost:5021',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});

