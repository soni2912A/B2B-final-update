import React, { useState, useEffect, useContext } from 'react'
import { apiFetch } from '../../utils/api.js'

export default function AnnouncementBanner({ user }) {
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]') } catch { return [] }
  })
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Only fetch when we have an authenticated user
    if (!user) return

    let cancelled = false
    apiFetch('GET', '/announcements/me')
      .then(res => {
        if (cancelled) return
        const list = (res.data?.announcements || []).filter(a => !a.isRead)
        setAnnouncements(list)
      })
      .catch(() => {}) // silently ignore — banner is non-critical

    return () => { cancelled = true }
  }, [user?._id]) // re-fetch when user changes

  const visible = announcements.filter(a => !dismissed.includes(a._id))
  if (visible.length === 0) return null

  const ann = visible[Math.min(current, visible.length - 1)]

  function dismiss(id) {
    apiFetch('PATCH', `/announcements/${id}/read`).catch(() => {})
    const next = [...dismissed, id]
    setDismissed(next)
    try { localStorage.setItem('dismissed_announcements', JSON.stringify(next)) } catch {}
    setCurrent(0)
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg,rgba(255,138,92,.15),rgba(165,107,255,.15))',
      borderBottom: '1px solid rgba(165,107,255,.25)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
    }}>
      <span style={{ fontSize: 16 }}>📣</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1, #efe9ff)', marginRight: 8 }}>
          {ann.title}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text2, #b8b0d6)', wordBreak: 'break-word' }}>
          {ann.message}
        </span>
      </div>
      {visible.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            style={{ background: 'none', border: 'none', cursor: current === 0 ? 'not-allowed' : 'pointer', color: 'var(--text2,#b8b0d6)', fontSize: 14, opacity: current === 0 ? 0.4 : 1 }}
          >‹</button>
          <span style={{ fontSize: 11, color: 'var(--text2,#b8b0d6)' }}>{current + 1}/{visible.length}</span>
          <button
            onClick={() => setCurrent(c => Math.min(visible.length - 1, c + 1))}
            disabled={current === visible.length - 1}
            style={{ background: 'none', border: 'none', cursor: current === visible.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text2,#b8b0d6)', fontSize: 14, opacity: current === visible.length - 1 ? 0.4 : 1 }}
          >›</button>
        </div>
      )}
      <button
        onClick={() => dismiss(ann._id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text2,#b8b0d6)', fontSize: 16, padding: '2px 6px',
          borderRadius: 6, flexShrink: 0,
        }}
        title="Dismiss"
      >✕</button>
    </div>
  )
}