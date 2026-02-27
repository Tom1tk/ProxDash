export default function ArcGauge({ value, max = 100, color, label, unit = "%" }) {
  const pct = Math.min(value / max, 1)
  const r = 28, cx = 36, cy = 38
  const startAngle = -210, sweep = 240
  const toRad = (d) => (d * Math.PI) / 180
  const arc = (angle) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  })
  const endAngle = startAngle + sweep * pct
  const s = arc(startAngle), e = arc(endAngle), bg2 = arc(startAngle + sweep)
  const largeArc = sweep * pct > 180 ? 1 : 0
  const largeBg = sweep > 180 ? 1 : 0

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
  )
}
