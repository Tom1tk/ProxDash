import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await api('GET', `/nodes/${NODE}/status`)
  if (error) return res.status(500).json({ error })
  
  res.json({
    name: NODE,
    status: 'online',
    cpu: Math.round(data.cpu * 100),
    mem: Math.round((data.memory.used / data.memory.total) * 100),
    disk: Math.round((data.rootfs.used / data.rootfs.total) * 100),
    memUsed: data.memory.used,
    memTotal: data.memory.total,
    uptime: data.uptime,
    ip: process.env.PROXMOX_HOST.replace(/https?:\/\//, '').split(':')[0],
  })
})

export default router
