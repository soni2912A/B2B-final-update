import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../utils/api.js'
import { showToast } from './index.jsx'


export default function GoogleSyncRowAction({ occasion, basePath, onSynced }) {
  const [status, setStatus] = useState(null)   // { configured, connected }
  const [syncing, setSyncing] = useState(false)

 
  useEffect(() => {
    let cancelled = false
    getSharedStatus().then(s => { if (!cancelled) setStatus(s) })
    return () => { cancelled = true }
  }, [])

  if (!status) return null
  if (!status.configured) return null   // feature hidden server-side

  const synced = !!occasion.googleEventId

  async function sync() {
    if (!status.connected) {
      showToast('Connect your Google account from Settings first.', 'info')
      return
    }
    setSyncing(true)
    try {
      const res = await apiFetch('POST', `${basePath}/${occasion._id}/sync-to-google`)
      const patch = res.data?.occasion || {}
      showToast('Added to your Google Calendar.')
      onSynced?.(patch)
    } catch (err) {
      showToast(err.message || 'Could not sync occasion.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  if (synced) {
    return (
      <div className="mt-1 flex items-center gap-2 text-[11px] text-green-700">
        <span>✓ On your Google Calendar</span>
        {occasion.googleEventLink && (
          <a
            href={occasion.googleEventLink}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            View →
          </a>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={sync}
      disabled={syncing}
      className="mt-1 text-[11px] text-accent hover:underline disabled:opacity-60 disabled:cursor-wait"
    >
      {syncing ? 'Syncing…' : '📅 Add to Google Calendar'}
    </button>
  )
}


let _statusPromise = null
function getSharedStatus() {
  if (_statusPromise) return _statusPromise
  _statusPromise = apiFetch('GET', '/auth/google/status')
    .then(res => res.data || { configured: false, connected: false })
    .catch(() => ({ configured: false, connected: false }))
  return _statusPromise
}


export function resetGoogleStatusCache() {
  _statusPromise = null
}
