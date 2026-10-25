import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-plugin',
    async configureServer(server) {
      // Dynamically load SQLite database module in dev mode only
      let dbModule: typeof import('./src/server/db') | null = null;
      try {
        dbModule = await import('./src/server/db');
      } catch (err) {
        console.warn('SQLite backend module not available in this environment:', err);
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        if (!dbModule) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 503;
          return res.end(JSON.stringify({ error: 'Database service is initializing or unavailable' }));
        }

        const {
          getDbState,
          syncDbState,
          resetDbState,
          updateSysConfig,
          saveSysCatalogItem,
          deleteSysCatalogItem,
          executeSql,
          getTableData,
          getBackupData,
          restoreBackupData
        } = dbModule;

        const [urlPath] = (req.url || '').split('?');

        // Helper to send json
        const sendJson = (statusCode: number, data: any) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = statusCode;
          res.end(JSON.stringify(data));
        };

        // 1. GET Endpoints
        if (req.method === 'GET') {
          // GET /api/state
          if (urlPath === '/api/state') {
            try {
              const state = getDbState();
              return sendJson(200, state);
            } catch (err: any) {
              return sendJson(500, { error: err.message });
            }
          }

          // GET /api/admin/backup
          if (urlPath === '/api/admin/backup') {
            try {
              const backup = getBackupData();
              const dateStr = new Date().toISOString().split('T')[0];
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Content-Disposition', `attachment; filename="eventtech_backup_${dateStr}.json"`);
              res.statusCode = 200;
              return res.end(JSON.stringify(backup, null, 2));
            } catch (err: any) {
              return sendJson(500, { error: err.message });
            }
          }

          // GET /api/admin/table/:tableName
          if (urlPath.startsWith('/api/admin/table/')) {
            try {
              const tableName = decodeURIComponent(urlPath.replace('/api/admin/table/', '').trim());
              const tableData = getTableData(tableName, 100);
              return sendJson(200, tableData);
            } catch (err: any) {
              return sendJson(400, { error: err.message });
            }
          }
        }

        // 2. POST Endpoints
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = body ? JSON.parse(body) : {};

              // POST /api/sync
              if (urlPath === '/api/sync') {
                const updatedState = syncDbState(parsed, parsed.userName, parsed.userRole);
                return sendJson(200, updatedState);
              }

              // POST /api/admin/config
              if (urlPath === '/api/admin/config') {
                const configUpdates = parsed.config || parsed;
                const updated = updateSysConfig(configUpdates, parsed.userName, parsed.userRole);
                return sendJson(200, { success: true, config: updated });
              }

              // POST /api/admin/catalogs
              if (urlPath === '/api/admin/catalogs') {
                const { action, item, id, userName, userRole } = parsed;
                if (action === 'delete') {
                  const updated = deleteSysCatalogItem(id || item?.id, userName, userRole);
                  return sendJson(200, { success: true, catalogs: updated });
                } else {
                  const updated = saveSysCatalogItem(item, userName, userRole);
                  return sendJson(200, { success: true, catalogs: updated });
                }
              }

              // POST /api/admin/sql
              if (urlPath === '/api/admin/sql') {
                const { query, userName, userRole } = parsed;
                const result = executeSql(query || '', userName, userRole);
                return sendJson(200, result);
              }

              // POST /api/admin/restore
              if (urlPath === '/api/admin/restore') {
                const restoreData = parsed.dump || parsed;
                const restoredState = restoreBackupData(restoreData, parsed.userName, parsed.userRole);
                return sendJson(200, { success: true, state: restoredState });
              }

              // POST /api/reset
              if (urlPath === '/api/reset') {
                const resetState = resetDbState(parsed.userName, parsed.userRole);
                return sendJson(200, resetState);
              }

              return sendJson(404, { error: 'Endpoint not found' });
            } catch (err: any) {
              return sendJson(500, { error: err.message });
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
