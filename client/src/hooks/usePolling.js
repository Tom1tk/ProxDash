import { useEffect, useRef } from 'react'

export function usePolling(callback, interval = 5000, active = true) {
  const cbRef = useRef(callback)
  useEffect(() => { cbRef.current = callback }, [callback])

  // Guard against NaN/invalid intervals (e.g. undefined * 1000)
  const safeInterval = (!interval || isNaN(interval) || interval < 1000) ? 5000 : interval

  useEffect(() => {
    if (!active) return
    cbRef.current()
    const id = setInterval(() => cbRef.current(), safeInterval)
    return () => clearInterval(id)
  }, [safeInterval, active])
}

export function usePageVisibility(callback) {
  useEffect(() => {
    const handle = () => callback(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [callback])
}
