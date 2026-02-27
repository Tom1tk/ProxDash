# ProxDash — Mobile Proxmox Dashboard
## Complete Implementation Specification

**Version:** 1.0  
**Target Environment:** Proxmox VE 9.x (tested on `prox` — HP Z240 @ 192.168.68.10)  
**Stack:** React + Vite PWA, served from an LXC container  
**Audience:** Developer / AI agent implementing from scratch

---

## 1. Project Overview

ProxDash is a mobile-first Progressive Web App (PWA) that provides a clean, touch-friendly interface for managing a Proxmox VE server. It communicates directly with the Proxmox REST API using an API token (no root credentials stored anywhere), and is hosted inside a lightweight Debian LXC container on the same Proxmox host it manages.

### Goals
- Start/stop/restart/shutdown LXC containers and VMs from a phone
- View real-time CPU, memory, disk, and network stats at a glance
- Access a web-based terminal (xterm.js) for containers and the host
- Add it to the iPhone/Android home screen as a PWA (feels native)
- Accessible from inside the LAN and optionally via Tailscale remotely

### Non-goals
- Not a full Proxmox replacement — just the 80% of tasks you need on the go
- No VM creation/deletion (read-only for VMs, action-only for containers)
- No user management or cluster support

---

## 2. Architecture

```
[Phone / Browser]
       │
       │  HTTPS (port 3000 or 443)
       ▼
[LXC Container: proxdash — 192.168.68.20]
   ├── Vite build output (static React PWA)
   ├── Express.js API proxy (Node)
   │       │
   │       │  HTTPS + API Token
   │       ▼
   └──> [Proxmox API: 192.168.68.10:8006]
```

**Why a proxy?**  
The Proxmox API uses a self-signed cert and requires token auth headers. Putting an Express proxy in the container means:
1. The API token never touches the browser
2. CORS issues are eliminated
3. We can add our own auth layer on top (PIN/session)
4. The mobile app just talks to the proxy over HTTP/HTTPS

---

## 3. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + Vite | Fast, familiar, great PWA support |
| Styling | Plain CSS-in-JS (no Tailwind) | No build-time compiler needed, matches mock |
| Charts/gauges | Custom SVG (as per mock) | Lightweight, matches existing design |
| Terminal | xterm.js + WebSocket | Industry standard browser terminal |
| Backend | Express.js (Node 20) | Minimal, easy to deploy, no deps bloat |
| API comms | node-fetch to Proxmox API | Server-side, keeps token out of browser |
| WebSocket | ws package | For xterm.js terminal relay |
| Process manager | PM2 | Keep Express alive, auto-restart on crash |
| Web server | Nginx (reverse proxy) | SSL termination, serve static files |
| SSL | Self-signed cert (mkcert) | Internal LAN use |
| Deployment | Debian 12 LXC on Proxmox | Lightweight, isolated |

---

## 4. Repository Structure

```
proxdash/
├── client/                        # React frontend (Vite)
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── icon-192.png           # App icon (192x192)
│   │   └── icon-512.png           # App icon (512x512)
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Root component + routing
│   │   ├── api.js                 # All fetch calls to the proxy
│   │   ├── hooks/
│   │   │   ├── usePolling.js      # Auto-refresh hook
│   │   │   └── useToast.js        # Toast notification hook
│   │   ├── components/
│   │   │   ├── Header.jsx         # Node name, status, time
│   │   │   ├── NodeStats.jsx      # CPU/MEM/DISK arc gauges
│   │   │   ├── ArcGauge.jsx       # Individual SVG arc gauge
│   │   │   ├── TabBar.jsx         # Containers / VMs tabs
│   │   │   ├── ContainerCard.jsx  # Individual LXC card
│   │   │   ├── VMCard.jsx         # Individual VM card
│   │   │   ├── ActionButtons.jsx  # Start/Stop/Restart/Console
│   │   │   ├── Terminal.jsx       # xterm.js terminal component
│   │   │   ├── Toast.jsx          # Notification toast
│   │   │   ├── ConfirmModal.jsx   # "Are you sure?" modal
│   │   │   ├── BottomNav.jsx      # Home/Stats/Alerts/Config tabs
│   │   │   ├── StatsPage.jsx      # Full stats view (charts)
│   │   │   ├── AlertsPage.jsx     # Threshold alerts list
│   │   │   └── ConfigPage.jsx     # Settings (thresholds, PIN)
│   │   └── styles/
│   │       └── global.css         # Font imports, resets, variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                        # Express proxy backend
│   ├── index.js                   # Main Express server
│   ├── routes/
│   │   ├── nodes.js               # GET /api/nodes
│   │   ├── containers.js          # GET/POST /api/containers
│   │   ├── vms.js                 # GET/POST /api/vms
│   │   ├── stats.js               # GET /api/stats/:type/:id
│   │   └── terminal.js            # WebSocket terminal handler
│   ├── lib/
│   │   ├── proxmox.js             # Proxmox API client (axios wrapper)
│   │   └── auth.js                # PIN session middleware
│   ├── .env                       # API token, Proxmox host (never commit)
│   ├── .env.example               # Template for .env
│   └── package.json
│
├── nginx/
│   └── proxdash.conf              # Nginx site config
│
├── deploy/
│   ├── setup-lxc.sh               # Creates and configures the LXC
│   ├── install.sh                 # Installs deps, builds, starts PM2
│   └── update.sh                  # Pull latest, rebuild, restart
│
├── .gitignore
└── README.md
```

