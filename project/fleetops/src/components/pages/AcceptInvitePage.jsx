import React, { useState, useEffect } from 'react'
import { apiFetch } from '../../utils/api.js'
import { useApp } from '../../AppContext.jsx'
import { Btn, FormGroup, Input, showToast } from '../ui/index.jsx'
import PasswordStrength from '../ui/PasswordStrength.jsx'

function readQuery() {
  const p = new URLSearchParams(window.location.search)
  return { token: p.get('token') || '', email: p.get('email') || '' }
}

export default function AcceptInvitePage() {
  const { login } = useApp()
  const [{ token, email }] = useState(readQuery)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!token) setError('This invite link is missing a token. Ask the inviter for a new one.')
  }, [token])

  async function submit(e) {
    e && e.preventDefault && e.preventDefault()
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)             { setError('Passwords do not match.'); return }
    setSaving(true); setError('')
    try {
      const res = await apiFetch('POST', '/auth/accept-invite', { token, password, confirmPassword: confirm })
      const newToken = res.data?.token
      const user     = res.data?.user
      if (!newToken || !user) throw new Error('Unexpected response.')
      window.history.replaceState({}, '', '/')
      setDone(true)
      showToast('Welcome — your account is active.')
      login(newToken, user)
    } catch (err) {
      setError(err.message || 'Could not accept invite.')
      setSaving(false)
    }
  }

  if (done) return null

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-card p-7">
        <div className="text-[20px] font-semibold mb-1">Set Your Password</div>
        <div className="text-[13px] text-text2 mb-5">
          {email
            ? <>Complete setup for <span className="font-medium">{email}</span>.</>
            : 'Complete setup for your new account.'}
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>
        )}

        <form onSubmit={submit}>
          <FormGroup label="New Password">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" disabled={!token || saving} />
            <PasswordStrength password={password} />
          </FormGroup>
          <FormGroup label="Confirm Password">
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" disabled={!token || saving} />
          </FormGroup>
          <Btn type="submit" variant="primary" onClick={submit} disabled={!token || saving}>
            {saving ? 'Activating…' : 'Activate Account'}
          </Btn>
        </form>
      </div>
    </div>
  )
}
