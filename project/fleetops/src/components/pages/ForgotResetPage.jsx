import React, { useState } from 'react'
import { apiFetch, API_BASE } from '../../utils/api.js'
import { useApp } from '../../AppContext.jsx'
import { Btn, FormGroup, Input, showToast } from '../ui/index.jsx'
import PasswordStrength from '../ui/PasswordStrength.jsx'

function readResetToken() {
  if (typeof window === 'undefined') return ''
  const m = window.location.pathname.match(/\/reset-password\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export function ForgotPasswordPage() {
  const { showLogin } = useApp()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e && e.preventDefault && e.preventDefault()
    if (!email) { setError('Enter your account email.'); return }
    setError(''); setSending(true)
    try {
      await apiFetch('POST', '/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-card p-7">
        <div className="text-[20px] font-semibold mb-1">Forgot password</div>
        <div className="text-[13px] text-text2 mb-5">
          Enter your account email and we'll send you a reset link. The link expires in 10 minutes.
        </div>

        {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

        {sent ? (
          <div className="p-3 rounded border border-green-200 bg-green-50 text-green-800 text-[13px]">
            If an account exists for <b>{email}</b>, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={submit}>
            <FormGroup label="Email address">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={sending} required />
            </FormGroup>
            <Btn type="submit" variant="primary" onClick={submit} disabled={sending}>
              {sending ? 'Sending…' : 'Send reset link'}
            </Btn>
          </form>
        )}

        <div className="mt-5 text-[13px] text-text2">
          <button type="button" className="text-accent hover:underline" onClick={showLogin}>← Back to sign in</button>
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const { login, showLogin } = useApp()
  const [token] = useState(readResetToken)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e && e.preventDefault && e.preventDefault()
    if (!token) { setError('Reset link is missing a token.'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setSaving(true)
    try {
      const res = await fetch(API_BASE + '/auth/reset-password/' + encodeURIComponent(token), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword: confirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not reset password.')

      const newToken = data.data?.token
      if (newToken && data.data?.user) {
        window.history.replaceState({}, '', '/')
        showToast('Password reset — you are signed in.')
        login(newToken, data.data.user)
      } else {
        window.history.replaceState({}, '', '/')
        showToast('Password reset. Please sign in.')
        showLogin()
      }
    } catch (err) {
      setError(err.message || 'Could not reset password.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-card p-7">
        <div className="text-[20px] font-semibold mb-1">Set a new password</div>
        <div className="text-[13px] text-text2 mb-5">
          Choose a strong password — at least 6 characters.
        </div>

        {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

        <form onSubmit={submit}>
          <FormGroup label="New password">
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" disabled={!token || saving} />
            <PasswordStrength password={password} />
          </FormGroup>
          <FormGroup label="Confirm password">
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" disabled={!token || saving} />
          </FormGroup>
          <Btn type="submit" variant="primary" onClick={submit} disabled={!token || saving}>
            {saving ? 'Saving…' : 'Reset password'}
          </Btn>
        </form>

        <div className="mt-5 text-[13px] text-text2">
          <button type="button" className="text-accent hover:underline" onClick={() => { window.history.replaceState({}, '', '/'); showLogin() }}>← Back to sign in</button>
        </div>
      </div>
    </div>
  )
}