---

## 5. Proxmox API Reference

The Proxmox API runs on `https://192.168.68.10:8006`. All requests use `rejectUnauthorized: false` since it's a self-signed cert (internal LAN only — acceptable).

### 5.1 Authentication

Create an API token in Proxmox under **Datacenter → Permissions → API Tokens**:
- User: `root@pam` (or create a dedicated `proxdash@pve` user)
- Token ID: `proxdash`
- Privilege Separation: **unchecked** (inherits user permissions)

The resulting token looks like: `root@pam!proxdash=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Every API request must include this header:**
```
Authorization: PVEAPIToken=root@pam!proxdash=<TOKEN_VALUE>
```

Store in `.env` as:
```
PROXMOX_HOST=https://192.168.68.10:8006
PROXMOX_TOKEN=root@pam!proxdash=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROXMOX_NODE=prox
```

### 5.2 Key API Endpoints

All endpoints are prefixed with `/api2/json`.

**Node status:**
```
GET /nodes/{node}/status
```
Returns: `cpu` (0–1 float), `memory.used`, `memory.total`, `rootfs.used`, `rootfs.total`, `uptime` (seconds)

**List containers:**
```
GET /nodes/{node}/lxc
```
Returns array of: `vmid`, `name`, `status` ("running"/"stopped"), `cpu`, `mem`, `maxmem`, `netin`, `netout`, `uptime`

**List VMs:**
```
GET /nodes/{node}/qemu
```
Returns same shape as containers.

**Container actions:**
```
POST /nodes/{node}/lxc/{vmid}/status/start
POST /nodes/{node}/lxc/{vmid}/status/stop
POST /nodes/{node}/lxc/{vmid}/status/reboot
POST /nodes/{node}/lxc/{vmid}/status/shutdown    ← graceful stop
```
Each returns a task UPID string. Poll `/nodes/{node}/tasks/{upid}/status` to check completion.

**VM actions (same pattern):**
```
POST /nodes/{node}/qemu/{vmid}/status/start
POST /nodes/{node}/qemu/{vmid}/status/stop
POST /nodes/{node}/qemu/{vmid}/status/reboot
POST /nodes/{node}/qemu/{vmid}/status/shutdown
```

**RRD stats (for charts):**
```
GET /nodes/{node}/lxc/{vmid}/rrddata?timeframe=hour&cf=AVERAGE
GET /nodes/{node}/qemu/{vmid}/rrddata?timeframe=hour&cf=AVERAGE
GET /nodes/{node}/rrddata?timeframe=hour&cf=AVERAGE
```
Returns time-series array. Fields: `time`, `cpu`, `mem`, `netin`, `netout`, `diskread`, `diskwrite`

**Terminal (VNC/SPICE — NOT used):**  
Proxmox's native VNC terminal doesn't work on mobile. We use SSH relay instead — see Section 8.

---

## 6. Backend Implementation (server/)

### 6.1 server/index.js

```javascript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { setupWebSocket } from './routes/terminal.js'
import nodesRouter from './routes/nodes.js'
import containersRouter from './routes/containers.js'
import vmsRouter from './routes/vms.js'
import statsRouter from './routes/stats.js'
import { pinAuth, pinLogin } from './lib/auth.js'
import 'dotenv/config'

