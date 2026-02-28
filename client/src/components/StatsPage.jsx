import { useState, useEffect, useCallback } from 'react'
import { getNodeStats, getContainerStats, getVMStats } from '../api'
import { usePolling } from '../hooks/usePolling'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function formatTime(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function LineChart({ data, dataKey, color, label, unit = '%', formatValue, height = 120 }) {
  if (!data || data.length === 0) return null

  const values = data.map(d => {
    const v = d[dataKey]
    return v != null && !isNaN(v) ? v : 0
  })

  const max = Math.max(...values, 0.001)
  const min = Math.min(...values, 0)

  const padW = 44
  const padR = 12
  const padT = 8
  const padB = 24
  const w = 360
  const chartW = w - padW - padR
  const chartH = height - padT - padB

  const points = values.map((v, i) => {
    const x = padW + (i / Math.max(values.length - 1, 1)) * chartW
    const y = padT + chartH - ((v - min) / (max - min || 1)) * chartH
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x.toFixed(1)} ${padT + chartH} L ${points[0].x.toFixed(1)} ${padT + chartH} Z`

  const gradId = `grad-${dataKey}-${color.replace('#', '')}`
  const currentVal = values[values.length - 1]
  const displayVal = formatValue ? formatValue(currentVal) : `${Math.round(currentVal)}${unit}`

  // Y-axis labels
  const yLabels = [max, (max + min) / 2, min]

  // X-axis labels (show ~5)
  const xLabelCount = 5
  const xLabels = []
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1))
    if (data[idx]?.time) {
      xLabels.push({ x: padW + (idx / Math.max(data.length - 1, 1)) * chartW, label: formatTime(data[idx].time) })
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <span style={{ color, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{displayVal}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((frac, i) => {
          const y = padT + frac * chartH
          return <line key={i} x1={padW} y1={y} x2={w - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        })}

        {/* Y-axis labels */}
        {yLabels.map((val, i) => {
          const y = padT + (i / (yLabels.length - 1)) * chartH
          const displayY = formatValue ? formatValue(val) : `${Math.round(val)}${unit}`
          return (
            <text key={i} x={padW - 6} y={y + 3} textAnchor="end"
              style={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
              {displayY}
            </text>
          )
        })}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={height - 4} textAnchor="middle"
            style={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
            {xl.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />

        {/* Current value dot */}
        {points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3}
            fill={color} stroke="#080b10" strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        )}
      </svg>
    </div>
  )
}

export default function StatsPage({ containers, vms }) {
  const [timeframe, setTimeframe] = useState('hour')
  const [nodeStats, setNodeStats] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState('node')
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (selectedTarget === 'node') {
        data = await getNodeStats(timeframe)
      } else {
        // Determine if it's a container or VM
        const isVM = vms.some(v => v.id.toString() === selectedTarget)
        if (isVM) {
          data = await getVMStats(selectedTarget, timeframe)
        } else {
          data = await getContainerStats(selectedTarget, timeframe)
        }
      }
      setNodeStats(Array.isArray(data) ? data : null)
    } catch (e) {
      console.error('[Stats]', e)
      setNodeStats(null)
    }
    setLoading(false)
  }, [timeframe, selectedTarget, vms])

  usePolling(loadStats, 30000, true)

  useEffect(() => {
    loadStats()
  }, [timeframe, selectedTarget])

  const allTargets = [
    { id: 'node', name: 'Node (prox)' },
    ...containers.map(c => ({ id: c.id.toString(), name: c.name })),
    ...vms.map(v => ({ id: v.id.toString(), name: v.name })),
  ]

  return (
    <div style={{ padding: '16px', paddingBottom: 90 }}>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Statistics</h2>

      {/* Target selector */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <select
          value={selectedTarget}
          onChange={e => setSelectedTarget(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
            appearance: 'none', outline: 'none', cursor: 'pointer',
          }}
        >
          {allTargets.map(t => (
            <option key={t.id} value={t.id} style={{ background: '#111318' }}>{t.name}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 12, pointerEvents: 'none' }}>▾</span>
      </div>

      {/* Timeframe tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
        {['hour', 'day', 'week'].map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)} style={{
            flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: timeframe === tf ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: timeframe === tf ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
          }}>{tf}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
          <div style={{
            width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#00aaff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          Loading stats...
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : nodeStats && nodeStats.length > 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
          <LineChart
            data={nodeStats}
            dataKey="cpu"
            color="#00aaff"
            label="CPU"
            unit="%"
            formatValue={v => `${Math.round(v * 100)}%`}
          />

          {nodeStats[0]?.maxmem ? (
            <LineChart
              data={nodeStats.map(d => ({ ...d, memPct: d.mem && d.maxmem ? (d.mem / d.maxmem) * 100 : 0 }))}
              dataKey="memPct"
              color="#aa44ff"
              label="Memory"
              unit="%"
            />
          ) : (
            <LineChart
              data={nodeStats.map(d => ({ ...d, memUsed: d.memused || d.mem || 0 }))}
              dataKey="memUsed"
              color="#aa44ff"
              label="Memory"
              unit=""
              formatValue={v => formatBytes(v)}
            />
          )}

          {(nodeStats[0]?.netin != null || nodeStats[0]?.netout != null) && (
            <>
              <LineChart
                data={nodeStats}
                dataKey="netin"
                color="#00ff88"
                label="Network In"
                unit=""
                formatValue={v => formatBytes(v) + '/s'}
              />
              <LineChart
                data={nodeStats}
                dataKey="netout"
                color="#ffaa00"
                label="Network Out"
                unit=""
                formatValue={v => formatBytes(v) + '/s'}
              />
            </>
          )}

          {(nodeStats[0]?.diskread != null || nodeStats[0]?.diskwrite != null) && (
            <>
              <LineChart
                data={nodeStats}
                dataKey="diskread"
                color="#00aaff"
                label="Disk Read"
                unit=""
                formatValue={v => formatBytes(v) + '/s'}
                height={100}
              />
              <LineChart
                data={nodeStats}
                dataKey="diskwrite"
                color="#ff4466"
                label="Disk Write"
                unit=""
                formatValue={v => formatBytes(v) + '/s'}
                height={100}
              />
            </>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '40px 20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            {selectedTarget === 'node' ? 'No node stats available' : 'No stats available for this target'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}>
            Stats require a connection to the Proxmox API
          </div>
        </div>
      )}
    </div>
  )
}
