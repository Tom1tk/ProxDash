import { useState, useEffect, useCallback } from 'react'
import { getNode, getContainers, getVMs, containerAction, vmAction } from './api'
import { usePolling, usePageVisibility } from './hooks/usePolling'
import { useToast } from './hooks/useToast'
import Header from './components/Header'
import NodeStats from './components/NodeStats'
import ContainerCard from './components/ContainerCard'
import VMCard from './components/VMCard'
import Toast from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import Terminal from './components/Terminal'
import BottomNav from './components/BottomNav'
import StatsPage from './components/StatsPage'
import AlertsPage from './components/AlertsPage'
import ConfigPage from './components/ConfigPage'

const mockContainers = [
  { id: 100, name: "media-server", type: "lxc", status: "running", cpu: 4, mem: 8 },
  { id: 101, name: "openclaw", type: "lxc", status: "running", cpu: 22, mem: 31 },
  { id: 102, name: "opencode", type: "lxc", status: "running", cpu: 11, mem: 19 },
  { id: 103, name: "web-tracker", type: "lxc", status: "stopped", cpu: 0, mem: 0 },
  { id: 104, name: "pihole", type: "lxc", status: "running", cpu: 2, mem: 6 },
]

const defaultSettings = {
  cpuWarnThreshold: 80,
  memWarnThreshold: 85,
  diskWarnThreshold: 90,
}

export default function MainDash() {
  const [node, setNode] = useState(null)
  const [containers, setContainers] = useState([])
  const [vms, setVms] = useState([])
  const [tab, setTab] = useState('containers')
  const [bottomTab, setBottomTab] = useState('home')
  const [now, setNow] = useState(new Date())
  const [terminalTarget, setTerminalTarget] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('proxdash_settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })

  const { toast, showToast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [nodeData, containerData, vmData] = await Promise.all([
        getNode().catch(() => ({ name: 'prox', cpu: 18, mem: 62, disk: 38, uptime: 1234567, ip: '192.168.68.10' })),
        getContainers().catch(() => mockContainers),
        getVMs().catch(() => [])
      ])
      setNode(nodeData)
      setContainers(containerData)
      setVms(vmData)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const isVisible = useCallback(() => document.visibilityState === 'visible', [])
  usePolling(loadData, settings.pollInterval * 1000, isVisible() && bottomTab === 'home')
  usePageVisibility((visible) => {
    if (visible) loadData()
  })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(t)
  }, [])

  const handleAction = async (ct, action) => {
    if (action === 'console') {
      setTerminalTarget(ct.id.toString())
      return
    }

    if ((action === 'stop' || action === 'shutdown') && settings.confirmStop) {
      setConfirm({ ct, action, isVM: ct.type === 'qemu' })
      return
    }

    const apiCall = ct.type === 'qemu' ? vmAction : containerAction
    try {
      await apiCall(ct.id, action)
      showToast(`${action === 'start' ? '▶' : action === 'stop' ? '■' : '↺'} ${ct.name} ${action}ed`)
      setTimeout(loadData, 2000)
    } catch (e) {
      showToast('Action failed')
    }
  }

  const confirmAction = async () => {
    if (!confirm) return
    const { ct, action, isVM } = confirm
    const apiCall = isVM ? vmAction : containerAction
    try {
      await apiCall(ct.id, action)
      showToast(`■ ${ct.name} ${action}ed`)
      setConfirm(null)
      setTimeout(loadData, 2000)
    } catch (e) {
      showToast('Action failed')
      setConfirm(null)
    }
  }

  const running = [...containers, ...vms].filter(c => c.status === 'running').length
  const total = containers.length + vms.length
  const alertCount = (() => {
    let count = 0
    if (node) {
      if (node.cpu > settings.cpuWarnThreshold) count++
      if (node.mem > settings.memWarnThreshold) count++
      if (node.disk > settings.diskWarnThreshold) count++
    }
    ;[...containers, ...vms].forEach(c => {
      if (c.status === 'running') {
        if (c.cpu > settings.cpuWarnThreshold) count++
        if (c.mem > settings.memWarnThreshold) count++
      }
    })
    return count
  })()

  return (
    <>
      <div style={{
        minHeight: "100vh", background: "#080b10",
        fontFamily: "'Sora', sans-serif",
        maxWidth: 430, margin: "0 auto",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,170,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: 0, left: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(170,68,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        {bottomTab === 'home' && (
          <>
            <Header node={node} running={running} total={total} now={now} />
            <div style={{ padding: "16px 16px 90px" }}>
              <NodeStats node={node} />
              
              <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
                <button onClick={() => setTab('containers')} style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                  background: tab === 'containers' ? "rgba(255,255,255,0.08)" : "transparent",
                  color: tab === 'containers' ? "#fff" : "rgba(255,255,255,0.35)",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>📦 Containers</button>
                <button onClick={() => setTab('vms')} style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                  background: tab === 'vms' ? "rgba(255,255,255,0.08)" : "transparent",
                  color: tab === 'vms' ? "#fff" : "rgba(255,255,255,0.35)",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>🖥 VMs</button>
              </div>

              {tab === 'containers' && (
                <div>
                  {containers.map(ct => (
                    <ContainerCard key={ct.id} ct={ct} onAction={handleAction} onConsole={handleAction} />
                  ))}
                </div>
              )}
              {tab === 'vms' && (
                vms.length > 0 ? (
                  <div>
                    {vms.map(vm => (
                      <VMCard key={vm.id} vm={vm} onAction={handleAction} onConsole={handleAction} />
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🖥</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>No VMs configured</div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {bottomTab === 'stats' && <StatsPage containers={containers} vms={vms} />}
        {bottomTab === 'alerts' && <AlertsPage node={node} containers={containers} vms={vms} settings={settings} />}
        {bottomTab === 'config' && <ConfigPage settings={settings} onSave={setSettings} />}

        <BottomNav activeTab={bottomTab} onTabChange={setBottomTab} alertCount={alertCount} />

        {terminalTarget && <Terminal target={terminalTarget} onClose={() => setTerminalTarget(null)} />}
        {confirm && (
          <ConfirmModal 
            title={`${confirm.action === 'stop' ? 'Stop' : 'Shutdown'} ${confirm.ct.name}?`}
            message={`This will ${confirm.action === 'stop' ? 'force stop' : 'gracefully shut down'} the container.`}
            onConfirm={confirmAction}
            onCancel={() => setConfirm(null)}
          />
        )}
        {toast && <Toast msg={toast} onDone={() => {}} />}
      </div>
    </>
  )
}