const app = express()
const server = createServer(app)

app.use(helmet())
app.use(express.json())
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }))

// Auth endpoints (no PIN required)
app.post('/api/auth/login', pinLogin)
app.get('/api/auth/check', pinAuth, (req, res) => res.json({ ok: true }))

// All /api routes require PIN auth
app.use('/api', pinAuth)
app.use('/api/nodes', nodesRouter)
app.use('/api/containers', containersRouter)
app.use('/api/vms', vmsRouter)
app.use('/api/stats', statsRouter)

// Serve built React app in production
app.use(express.static('../client/dist'))
app.get('*', (req, res) => res.sendFile('../client/dist/index.html'))

// WebSocket terminal
setupWebSocket(server)

server.listen(process.env.PORT || 3001, () => {
  console.log(`ProxDash server running on port ${process.env.PORT || 3001}`)
})
```

### 6.2 server/lib/proxmox.js

```javascript
import axios from 'axios'
import https from 'https'
import 'dotenv/config'

const agent = new https.Agent({ rejectUnauthorized: false }) // self-signed cert OK on LAN

export const pve = axios.create({
  baseURL: `${process.env.PROXMOX_HOST}/api2/json`,
  httpsAgent: agent,
  headers: {
    Authorization: process.env.PROXMOX_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const NODE = process.env.PROXMOX_NODE || 'prox'

// Convenience wrapper
export async function api(method, path, data = {}) {
  try {
    const res = await pve({ method, url: path, data })
    return { data: res.data.data, error: null }
  } catch (err) {
    const msg = err.response?.data?.errors || err.message
    return { data: null, error: msg }
  }
}
```

### 6.3 server/lib/auth.js

Simple PIN-based session auth. PIN is stored in `.env` as `APP_PIN`. A session token is issued on login, stored in a Map in memory (sufficient for single-user home use).

```javascript
import crypto from 'crypto'

const sessions = new Map() // token -> expiry timestamp
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export function pinLogin(req, res) {
  const { pin } = req.body
  if (!process.env.APP_PIN) {
    // No PIN set — auth disabled
    return res.json({ token: 'no-auth' })
  }
  if (pin !== process.env.APP_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' })
  }
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + SESSION_TTL)
  res.json({ token })
}

export function pinAuth(req, res, next) {
  if (!process.env.APP_PIN) return next() // auth disabled
  const token = req.headers['x-auth-token'] || req.query.token
  const expiry = sessions.get(token)
  if (!expiry || Date.now() > expiry) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  next()
}
```

### 6.4 server/routes/nodes.js

```javascript
import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await api('GET', `/nodes/${NODE}/status`)
  if (error) return res.status(500).json({ error })
  
  // Normalise into consistent shape
  res.json({
    name: NODE,
    status: 'online',
    cpu: Math.round(data.cpu * 100),           // 0–100
    mem: Math.round((data.memory.used / data.memory.total) * 100),
    disk: Math.round((data.rootfs.used / data.rootfs.total) * 100),
    memUsed: data.memory.used,
    memTotal: data.memory.total,
    uptime: data.uptime,                        // seconds
    ip: process.env.PROXMOX_HOST.replace(/https?:\/\//, '').split(':')[0],
  })
})

export default router
```

### 6.5 server/routes/containers.js

```javascript
import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await api('GET', `/nodes/${NODE}/lxc`)
  if (error) return res.status(500).json({ error })
  
  const containers = data.map(ct => ({
    id: ct.vmid,
    name: ct.name,
    type: 'lxc',
    status: ct.status,
    cpu: ct.status === 'running' ? Math.round(ct.cpu * 100) : 0,
    mem: ct.status === 'running' ? Math.round((ct.mem / ct.maxmem) * 100) : 0,
    memUsed: ct.mem || 0,
    memTotal: ct.maxmem || 0,
    uptime: ct.uptime || 0,
    netin: ct.netin || 0,
    netout: ct.netout || 0,
  })).sort((a, b) => a.id - b.id)
  
  res.json(containers)
})

