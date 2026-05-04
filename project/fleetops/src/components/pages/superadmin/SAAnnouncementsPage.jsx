import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate } from '../../../utils/api.js'
import {
  Badge, Card, PageHeader, TableWrap, TblAction, Btn, Loading,
  Modal, FormGroup, Input, Select,
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

export function SAAnnouncementsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/super-admin/announcements')
      setList(res.data?.announcements || [])
    } catch (err) {
      showToast(err.message || 'Failed to load announcements.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function del(id, title) {
    if (!window.confirm(`Delete announcement "${title}"?`)) return
    try {
      await apiFetch('DELETE', `/super-admin/announcements/${id}`)
      showToast('Announcement deleted.')
      load()
    } catch (err) {
      showToast(err.message || 'Could not delete.', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Send targeted messages to admins, corporates, or staff">
        <Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Announcement</Btn>
      </PageHeader>

      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-lg border border-purple-200 bg-purple-50 text-[13px] text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200">
        <strong>How it works:</strong> Announcements appear as a banner at the top of the dashboard for the selected audience. Users can dismiss them individually.
      </div>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Audience</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text2 text-sm">
                    <div className="text-3xl mb-2">📣</div>
                    No announcements yet. Create one to notify your users.
                  </td>
                </tr>
              ) : list.map(a => {
                const badge = AUDIENCE_BADGE[a.audience] || AUDIENCE_BADGE.all
                return (
                  <tr key={a._id}>
                    <td className="font-medium">{a.title}</td>
                    <td className="text-text2 text-[12px] max-w-xs truncate">{a.message}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="text-text2 text-[12px]">{formatDate(a.createdAt)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <TblAction onClick={() => setEditing(a)}>Edit</TblAction>
                        <TblAction variant="danger" onClick={() => del(a._id, a.title)}>Delete</TblAction>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showCreate && (
        <AnnouncementModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}

      {editing && (
        <AnnouncementModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function AnnouncementModal({ mode = 'create', initial = null, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:    initial?.title    || '',
    message:  initial?.message  || '',
    audience: initial?.audience || 'all',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selected = AUDIENCE_OPTIONS.find(o => o.v === form.audience)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.message.trim()) { setError('Message is required.'); return }
    setSaving(true); setError('')
    try {
      if (mode === 'create') {
        await apiFetch('POST', '/super-admin/announcements', {
          title: form.title.trim(),
          message: form.message.trim(),
          audience: form.audience,
        })
        showToast('Announcement created and sent!')
      } else {
        await apiFetch('PATCH', `/super-admin/announcements/${initial._id}`, {
          title: form.title.trim(),
          message: form.message.trim(),
          audience: form.audience,
        })
        showToast('Announcement updated.')
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not save.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={mode === 'create' ? 'New Announcement' : 'Edit Announcement'}
      onClose={onClose}
      actions={[
        { label: saving ? 'Sending…' : (mode === 'create' ? '📣 Send Announcement' : 'Save Changes'), primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && (
        <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>
      )}

      <FormGroup label="Title">
        <Input value={form.title} onChange={set('title')} placeholder="e.g. System Maintenance on Sunday" />
      </FormGroup>

      <FormGroup label="Message">
        <textarea
          value={form.message}
          onChange={set('message')}
          placeholder="Write your announcement message here…"
          rows={4}
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
      <div className="mt-4 p-3 rounded-lg border border-border bg-surface2 text-[12px]">
        <div className="text-text3 text-[11px] uppercase tracking-wider font-medium mb-2">Preview</div>
        <div style={{
          background: 'linear-gradient(90deg,rgba(255,138,92,.12),rgba(165,107,255,.12))',
          border: '1px solid rgba(165,107,255,.2)',
          borderRadius: 8, padding: '8px 12px',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span>📣</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 12, marginRight: 6 }}>{form.title || 'Your Title'}</span>
            <span style={{ fontSize: 12, opacity: .8 }}>{form.message || 'Your message will appear here.'}</span>
          </div>
        </div>
        <div className="mt-2 text-text3">
          Will be shown to: <strong className="text-text1">{selected?.l}</strong>
        </div>
      </div>
    </Modal>
  )
}