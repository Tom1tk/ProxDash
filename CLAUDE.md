# ProxDash — Agent Briefing

## What this is
Mobile-first PWA dashboard for Proxmox VE. React + Vite frontend,
Express proxy backend, served from LXC CT 130 (192.168.68.20).

## Infrastructure
- Proxmox host: prox @ 192.168.68.10:8006
- ProxDash LXC: CT 130 @ 192.168.68.20
- Repo: https://github.com/Tom1tk/ProxDash
- Deploy: ssh root@192.168.68.20, then bash /opt/proxdash/deploy/update.sh

## Current known issues
- SSH_HOST_* entries in .env have wrong IPs/ports — terminals won't work yet
  (set correct container IPs in /opt/proxdash/server/.env)

## Resolved issues
- GET body fix applied to server/lib/proxmox.js (data only sent on non-GET)
- PM2 uses ecosystem.config.cjs with --env-file absolute path
- ErrorBoundary added to main.jsx
- Stats page has full SVG line charts (CPU, MEM, Network, Disk)
- PWA icons generated (icon-192.png, icon-512.png, icon.svg)

## Stack
- client/src/ — React 18, Vite, no CSS framework, inline styles throughout
- server/ — Express, axios to Proxmox API, ssh2 for terminal relay, ws
- PM2 ecosystem: /opt/proxdash/ecosystem.config.cjs
- .env location: /opt/proxdash/server/.env

## Key files
- client/src/defaults.js — shared settings defaults (thresholds, poll interval)
- client/src/components/ErrorBoundary.jsx — catches uncaught React errors
- client/src/components/StatsPage.jsx — SVG line charts for node/container stats

## Design tokens (do not change these)
- Background: #080b10, fonts: Sora + JetBrains Mono
- See proxmox-dashboard.jsx for full visual reference