// Actions: start | stop | reboot | shutdown
router.post('/:vmid/:action', async (req, res) => {
  const { vmid, action } = req.params
  const allowedActions = ['start', 'stop', 'reboot', 'shutdown']
  
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }
  
  const { data, error } = await api('POST', `/nodes/${NODE}/lxc/${vmid}/status/${action}`)
  if (error) return res.status(500).json({ error })
  
  res.json({ task: data }) // Returns UPID task string
})

// Poll task status
router.get('/task/:upid', async (req, res) => {
  const upid = decodeURIComponent(req.params.upid)
  const { data, error } = await api('GET', `/nodes/${NODE}/tasks/${upid}/status`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
```

### 6.6 server/routes/vms.js

Same as containers.js but replace `lxc` with `qemu` throughout. Copy the file and do a find-replace.

### 6.7 server/routes/stats.js

```javascript
import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

// GET /api/stats/node?timeframe=hour
router.get('/node', async (req, res) => {
  const tf = req.query.timeframe || 'hour'
  const { data, error } = await api('GET', `/nodes/${NODE}/rrddata?timeframe=${tf}&cf=AVERAGE`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// GET /api/stats/lxc/:vmid?timeframe=hour
router.get('/lxc/:vmid', async (req, res) => {
  const tf = req.query.timeframe || 'hour'
  const { data, error } = await api('GET', `/nodes/${NODE}/lxc/${req.params.vmid}/rrddata?timeframe=${tf}&cf=AVERAGE`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
```

### 6.8 Terminal WebSocket (server/routes/terminal.js)

This relays SSH connections from the browser (xterm.js) to the target container or host. It uses `ssh2` npm package to establish SSH from the Node server, then pipes stdin/stdout over WebSocket.

```javascript
import { WebSocketServer } from 'ws'
import { Client as SSHClient } from 'ssh2'
import 'dotenv/config'

// SSH credentials for each target — store in .env
// Format: SSH_HOST_prox=root:password@192.168.68.10:22
// Format: SSH_HOST_100=root:password@192.168.68.11:22
// These are credentials to the containers themselves, not Proxmox API

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' })

  wss.on('connection', (ws, req) => {
    // Target comes from query param: /terminal?target=prox or ?target=100
    const url = new URL(req.url, 'http://localhost')
    const target = url.searchParams.get('target') || 'prox'

    const envKey = `SSH_HOST_${target}`
    const connStr = process.env[envKey]

    if (!connStr) {
      ws.send('\r\n\x1b[31mNo SSH config for target: ' + target + '\x1b[0m\r\n')
      ws.close()
      return
    }

    // Parse: user:password@host:port
    const match = connStr.match(/^(.+?):(.+?)@(.+?):(\d+)$/)
    if (!match) { ws.close(); return }
    const [, username, password, host, port] = match

    const ssh = new SSHClient()
    ssh.on('ready', () => {
      ssh.shell({ term: 'xterm-color', cols: 80, rows: 24 }, (err, stream) => {
        if (err) { ws.send('\r\nSSH shell error\r\n'); ws.close(); return }

        stream.on('data', d => ws.readyState === 1 && ws.send(d.toString('utf8')))
        stream.stderr.on('data', d => ws.readyState === 1 && ws.send(d.toString('utf8')))
        stream.on('close', () => ws.close())

        ws.on('message', data => {
          // Resize event comes as JSON: {"type":"resize","cols":80,"rows":24}
          try {
            const msg = JSON.parse(data)
            if (msg.type === 'resize') stream.setWindow(msg.rows, msg.cols)
          } catch {
            stream.write(data)
          }
        })
        ws.on('close', () => ssh.end())
      })
    })
    ssh.on('error', err => {
      ws.send(`\r\n\x1b[31mSSH error: ${err.message}\x1b[0m\r\n`)
      ws.close()
    })
    ssh.connect({ host, port: parseInt(port), username, password })
  })
}
```

---

## 7. Frontend Implementation (client/)

### 7.1 client/src/api.js

Centralise all API calls here. Reads auth token from `localStorage`.

```javascript
const BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('proxdash_token') || '',
  }
}

export async function getNode() {
  const r = await fetch(`${BASE}/nodes`, { headers: headers() })
  if (r.status === 401) throw new Error('UNAUTHORIZED')
  return r.json()
}

export async function getContainers() {
  const r = await fetch(`${BASE}/containers`, { headers: headers() })
  if (r.status === 401) throw new Error('UNAUTHORIZED')
  return r.json()
}

export async function getVMs() {
  const r = await fetch(`${BASE}/vms`, { headers: headers() })
  if (r.status === 401) throw new Error('UNAUTHORIZED')
  return r.json()
}

export async function containerAction(vmid, action) {
  const r = await fetch(`${BASE}/containers/${vmid}/${action}`, {
    method: 'POST',
    headers: headers(),
  })
  return r.json()
}

export async function vmAction(vmid, action) {
  const r = await fetch(`${BASE}/vms/${vmid}/${action}`, {
    method: 'POST',
    headers: headers(),
  })
  return r.json()
}

export async function getNodeStats(timeframe = 'hour') {
  const r = await fetch(`${BASE}/stats/node?timeframe=${timeframe}`, { headers: headers() })
  return r.json()
}

export async function getContainerStats(vmid, timeframe = 'hour') {
  const r = await fetch(`${BASE}/stats/lxc/${vmid}?timeframe=${timeframe}`, { headers: headers() })
  return r.json()
}

export async function login(pin) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  return r.json()
}
```

### 7.2 client/src/hooks/usePolling.js

```javascript
import { useEffect, useRef } from 'react'

export function usePolling(callback, interval = 5000, active = true) {
  const cbRef = useRef(callback)
  useEffect(() => { cbRef.current = callback }, [callback])

  useEffect(() => {
    if (!active) return
    cbRef.current() // call immediately
    const id = setInterval(() => cbRef.current(), interval)
    return () => clearInterval(id)
  }, [interval, active])
}
```

### 7.3 client/src/App.jsx

```javascript
import { useState, useEffect } from 'react'
import { login } from './api'
import MainDash from './components/MainDash'
import PINScreen from './components/PINScreen'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if we have a valid token
    fetch('/api/auth/check', {
      headers: { 'x-auth-token': localStorage.getItem('proxdash_token') || '' }
    }).then(r => {
      setAuthed(r.ok)
      setChecking(false)
    })
  }, [])

  async function handlePin(pin) {
    const res = await login(pin)
    if (res.token) {
      localStorage.setItem('proxdash_token', res.token)
      setAuthed(true)
    } else {
      return false // signal wrong PIN
    }
  }

  if (checking) return null // or a loading spinner
  if (!authed) return <PINScreen onSubmit={handlePin} />
  return <MainDash />
}
```

### 7.4 Main Dashboard Component

`client/src/components/MainDash.jsx` — this is the main shell. Use the provided mock (proxmox-dashboard.jsx) as the visual reference. Key differences from mock:

- Replace all `mockContainers` / `mockNodes` with real API calls using `usePolling`
- Add `ConfirmModal` before destructive actions (stop/shutdown)
- Add `Terminal` component that opens as a bottom sheet when "Console" is tapped
- Add loading skeleton states for cards while data is fetching
- Implement the BottomNav pages: Stats, Alerts, Config

**Polling intervals:**
- Node stats (header gauges): every 5 seconds
- Container/VM list: every 5 seconds
- Stats charts: every 30 seconds
- Stop polling when the page is hidden (`document.visibilityState === 'hidden'`) — use the Page Visibility API

### 7.5 client/src/components/Terminal.jsx

```jsx
import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function Terminal({ target, onClose }) {
  const divRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const term = new XTerm({
      theme: { background: '#080b10', foreground: '#e0e0e0' },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(divRef.current)
    fitAddon.fit()
    termRef.current = term

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/terminal?target=${target}`)
    wsRef.current = ws

    ws.onopen = () => {
      term.onData(data => ws.readyState === 1 && ws.send(data))
      term.onResize(({ cols, rows }) => {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
      })
    }
    ws.onmessage = e => term.write(e.data)
    ws.onclose = () => term.write('\r\n\x1b[33mDisconnected\x1b[0m\r\n')

    const ro = new ResizeObserver(() => fitAddon.fit())
    ro.observe(divRef.current)

    return () => {
      term.dispose()
      ws.close()
      ro.disconnect()
    }
  }, [target])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '60vh', background: '#080b10',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      zIndex: 100, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
          terminal — {target}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4466', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      <div ref={divRef} style={{ flex: 1, overflow: 'hidden', padding: 4 }} />
    </div>
  )
}
```

### 7.6 Confirm Modal

Show before any stop or shutdown action:

```jsx
export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', background: '#111318', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontFamily: 'Sora' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.4)', color: '#ff4466', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
```

### 7.7 PWA Manifest (client/public/manifest.json)

```json
{
  "name": "ProxDash",
  "short_name": "ProxDash",
  "description": "Proxmox mobile dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080b10",
  "theme_color": "#080b10",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 7.8 vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we use our own in /public
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png}']
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/terminal': { target: 'ws://localhost:3001', ws: true }
    }
  }
})
```

---

## 8. Config Page (client/src/components/ConfigPage.jsx)

Allow the user to configure alert thresholds and other settings. Store in `localStorage`:

```javascript
const defaults = {
  cpuWarnThreshold: 80,       // %
  memWarnThreshold: 85,       // %
  diskWarnThreshold: 90,      // %
  pollInterval: 5,            // seconds
  confirmStop: true,          // show confirm dialog before stop
  confirmShutdown: true,
}
```

Render as a settings list with sliders for thresholds and toggles for booleans. Same dark aesthetic as rest of app.

---

## 9. Alerts Page (client/src/components/AlertsPage.jsx)

On every poll, check all container and node stats against thresholds. Store alerts in state:

```javascript
const alerts = []
if (node.cpu > settings.cpuWarnThreshold) 
  alerts.push({ level: 'warn', resource: 'prox', metric: 'CPU', value: node.cpu })
containers.forEach(ct => {
  if (ct.cpu > settings.cpuWarnThreshold)
    alerts.push({ level: 'warn', resource: ct.name, metric: 'CPU', value: ct.cpu })
  if (ct.mem > settings.memWarnThreshold)
    alerts.push({ level: 'warn', resource: ct.name, metric: 'MEM', value: ct.mem })
})
```

Display as a list with colour-coded severity. If there are active alerts, show a red badge on the Alerts nav tab.

---

## 10. Deployment

### 10.1 Create the LXC Container

Run on the Proxmox host (`ssh root@192.168.68.10`):

```bash
# Create a Debian 12 LXC — CT ID 105, adjust if taken
pct create 105 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname proxdash \
  --cores 1 \
  --memory 512 \
  --swap 256 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --ostype debian \
  --unprivileged 1 \
  --start 1

pct exec 105 -- bash -c "apt update && apt install -y curl"
```

Note the assigned IP from DHCP, then set a static IP for it in your router or via:
```bash
pct exec 105 -- bash -c "echo 'auto eth0
iface eth0 inet static
  address 192.168.68.20
  netmask 255.255.252.0
  gateway 192.168.68.1' > /etc/network/interfaces.d/eth0"
```

### 10.2 install.sh

SSH into the new container and run this:

```bash
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
```

### 10.3 server/.env.example

```
PROXMOX_HOST=https://192.168.68.10:8006
PROXMOX_TOKEN=root@pam!proxdash=PASTE_YOUR_TOKEN_HERE
PROXMOX_NODE=prox
APP_PIN=1234
PORT=3001
FRONTEND_ORIGIN=http://192.168.68.20

# SSH access per target (host=prox, or vmid for containers)
SSH_HOST_prox=root:YOUR_ROOT_PW@192.168.68.10:22
SSH_HOST_100=root:password@192.168.68.11:22
SSH_HOST_101=root:password@192.168.68.12:22
SSH_HOST_102=root:password@192.168.68.13:22
SSH_HOST_104=root:password@192.168.68.15:22
```

> **Security note:** The `.env` file contains sensitive credentials. Ensure the container is not publicly exposed. For LAN-only use this is acceptable. For remote access, use Tailscale — do NOT port-forward this to the internet.

### 10.4 nginx/proxdash.conf

```nginx
server {
    listen 80;
    server_name _;

    # Static React app
    location / {
        root /opt/proxdash/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket terminal
    location /terminal {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 3600;
    }
}
```

### 10.5 PM2 setup

```bash
cd /opt/proxdash
pm2 start server/index.js --name proxdash --interpreter node
pm2 save
pm2 startup    # follow the printed command to enable on boot
```

### 10.6 Adding to iPhone Home Screen

1. Open Safari (must be Safari on iOS)
2. Navigate to `http://192.168.68.20`
3. Tap the Share button → "Add to Home Screen"
4. Name it "ProxDash" → Add

The app will open fullscreen with no browser chrome, looking and behaving like a native app.

---

## 11. Package Dependencies

### server/package.json

```json
{
  "name": "proxdash-server",
  "type": "module",
  "scripts": { "start": "node index.js", "dev": "node --watch index.js" },
  "dependencies": {
    "axios": "^1.7.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "helmet": "^7.1.0",
    "ssh2": "^1.15.0",
    "ws": "^8.17.0"
  }
}
```

### client/package.json

```json
{
  "name": "proxdash-client",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@xterm/addon-fit": "^0.10.0",
    "@xterm/xterm": "^5.5.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0",
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

---

## 12. Visual Design Reference

The visual design is defined in the companion file `proxmox-dashboard.jsx`. Key design tokens:

```javascript
// Colours
background:      '#080b10'
card:            'rgba(255,255,255,0.03)'
border:          'rgba(255,255,255,0.07)'
textPrimary:     '#ffffff'
textSecondary:   'rgba(255,255,255,0.4)'
textMuted:       'rgba(255,255,255,0.15)'

statusRunning:   '#00ff88'   // + glow: 0 0 8px #00ff88
statusStopped:   '#ff4466'
statusWarning:   '#ffaa00'

accentBlue:      '#00aaff'   // CPU gauge
accentPurple:    '#aa44ff'   // MEM gauge
accentOrange:    '#ffaa00'   // DISK gauge / warnings

// Fonts
display:         'Sora' (weights: 400, 600, 700)
mono:            'JetBrains Mono' (weights: 400, 600, 700)
// Import: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Sora:wght@400;600;700
```

All components use inline styles as shown in the mock. Do not introduce a CSS framework. Arc gauge implementation is in `ArcGauge.jsx` — use the exact SVG logic from the mock.

---

## 13. Development Workflow

For local development (on your Windows desktop or MacBook):

```bash
# Terminal 1 — backend
cd server
cp .env.example .env
# Fill in real values
npm run dev   # nodemon with --watch

# Terminal 2 — frontend  
cd client
npm run dev   # Vite dev server on :5173, proxies /api to :3001
```

Open `http://localhost:5173` in browser. Hot reload works. The proxy in `vite.config.js` handles all API and WebSocket calls transparently.

---

## 14. Feature Completion Checklist

### Phase 1 — Core (MVP)
- [ ] LXC container created and accessible at 192.168.68.20
- [ ] Proxmox API token created for `proxdash`
- [ ] `.env` populated with real values
- [ ] Node stats displayed (CPU/MEM/DISK gauges, uptime)
- [ ] Container list loads with real data
- [ ] Start / Stop / Reboot actions work
- [ ] Confirm modal shown before Stop
- [ ] Toast notifications on action
- [ ] Task polling (show spinner until Proxmox task completes)
- [ ] App installable as PWA on iPhone

### Phase 2 — Terminal
- [ ] SSH credentials configured per container in `.env`
- [ ] Console button opens xterm.js terminal sheet
- [ ] Terminal connects to target via WebSocket relay
- [ ] Terminal resizes correctly when rotating phone
- [ ] Works for both containers and `prox` host

### Phase 3 — Polish
- [ ] VM tab implemented (same as containers)
- [ ] Stats page with line charts (RRD data, hourly/daily toggle)
- [ ] Alerts page with threshold breach detection
- [ ] Config page (thresholds, poll interval)
- [ ] Red badge on Alerts tab when alerts active
- [ ] Shutdown (graceful) action added alongside Stop
- [ ] Polled data auto-pauses when page is backgrounded
- [ ] Error state shown when Proxmox API is unreachable
- [ ] Pull-to-refresh gesture

---

## 15. Security Checklist

- [ ] API token stored only in `.env`, never committed to git
- [ ] `.env` in `.gitignore`
- [ ] PIN auth enabled (`APP_PIN` set in `.env`)
- [ ] Container not exposed to internet (LAN only)
- [ ] For remote access: Tailscale installed on the LXC container
- [ ] SSH credentials in `.env` use dedicated users, not root, ideally
- [ ] `rejectUnauthorized: false` is acceptable for internal LAN only — document this

---

*End of specification. The mock UI is in proxmox-dashboard.jsx. Build Phase 1 first, verify against a real Proxmox instance, then continue to Phase 2.*
