#!/bin/bash
set -e

echo "==> Updating ProxDash"
cd /opt/proxdash

echo "==> Pulling latest..."
git pull

echo "==> Rebuilding client..."
cd client && npm install && npm run build && cd ..

echo "==> Restarting PM2..."
pm2 restart proxdash

echo "==> Done!"
