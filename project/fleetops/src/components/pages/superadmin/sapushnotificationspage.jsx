import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate } from '../../../utils/api.js'
import {
  Card, PageHeader, TableWrap, Btn, Loading, Modal, FormGroup, Input, Select,
} from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

const AUDIENCE_OPTIONS = [
  { v: 'all',       l: '📢 All Users',       desc: 'Admins, Corporates & Staff' },
  { v: 'admin',     l: '🔧 Admins Only',      desc: 'Business admin accounts' },
  { v: 'corporate', l: '🏢 Corporates Only',  desc: 'Corporate user accounts' },
  { v: 'staff',     l: '👷 Staff Only',       desc: 'Staff / delivery users' },
]

const AUDIENCE_BADGE = {
  all:       { color: 'bg-purple-100 text-purple-800',  label: 'All Users' },
  admin:     { color: 'bg-blue-100 text-blue-800',      label: 'Admins' },
  corporate: { color: 'bg-green-100 text-green-800',    label: 'Corporates' },
  staff:     { color: 'bg-orange-100 text-orange-800',  label: 'Staff' },
}

export function SAPushNotificationsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/super-admin/push-notifications')
      setList(res.data?.notifications || [])
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function del(id) {
    if (!window.confirm('Delete this notification log?')) return
    try {
      await apiFetch('DELETE', `/super-admin/push-notifications/${id}`)
      showToast('Deleted.')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  const totalSent = list.reduce((s, n) => s + (n.sentCount || 0), 0)

  return (
    <div>
      <PageHeader title="Push Notifications" subtitle="Send in-app notifications to users on the platform">
        <Btn variant="primary" onClick={() => setShowCompose(true)}>🔔 Send Notification</Btn>
      </PageHeader>

      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-[13px] text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <strong>How it works:</strong> Notifications you send here will appear instantly in the 🔔 bell icon for the selected audience. Users see them just like order or system notifications.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center gap-3 !p-4">
          <span className="text-3xl">📨</span>
          <div>
            <div className="text-2xl font-bold text-text1">{list.length}</div>
            <div className="text-xs text-text2">Notifications Sent</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !p-4">
          <span className="text-3xl">👥</span>
          <div>
            <div className="text-2xl font-bold text-text1">{totalSent}</div>
            <div className="text-xs text-text2">Total Deliveries</div>
          </div>
        </Card>
      </div>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Audience</th>
                <th>Sent To</th>
                <th>Sent By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text2 text-sm">
                  <div className="text-3xl mb-2">🔔</div>
                  No notifications sent yet. Click "Send Notification" to get started.
                </td></tr>
              ) : list.map(n => {
                const badge = AUDIENCE_BADGE[n.audience] || AUDIENCE_BADGE.all
                return (
                  <tr key={n._id}>
                    <td className="font-medium">{n.title}</td>
                    <td className="text-text2 text-[12px] max-w-xs truncate">{n.message}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold text-emerald-600">{n.sentCount}</span>
                      <span className="text-text3 text-[11px] ml-1">users</span>
                    </td>
                    <td className="text-text2 text-sm">{n.createdBy?.name || '—'}</td>
                    <td className="text-text2 text-sm">{formatDate(n.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => del(n._id)}
                        className="text-[12px] text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); load() }}
        />
      )}
    </div>
  )
}

function ComposeModal({ onClose, onSent }) {
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { sentCount }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function send() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.message.trim()) { setError('Message is required.'); return }
    setSending(true); setError('')
    try {
      const res = await apiFetch('POST', '/super-admin/push-notifications', {
        title:    form.title.trim(),
        message:  form.message.trim(),
        audience: form.audience,
      })
      setPreview({ sentCount: res.data?.sentCount || 0 })
    } catch (err) { setError(err.message); setSending(false) }
  }

  if (preview) {
    return (
      <Modal
        title="✅ Notification Sent!"
        onClose={onSent}
        actions={[{ label: 'Done', primary: true, onClick: onSent }]}
      >
        <div className="text-center py-6">
          <div className="text-5xl mb-4">🎉</div>
          <div className="text-2xl font-bold text-text1 mb-2">{preview.sentCount}</div>
          <div className="text-sm text-text2">users received your notification in their bell icon</div>
          <div className="mt-4 p-3 rounded-lg bg-surface2 border border-border text-left">
            <div className="text-[11px] text-text3 uppercase tracking-wider font-medium mb-1">Sent</div>
            <div className="font-semibold text-text1 text-sm">{form.title}</div>
            <div className="text-text2 text-[12px] mt-1">{form.message}</div>
          </div>
        </div>
      </Modal>
    )
  }

  const selectedAudience = AUDIENCE_OPTIONS.find(o => o.v === form.audience)

  return (
    <Modal
      title="🔔 Send Push Notification"
      onClose={onClose}
      actions={[
        { label: sending ? 'Sending…' : '📤 Send Now', primary: true, onClick: send, disabled: sending },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <FormGroup label="Notification Title">
        <Input
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Platform Maintenance Tonight"
          autoFocus
        />
      </FormGroup>

      <FormGroup label="Message">
        <textarea
          value={form.message}
          onChange={set('message')}
          placeholder="Write your notification message here…"
          rows={3}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-[13px] text-text1 outline-none focus:border-accent resize-none"
        />
      </FormGroup>

      <FormGroup label="Send To">
        <div className="grid grid-cols-2 gap-2 mt-1">
          {AUDIENCE_OPTIONS.map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setForm(f => ({ ...f, audience: opt.v }))}
              className={`
                text-left p-3 rounded-lg border text-[12px] transition-all
                ${form.audience === opt.v
                  ? 'border-accent bg-accent/10 text-text1'
                  : 'border-border bg-surface text-text2 hover:border-text3'}
              `}
            >
              <div className="font-medium mb-0.5">{opt.l}</div>
              <div className="text-[11px] opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
      </FormGroup>

      {/* Preview */}
      {(form.title || form.message) && (
        <div className="mt-4 p-3 rounded-lg border border-border bg-surface2 text-[12px]">
          <div className="text-text3 text-[11px] uppercase tracking-wider font-medium mb-2">Preview — as seen in bell icon</div>
          <div className="flex gap-3 items-start">
            <span className="text-xl flex-shrink-0 mt-0.5">🔔</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-text1 text-[13px]">{form.title || 'Notification Title'}</div>
              <div className="text-text2 text-[12px] mt-0.5">{form.message || 'Your message…'}</div>
              <div className="mt-1.5 text-[10px] text-text3">Just now · {selectedAudience?.l}</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}