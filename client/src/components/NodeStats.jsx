import ArcGauge from './ArcGauge'

export default function NodeStats({ node }) {
  if (!node) return null

  return (
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
      <ArcGauge value={node.disk} color="#ffaa00" label="DISK" />
    </div>
  )
}
