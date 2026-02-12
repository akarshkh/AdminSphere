#!/usr/bin/env node
console.error('[Startup] Starting Node.js application...');
console.error('[Startup] Node version:', process.version);
console.error('[Startup] Current working directory:', process.cwd());
console.error('[Startup] Environment:', process.env.NODE_ENV || 'production');

try {
    console.error('[Startup] Attempting to import server...');
    import('./backend/server/index.ts').then(() => {
        console.error('[Startup] Server module imported successfully');
    }).catch((err) => {
        console.error('[Startup] Failed to import server:', err);
        process.exit(1);
    });
} catch (err) {
    console.error('[Startup] Error during startup:', err);
    process.exit(1);
}
