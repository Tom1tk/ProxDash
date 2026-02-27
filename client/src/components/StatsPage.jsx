import { useState, useEffect } from 'react'
import { getNodeStats, getContainerStats, getVMStats } from '../api'
import { usePolling } from '../hooks/usePolling'

export default function StatsPage({ containers, vms }) {
  const [timeframe, setTimeframe] = useState('hour')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getNodeStats(timeframe)
      setStats(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  usePolling(loadStats, 30000, true)

  useEffect(() => {
    loadStats()
  }, [timeframe])

  return (
    <div style={{ padding: '16px', paddingBottom: 90 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Statistics</h2>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
          {['hour', 'day', 'week'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: timeframe === tf ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: timeframe === tf ? '#fff' : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            }}>{tf}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading stats...</div>
      ) : stats ? (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>Node Statistics</div>
          <div style={{ color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
            {Array.isArray(stats) ? `${stats.length} data points` : 'No data available'}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No stats available</div>
      )}
    </div>
  )
}
