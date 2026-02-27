export default function BottomNav({ activeTab, onTabChange, alertCount = 0 }) {
  const tabs = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'stats', icon: '📊', label: 'Stats' },
    { key: 'alerts', icon: '🔔', label: 'Alerts', badge: alertCount },
    { key: 'config', icon: '⚙️', label: 'Config' },
  ]

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(8,11,16,0.95)", backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", padding: "10px 0 20px",
    }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onTabChange(tab.key)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          color: activeTab === tab.key ? "#00aaff" : "rgba(255,255,255,0.3)",
          position: "relative",
        }}>
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.badge > 0 && (
            <span style={{ position: 'absolute', top: -2, right: '50%', marginRight: -8, background: '#ff4466', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 99, fontFamily: 'JetBrains Mono' }}>{tab.badge}</span>
          )}
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
