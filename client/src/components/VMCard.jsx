import { useState } from 'react'

const statusColor = (s) => s === "running" ? "#00ff88" : s === "stopped" ? "#ff4466" : "#ffaa00"
const statusBg = (s) => s === "running" ? "rgba(0,255,136,0.08)" : s === "stopped" ? "rgba(255,68,102,0.08)" : "rgba(255,170,0,0.08)"

const btnStyle = (color, active) => ({
  flex: 1, padding: "8px 4px", borderRadius: 8,
  background: active ? color + "22" : "rgba(255,255,255,0.04)",
  border: "1px solid " + (active ? color + "66" : "rgba(255,255,255,0.08)"),
  color: active ? color : "rgba(255,255,255,0.6)",
  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
  cursor: "pointer", transition: "all 0.15s", fontWeight: 600,
  outline: "none",
})

export default function VMCard({ vm, onAction, onConsole }) {
  const [loading, setLoading] = useState(null)
  const isRunning = vm.status === "running"

  const handleAction = (action) => {
    setLoading(action)
    setTimeout(() => { setLoading(null); onAction(vm, action) }, 1000)
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: statusBg(vm.status),
            border: "1px solid " + statusColor(vm.status) + "33",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15
          }}>
            🖥
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{vm.name}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>VM {vm.id}</div>
          </div>
        </div>
        <div style={{
          background: statusBg(vm.status),
          border: "1px solid " + statusColor(vm.status) + "44",
          color: statusColor(vm.status),
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          padding: "3px 9px", borderRadius: 99, fontWeight: 700, letterSpacing: 0.5,
          textTransform: "uppercase"
        }}>{vm.status}</div>
      </div>

      {isRunning && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>CPU</span>
              <span style={{ color: "#fff", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{vm.cpu}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ width: vm.cpu + "%", height: "100%", background: vm.cpu > 70 ? "#ff4466" : "#00aaff", borderRadius: 99, transition: "width 0.5s", boxShadow: "0 0 6px " + (vm.cpu > 70 ? "#ff4466" : "#00aaff") }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>MEM</span>
              <span style={{ color: "#fff", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{vm.mem}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ width: vm.mem + "%", height: "100%", background: vm.mem > 80 ? "#ffaa00" : "#aa44ff", borderRadius: 99, transition: "width 0.5s", boxShadow: "0 0 6px " + (vm.mem > 80 ? "#ffaa00" : "#aa44ff") }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {isRunning ? (
          <>
            <button onClick={() => handleAction("restart")} disabled={!!loading} style={btnStyle("#ffaa00", loading === "restart")}>
              {loading === "restart" ? "···" : "↺ Restart"}
            </button>
            <button onClick={() => handleAction("stop")} disabled={!!loading} style={btnStyle("#ff4466", loading === "stop")}>
              {loading === "stop" ? "···" : "■ Stop"}
            </button>
            <button onClick={() => onConsole(vm, 'console')} style={btnStyle("#00aaff", false)}>
              ⌨ Console
            </button>
          </>
        ) : (
          <button onClick={() => handleAction("start")} disabled={!!loading} style={{ ...btnStyle("#00ff88", loading === "start"), flex: 1 }}>
            {loading === "start" ? "Starting···" : "▶ Start"}
          </button>
        )}
      </div>
    </div>
  )
}
