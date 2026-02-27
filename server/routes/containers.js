import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await api('GET', `/nodes/${NODE}/lxc`)
  if (error) return res.status(500).json({ error })
  
  const containers = (Array.isArray(data) ? data : []).map(ct => ({
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

router.post('/:vmid/:action', async (req, res) => {
  const { vmid, action } = req.params
  const allowedActions = ['start', 'stop', 'reboot', 'shutdown']
  
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }
  
  const { data, error } = await api('POST', `/nodes/${NODE}/lxc/${vmid}/status/${action}`)
  if (error) return res.status(500).json({ error })
  
  res.json({ task: data })
})

router.get('/task/:upid', async (req, res) => {
  const upid = decodeURIComponent(req.params.upid)
  const { data, error } = await api('GET', `/nodes/${NODE}/tasks/${upid}/status`)
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
