import { useState, useEffect } from "react";

const mockNodes = [
  {
    id: "prox",
    name: "prox",
    status: "online",
    cpu: 18,
    mem: 62,
    uptime: "14d 6h 22m",
    ip: "192.168.68.10",
  },
];

const mockContainers = [
  { id: 100, name: "media-server", type: "lxc", status: "running", cpu: 4, mem: 8, ip: "192.168.68.11", template: "ubuntu-22.04" },
  { id: 101, name: "openclaw", type: "lxc", status: "running", cpu: 22, mem: 31, ip: "192.168.68.12", template: "debian-12" },
  { id: 102, name: "opencode", type: "lxc", status: "running", cpu: 11, mem: 19, ip: "192.168.68.13", template: "debian-12" },
  { id: 103, name: "web-tracker", type: "lxc", status: "stopped", cpu: 0, mem: 0, ip: "192.168.68.14", template: "ubuntu-22.04" },
  { id: 104, name: "pihole", type: "lxc", status: "running", cpu: 2, mem: 6, ip: "192.168.68.15", template: "debian-12" },
];

const statusColor = (s) => s === "running" ? "#00ff88" : s === "stopped" ? "#ff4466" : "#ffaa00";
const statusBg = (s) => s === "running" ? "rgba(0,255,136,0.08)" : s === "stopped" ? "rgba(255,68,102,0.08)" : "rgba(255,170,0,0.08)";

function ArcGauge({ value, max = 100, color, label, unit = "%" }) {
  const pct = Math.min(value / max, 1);
  const r = 28, cx = 36, cy = 38;
  const startAngle = -210, sweep = 240;
  const toRad = (d) => (d * Math.PI) / 180;
  const arc = (angle) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });
  const endAngle = startAngle + sweep * pct;
  const s = arc(startAngle), e = arc(endAngle), bg2 = arc(startAngle + sweep);
  const largeArc = sweep * pct > 180 ? 1 : 0;
  const largeBg = sweep > 180 ? 1 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={72} height={60} viewBox="0 0 72 60">
        <path
          d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeBg} 1 ${bg2.x} ${bg2.y}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`}
            fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: "#fff", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
          {Math.round(value)}{unit}
        </text>
      </svg>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)",
      backdropFilter: "blur(12px)", color: "#00ff88", padding: "10px 20px",
      borderRadius: 99, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
      zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 0 24px rgba(0,255,136,0.15)"
    }}>{msg}</div>
  );
}

function ContainerCard({ ct, onAction }) {
  const [loading, setLoading] = useState(null);
  const isRunning = ct.status === "running";

  const handleAction = (action) => {
    setLoading(action);
    setTimeout(() => { setLoading(null); onAction(ct, action); }, 1000);
  };

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
            background: statusBg(ct.status),
            border: `1px solid ${statusColor(ct.status)}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15
          }}>
            {ct.type === "lxc" ? "📦" : "🖥"}
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{ct.name}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>CT {ct.id} · {ct.ip}</div>
          </div>
        </div>
        <div style={{
          background: statusBg(ct.status),
          border: `1px solid ${statusColor(ct.status)}44`,
          color: statusColor(ct.status),
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          padding: "3px 9px", borderRadius: 99, fontWeight: 700, letterSpacing: 0.5,
          textTransform: "uppercase"
        }}>{ct.status}</div>
      </div>

      {isRunning && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>CPU</span>
              <span style={{ color: "#fff", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{ct.cpu}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ width: `${ct.cpu}%`, height: "100%", background: ct.cpu > 70 ? "#ff4466" : "#00aaff", borderRadius: 99, transition: "width 0.5s", boxShadow: `0 0 6px ${ct.cpu > 70 ? "#ff4466" : "#00aaff"}` }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>MEM</span>
              <span style={{ color: "#fff", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{ct.mem}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
              <div style={{ width: `${ct.mem}%`, height: "100%", background: ct.mem > 80 ? "#ffaa00" : "#aa44ff", borderRadius: 99, transition: "width 0.5s", boxShadow: `0 0 6px ${ct.mem > 80 ? "#ffaa00" : "#aa44ff"}` }} />
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
            <button onClick={() => handleAction("console")} style={btnStyle("#00aaff", false)}>
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
  );
}

const btnStyle = (color, active) => ({
  flex: 1, padding: "8px 4px", borderRadius: 8,
  background: active ? `${color}22` : "rgba(255,255,255,0.04)",
  border: `1px solid ${active ? color + "66" : "rgba(255,255,255,0.08)"}`,
  color: active ? color : "rgba(255,255,255,0.6)",
  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
  cursor: "pointer", transition: "all 0.15s", fontWeight: 600,
  outline: "none",
});

export default function ProxmoxDash() {
  const [containers, setContainers] = useState(mockContainers);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("containers");
  const [node] = useState(mockNodes[0]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);

  const handleAction = (ct, action) => {
    if (action === "start") {
      setContainers(cs => cs.map(c => c.id === ct.id ? { ...c, status: "running", cpu: 5, mem: 12 } : c));
      setToast(`▶ ${ct.name} started`);
    } else if (action === "stop") {
      setContainers(cs => cs.map(c => c.id === ct.id ? { ...c, status: "stopped", cpu: 0, mem: 0 } : c));
      setToast(`■ ${ct.name} stopped`);
    } else if (action === "restart") {
      setToast(`↺ ${ct.name} restarting…`);
    } else if (action === "console") {
      setToast(`⌨ Opening ${ct.name} console…`);
    }
  };

  const running = containers.filter(c => c.status === "running").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Sora:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080b10; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#080b10",
        fontFamily: "'Sora', sans-serif",
        maxWidth: 430, margin: "0 auto",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,170,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: 0, left: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(170,68,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ padding: "20px 20px 16px", position: "sticky", top: 0, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(20px)", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
                <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>prox</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>192.168.68.10</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>
                {running}/{containers.length} running · up {node.uptime}
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

        <div style={{ padding: "16px 16px 90px" }}>

          {/* Node stats */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "16px 20px",
            marginBottom: 16,
            display: "flex", justifyContent: "space-around", alignItems: "center",
          }}>
            <ArcGauge value={node.cpu} color="#00aaff" label="CPU" />
            <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.06)" }} />
            <ArcGauge value={node.mem} color="#aa44ff" label="MEM" />
            <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.06)" }} />
            <ArcGauge value={38} color="#ffaa00" label="DISK" />
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
            {[["containers", "📦 Containers"], ["vms", "🖥 VMs"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                background: tab === key ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === key ? "#fff" : "rgba(255,255,255,0.35)",
                fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {/* Container list */}
          {tab === "containers" && (
            <div>
              {containers.map(ct => (
                <ContainerCard key={ct.id} ct={ct} onAction={handleAction} />
              ))}
            </div>
          )}
          {tab === "vms" && (
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "40px 20px", textAlign: "center"
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🖥</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>No VMs configured</div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: "rgba(8,11,16,0.95)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", padding: "10px 0 20px",
        }}>
          {[["🏠", "Home"], ["📊", "Stats"], ["🔔", "Alerts"], ["⚙️", "Config"]].map(([icon, label]) => (
            <button key={label} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: label === "Home" ? "#00aaff" : "rgba(255,255,255,0.3)",
            }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
            </button>
          ))}
        </div>

        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
