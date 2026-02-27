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

export async function getVMStats(vmid, timeframe = 'hour') {
  const r = await fetch(`${BASE}/stats/qemu/${vmid}?timeframe=${timeframe}`, { headers: headers() })
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

export async function checkAuth() {
  const r = await fetch(`${BASE}/auth/check`, {
    headers: { 'x-auth-token': localStorage.getItem('proxdash_token') || '' }
  })
  return r.ok
}
