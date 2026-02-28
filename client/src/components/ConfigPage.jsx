import { useState, useEffect } from 'react'
import { defaultSettings } from '../defaults'

export default function ConfigPage({ settings: propSettings, onSave }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('proxdash_settings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('proxdash_settings', JSON.stringify(settings))
    if (onSave) onSave(settings)
  }, [settings])

  const update = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }))
  }

  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{label}</span>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '16px', paddingBottom: 90 }}>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Settings</h2>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px 16px' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Alert Thresholds</div>

        <Row label="CPU Warning (%)">
          <input type="range" min="50" max="100" value={settings.cpuWarnThreshold}
            onChange={e => update('cpuWarnThreshold', parseInt(e.target.value))}
            style={{ width: 100 }} />
          <span style={{ color: '#fff', fontSize: 12, marginLeft: 8, fontFamily: 'JetBrains Mono', width: 30, textAlign: 'right' }}>{settings.cpuWarnThreshold}</span>
        </Row>

        <Row label="Memory Warning (%)">
          <input type="range" min="50" max="100" value={settings.memWarnThreshold}
            onChange={e => update('memWarnThreshold', parseInt(e.target.value))}
            style={{ width: 100 }} />
          <span style={{ color: '#fff', fontSize: 12, marginLeft: 8, fontFamily: 'JetBrains Mono', width: 30, textAlign: 'right' }}>{settings.memWarnThreshold}</span>
        </Row>

        <Row label="Disk Warning (%)">
          <input type="range" min="50" max="100" value={settings.diskWarnThreshold}
            onChange={e => update('diskWarnThreshold', parseInt(e.target.value))}
            style={{ width: 100 }} />
          <span style={{ color: '#fff', fontSize: 12, marginLeft: 8, fontFamily: 'JetBrains Mono', width: 30, textAlign: 'right' }}>{settings.diskWarnThreshold}</span>
        </Row>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px 16px', marginTop: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Behavior</div>

        <Row label="Poll Interval (seconds)">
          <input type="number" min="1" max="60" value={settings.pollInterval}
            onChange={e => update('pollInterval', parseInt(e.target.value))}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', padding: '6px 10px', width: 60, textAlign: 'center', fontFamily: 'JetBrains Mono' }} />
        </Row>

        <Row label="Confirm before Stop">
          <button onClick={() => update('confirmStop', !settings.confirmStop)} style={{
            background: settings.confirmStop ? '#00ff88' : 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: 12, width: 48, height: 26, cursor: 'pointer',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 3, left: settings.confirmStop ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
          </button>
        </Row>

        <Row label="Confirm before Shutdown">
          <button onClick={() => update('confirmShutdown', !settings.confirmShutdown)} style={{
            background: settings.confirmShutdown ? '#00ff88' : 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: 12, width: 48, height: 26, cursor: 'pointer',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 3, left: settings.confirmShutdown ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
          </button>
        </Row>
      </div>
    </div>
  )
}
