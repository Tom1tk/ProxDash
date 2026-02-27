export default function Header({ node, running, total, now }) {
  const formatUptime = (seconds) => {
    if (!seconds) return '—'
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div style={{ padding: "20px 20px 16px", position: "sticky", top: 0, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(20px)", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>{node?.name || 'prox'}</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{node?.ip || '192.168.68.10'}</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>
            {running}/{total} running · up {formatUptime(node?.uptime)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </div>
        </div>
      </div>
    </div>
  )
}
