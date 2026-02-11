#!/bin/bash
# Production startup script with better error handling
echo "[Startup] Node version:"
node --version
echo "[Startup] npm version:"
npm --version
echo "[Startup] Installing dependencies..."
npm ci
echo "[Startup] Building frontend..."
npm run build
echo "[Startup] Starting server..."
npm start
