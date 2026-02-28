import axios from 'axios'
import https from 'https'
import 'dotenv/config'

const agent = new https.Agent({ rejectUnauthorized: false })

// Ensure the Authorization header always has the PVEAPIToken= prefix
// .env can store either the full "PVEAPIToken=root@pam!token=..." or just "root@pam!token=..."
const rawToken = process.env.PROXMOX_TOKEN || ''
const authHeader = rawToken.startsWith('PVEAPIToken=')
  ? rawToken
  : `PVEAPIToken=${rawToken}`

export const pve = axios.create({
  baseURL: `${process.env.PROXMOX_HOST}/api2/json`,
  httpsAgent: agent,
  headers: {
    Authorization: authHeader,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const NODE = process.env.PROXMOX_NODE || 'prox'

export async function api(method, path, data = {}) {
  try {
    const res = await pve({ method, url: path, ...(method !== 'GET' && { data }) })
    return { data: res.data.data, error: null }
  } catch (err) {
    const status = err.response?.status
    const msg = err.response?.data?.errors || err.response?.data || err.message
    console.error(`[Proxmox API] ${method} ${path} → ${status || 'network error'}:`, JSON.stringify(msg))
    return { data: null, error: msg }
  }
}
