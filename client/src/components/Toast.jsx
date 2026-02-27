import { useEffect } from 'react'

export default function Toast({ msg, onDone }) {
  useEffect(() => { 
    if (msg) {
      const t = setTimeout(onDone, 2500)
      return () => clearTimeout(t)
    }
  }, [msg, onDone])

  if (!msg) return null

  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)",
      backdropFilter: "blur(12px)", color: "#00ff88", padding: "10px 20px",
      borderRadius: 99, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
      zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 0 24px rgba(0,255,136,0.15)"
    }}>{msg}</div>
  )
}
