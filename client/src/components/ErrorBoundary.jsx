import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[ProxDash] Uncaught error:', error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', background: '#080b10',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 20,
                }}>
                    <div style={{ textAlign: 'center', maxWidth: 320 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                            ProxDash encountered an unexpected error. Your Proxmox services are unaffected.
                        </p>
                        <pre style={{
                            background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)',
                            borderRadius: 10, padding: 12, marginBottom: 24, textAlign: 'left',
                            color: '#ff4466', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                            overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                width: '100%', padding: 14, borderRadius: 12,
                                background: '#00aaff', border: 'none', color: '#fff',
                                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Reload ProxDash
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
