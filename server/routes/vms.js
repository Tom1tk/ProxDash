import { Router } from 'express'
import { api, NODE } from '../lib/proxmox.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await api('GET', `/nodes/${NODE}/qemu`)
  if (error) return res.status(500).json({ error })
  
  const vms = (Array.isArray(data) ? data : []).map(vm => ({
    id: vm.vmid,
    name: vm.name,
    type: 'qemu',
    status: vm.status,
    cpu: vm.status === 'running' ? Math.round(vm.cpu * 100) : 0,
    mem: vm.status === 'running' ? Math.round((vm.mem / vm.maxmem) * 100) : 0,
    memUsed: vm.mem || 0,
    memTotal: vm.maxmem || 0,
    uptime: vm.uptime || 0,
    netin: vm.netin || 0,
    netout: vm.netout || 0,
  })).sort((a, b) => a.id - b.id)
  
  res.json(vms)
})

router.post('/:vmid/:action', async (req, res) => {
  const { vmid, action } = req.params
  const allowedActions = ['start', 'stop', 'reboot', 'shutdown']
  
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }
  
  const { data, error } = await api('POST', `/nodes/${NODE}/qemu/${vmid}/status/${action}`)
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
