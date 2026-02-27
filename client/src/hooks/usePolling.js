import { useEffect, useRef } from 'react'

export function usePolling(callback, interval = 5000, active = true) {
  const cbRef = useRef(callback)
  useEffect(() => { cbRef.current = callback }, [callback])

  useEffect(() => {
    if (!active) return
    cbRef.current()
    const id = setInterval(() => cbRef.current(), interval)
    return () => clearInterval(id)
  }, [interval, active])
}

export function usePageVisibility(callback) {
  useEffect(() => {
    const handle = () => callback(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [callback])
}
