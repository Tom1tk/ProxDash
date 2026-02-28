import { useState, useEffect } from 'react'
import { login, checkAuth } from './api'
import MainDash from './components/MainDash'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth().then(ok => {
      setAuthed(ok)
      setChecking(false)
    }).catch(() => {
      setChecking(false)
    })
  }, [])

  async function handlePin(e) {
    e.preventDefault()
    const res = await login(pin)
    if (res.token) {
      localStorage.setItem('proxdash_token', res.token)
      setAuthed(true)
    } else {
      setError('Invalid PIN')
    }
  }

  if (checking) return null

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080b10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}>
        <form onSubmit={handlePin} style={{ width: '100%', maxWidth: 280 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>ProxDash</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 32 }}>Enter PIN to continue</p>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" autoFocus
            style={{ width: '100%', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 18, textAlign: 'center', letterSpacing: 8,
              fontFamily: 'JetBrains Mono', outline: 'none' }} />
          {error && <p style={{ color: '#ff4466', fontSize: 12, textAlign: 'center', marginTop: 12 }}>{error}</p>}
          <button type="submit" style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 12, 
            background: '#00aaff', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Unlock
          </button>
        </form>
      </div>
    )
  }

  return <MainDash />
}
