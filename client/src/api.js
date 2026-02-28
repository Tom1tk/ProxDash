const BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('proxdash_token') || '',
  }
}

async function fetchJSON(url, options = {}) {
  const r = await fetch(url, { headers: headers(), ...options })
  if (r.status === 401) throw new Error('UNAUTHORIZED')
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${r.status}`)
  }
  return r.json()
}

export async function getNode() {
  return fetchJSON(`${BASE}/nodes`)
}

export async function getContainers() {
  return fetchJSON(`${BASE}/containers`)
}

export async function getVMs() {
  return fetchJSON(`${BASE}/vms`)
}

export async function containerAction(vmid, action) {
  return fetchJSON(`${BASE}/containers/${vmid}/${action}`, { method: 'POST' })
}

export async function vmAction(vmid, action) {
  return fetchJSON(`${BASE}/vms/${vmid}/${action}`, { method: 'POST' })
}

export async function getNodeStats(timeframe = 'hour') {
  return fetchJSON(`${BASE}/stats/node?timeframe=${timeframe}`)
}

export async function getContainerStats(vmid, timeframe = 'hour') {
  return fetchJSON(`${BASE}/stats/lxc/${vmid}?timeframe=${timeframe}`)
}

export async function getVMStats(vmid, timeframe = 'hour') {
  return fetchJSON(`${BASE}/stats/qemu/${vmid}?timeframe=${timeframe}`)
}

export async function login(pin) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  return r.json()
}

export async function checkAuth() {
  const r = await fetch(`${BASE}/auth/check`, {
    headers: { 'x-auth-token': localStorage.getItem('proxdash_token') || '' }
  })
  return r.ok
}
