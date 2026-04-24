import { useEffect, useRef, useState, useCallback } from 'react'


export default function useIdleTimeout({
  enabled = true,
  timeoutMs = 30 * 60 * 1000,    
  warningMs = 2 * 60 * 1000,    
  onTimeout,
} = {}) {
  const [warning, setWarning]     = useState(false)
  const [secondsLeft, setSecs]    = useState(Math.floor(warningMs / 1000))
  const lastActivityRef           = useRef(Date.now())
  const tickRef                   = useRef(null)
  const firedRef                  = useRef(false)

  
  const reset = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityRef.current < 1000) return
    lastActivityRef.current = now
    if (warning) setWarning(false)
  }, [warning])

  function stayLoggedIn() {
    lastActivityRef.current = Date.now()
    setWarning(false)
    firedRef.current = false
  }

  useEffect(() => {
    if (!enabled) return

    function onActivity() { reset() }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true })

    
    tickRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= timeoutMs) {
        if (!firedRef.current) {
          firedRef.current = true
          setWarning(false)
          try { onTimeout?.() } catch (e) { console.error('[useIdleTimeout] onTimeout threw:', e) }
        }
        return
      }
      if (idle >= timeoutMs - warningMs) {
        setWarning(true)
        setSecs(Math.max(0, Math.floor((timeoutMs - idle) / 1000)))
      } else if (warning) {
        setWarning(false)
      }
    }, 1000)

    return () => {
      for (const ev of events) window.removeEventListener(ev, onActivity)
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [enabled, timeoutMs, warningMs, onTimeout, reset, warning])

  return { warning, secondsLeft, stayLoggedIn }
}
