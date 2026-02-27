import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function Terminal({ target, onClose }) {
  const divRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const term = new XTerm({
      theme: { background: '#080b10', foreground: '#e0e0e0' },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(divRef.current)
    fitAddon.fit()
    termRef.current = term

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/terminal?target=${target}`)
    wsRef.current = ws

    ws.onopen = () => {
      term.onData(data => ws.readyState === 1 && ws.send(data))
      term.onResize(({ cols, rows }) => {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
      })
    }
    ws.onmessage = e => term.write(e.data)
    ws.onclose = () => term.write('\r\n\x1b[33mDisconnected\x1b[0m\r\n')

    const ro = new ResizeObserver(() => fitAddon.fit())
    ro.observe(divRef.current)

    return () => {
      term.dispose()
      ws.close()
      ro.disconnect()
    }
  }, [target])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '60vh', background: '#080b10',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      zIndex: 100, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
          terminal — {target}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4466', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      <div ref={divRef} style={{ flex: 1, overflow: 'hidden', padding: 4 }} />
    </div>
  )
}
