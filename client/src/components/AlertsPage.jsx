import { useState, useEffect } from 'react'
import { defaultSettings } from '../defaults'

export default function AlertsPage({ node, containers, vms, settings = defaultSettings }) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const newAlerts = []

    if (node) {
      if (node.cpu > settings.cpuWarnThreshold) {
        newAlerts.push({ level: 'warn', resource: node.name, metric: 'CPU', value: node.cpu })
      }
      if (node.mem > settings.memWarnThreshold) {
        newAlerts.push({ level: 'warn', resource: node.name, metric: 'MEM', value: node.mem })
      }
      if (node.disk > settings.diskWarnThreshold) {
        newAlerts.push({ level: 'warn', resource: node.name, metric: 'DISK', value: node.disk })
      }
    }

    ;[...containers, ...vms].forEach(ct => {
      if (ct.status === 'running') {
        if (ct.cpu > settings.cpuWarnThreshold) {
          newAlerts.push({ level: 'warn', resource: ct.name, metric: 'CPU', value: ct.cpu })
        }
        if (ct.mem > settings.memWarnThreshold) {
          newAlerts.push({ level: 'warn', resource: ct.name, metric: 'MEM', value: ct.mem })
        }
      }
    })

    setAlerts(newAlerts)
  }, [node, containers, vms, settings])

  return (
    <div style={{ padding: '16px', paddingBottom: 90 }}>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Alerts</h2>

      {alerts.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>All systems normal</div>
        </div>
      ) : (
        <div>
          {alerts.map((alert, i) => (
            <div key={i} style={{
              background: 'rgba(255,170,0,0.08)',
              border: '1px solid rgba(255,170,0,0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{alert.resource}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{alert.metric} at {alert.value}%</div>
              </div>
              <div style={{ color: '#ffaa00', fontSize: 11, fontFamily: 'JetBrains Mono' }}>WARN</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
