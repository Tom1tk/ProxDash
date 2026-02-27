# ProxDash

Mobile-first Proxmox VE dashboard PWA.

## Quick Start

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your Proxmox API token
npm install
npm run dev

# Client
cd ../client
npm install
npm run dev
```

## Deployment

See `deploy/install.sh` for full LXC container setup.

## Features

- Start/stop/restart containers & VMs
- Real-time CPU/MEM/DISK stats
- Web terminal (xterm.js)
- Alert thresholds
- PWA (add to home screen)
