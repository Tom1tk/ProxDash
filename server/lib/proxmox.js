import axios from 'axios'
import https from 'https'
import 'dotenv/config'

const agent = new https.Agent({ rejectUnauthorized: false })

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

export async function api(method, path, data = {}) {
  try {
    const res = await pve({ method, url: path, data })
    return { data: res.data.data, error: null }
  } catch (err) {
    const msg = err.response?.data?.errors || err.message
    return { data: null, error: msg }
  }
}
