import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { getDbState, syncDbState, resetDbState } from './src/server/db';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // GET /api/state
        if (req.method === 'GET' && url === '/api/state') {
          try {
            const state = getDbState();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 200;
            res.end(JSON.stringify(state));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST endpoints: /api/sync, /api/reset
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              if (url === '/api/sync') {
                const parsed = body ? JSON.parse(body) : {};
                const updatedState = syncDbState(parsed);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify(updatedState));
                return;
              }

              if (url === '/api/reset') {
                const resetState = resetDbState();
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify(resetState));
                return;
              }

              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sqliteApiPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
