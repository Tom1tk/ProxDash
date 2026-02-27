#!/bin/bash
set -e

echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx

echo "==> Installing PM2"
npm install -g pm2

echo "==> Cloning ProxDash"
cd /opt
git clone https://github.com/YOUR_USERNAME/proxdash.git
cd proxdash

echo "==> Installing server dependencies"
cd server && npm install && cd ..

echo "==> Installing client dependencies and building"
cd client && npm install && npm run build && cd ..

echo "==> Setting up .env — EDIT THIS FILE BEFORE STARTING"
cp server/.env.example server/.env
echo ""
echo "  >>> EDIT /opt/proxdash/server/.env now, then run:"
echo "  >>> pm2 start /opt/proxdash/server/index.js --name proxdash"
echo "  >>> pm2 save && pm2 startup"
echo ""

echo "==> Configuring Nginx"
cp nginx/proxdash.conf /etc/nginx/sites-available/proxdash
ln -sf /etc/nginx/sites-available/proxdash /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Done. Don't forget to edit .env!"
