export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', background: '#111318', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontFamily: 'Sora' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.4)', color: '#ff4466', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
