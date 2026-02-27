import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/node', async (req, res) => {
  const tf = req.query.timeframe || 'hour'
  const { data, error } = await api('GET', `/nodes/${NODE}/rrddata?timeframe=${tf}&cf=AVERAGE`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

router.get('/lxc/:vmid', async (req, res) => {
  const tf = req.query.timeframe || 'hour'
  const { data, error } = await api('GET', `/nodes/${NODE}/lxc/${req.params.vmid}/rrddata?timeframe=${tf}&cf=AVERAGE`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

router.get('/qemu/:vmid', async (req, res) => {
  const tf = req.query.timeframe || 'hour'
  const { data, error } = await api('GET', `/nodes/${NODE}/qemu/${req.params.vmid}/rrddata?timeframe=${tf}&cf=AVERAGE`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
