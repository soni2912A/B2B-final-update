import { useEffect, useRef, useState, useCallback } from 'react'

// Idle-timeout hook. After `timeoutMs` of inactivity, calls `onTimeout`.
// `warningMs` before that, exposes `warning=true` so the UI can surface a
// countdown modal with a "stay logged in" option.
//
// Activity signals: mousemove, mousedown, keydown, scroll, touchstart.
// The hook debounces aggressively (1s) — we don't need millisecond accuracy,
// and this avoids resetting timers on every single mouse event.
//
// Returns:
//   { warning, secondsLeft, stayLoggedIn }
//
// `stayLoggedIn()` explicitly dismisses the warning and resets both timers.
// The caller should no-op the hook by passing `enabled=false` (e.g. logged-out
// users) — the hook still renders but doesn't attach listeners.
export default function useIdleTimeout({
  enabled = true,
  timeoutMs = 30 * 60 * 1000,    // 30 min default
  warningMs = 2 * 60 * 1000,     // 2 min before timeout
  onTimeout,
} = {}) {
  const [warning, setWarning]     = useState(false)
  const [secondsLeft, setSecs]    = useState(Math.floor(warningMs / 1000))
  const lastActivityRef           = useRef(Date.now())
  const tickRef                   = useRef(null)
  const firedRef                  = useRef(false)

  // Reset called on user activity. Kills the warning state and restarts the
  // countdown. Throttled to once per second to avoid useState spam.
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

    // 1-second tick: check idle duration, toggle warning, fire timeout.
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
