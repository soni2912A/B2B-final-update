import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate } from '../../../utils/api.js'
import { Card, PageHeader, TableWrap, Loading, Modal, FormGroup, Input, Btn } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

export function SAReferralsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingLimit, setEditingLimit] = useState(null) // { referral }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/super-admin/referrals')
      setList(res.data?.referrals || [])
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalConversions = list.filter(r => r.isActive).reduce((s, r) => s + r.totalConversions, 0)
  const totalRewards     = list.reduce((s, r) => s + r.conversions.filter(c => c.rewardGiven).length, 0)
  const totalCodes       = list.length

  return (
    <div>
      <PageHeader title="Referrals Overview" subtitle="All referral codes across admin and corporate users" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Codes',        value: totalCodes,        icon: '🔗' },
          { label: 'Total Conversions',  value: totalConversions,  icon: '🎯' },
          { label: 'Rewards Granted',    value: totalRewards,      icon: '🎁' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-3 !p-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold text-text1">{s.value}</div>
              <div className="text-xs text-text2">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mb-5 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-[13px] text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <strong>Usage Limits:</strong> Each referral code expires after reaching its <strong>Max Uses</strong> limit (default 10).
        A new code is automatically generated for the user when a code expires. You can customize the limit per code.
      </div>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Role</th>
                <th>Business</th>
                <th>Code</th>
                <th>Clicks</th>
                <th>Used / Max</th>
                <th>Status</th>
                <th>Rewards</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-text2 text-sm">
                  <div className="text-3xl mb-2">🔗</div>No referrals yet.
                </td></tr>
              ) : list.map(r => (
                <tr key={r._id} className={!r.isActive ? 'opacity-50' : ''}>
                  <td className="font-medium">{r.referrer?.name || '—'}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${r.referrer?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {r.referrer?.role === 'admin' ? 'Admin' : 'Corporate'}
                    </span>
                  </td>
                  <td className="text-text2 text-sm">{r.business?.name || '—'}</td>
                  <td>
                    <span className={`font-mono font-bold tracking-widest text-[13px] ${r.isActive ? 'text-accent' : 'text-text3 line-through'}`}>{r.code}</span>
                    {!r.isActive && r.supersededBy && (
                      <div className="text-[10px] text-text3 mt-0.5">→ {r.supersededBy}</div>
                    )}
                  </td>
                  <td className="text-text2 text-center">{r.totalClicks}</td>
                  <td className="text-center">
                    <span className={`font-semibold text-sm ${r.totalConversions >= r.maxUses ? 'text-red-500' : r.totalConversions > 0 ? 'text-emerald-500' : 'text-text2'}`}>
                      {r.totalConversions} / {r.maxUses || 10}
                    </span>
                    {r.totalConversions >= (r.maxUses || 10) && (
                      <div className="text-[10px] text-red-400">Expired</div>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`font-semibold ${r.conversions.filter(c => c.rewardGiven).length > 0 ? 'text-yellow-500' : 'text-text2'}`}>
                      {r.conversions.filter(c => c.rewardGiven).length}
                    </span>
                  </td>
                  <td className="text-text2 text-sm">{formatDate(r.createdAt)}</td>
                  <td>
                    {r.isActive && (
                      <button
                        onClick={() => setEditingLimit(r)}
                        className="text-[12px] text-accent hover:underline font-medium"
                      >
                        Set Limit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {editingLimit && (
        <MaxUsesModal
          referral={editingLimit}
          onClose={() => setEditingLimit(null)}
          onSaved={() => { setEditingLimit(null); load() }}
        />
      )}
    </div>
  )
}

function MaxUsesModal({ referral, onClose, onSaved }) {
  const [maxUses, setMaxUses] = useState(String(referral.maxUses || 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const num = Number(maxUses)
    if (!num || num < 1) { setError('Please enter a number ≥ 1.'); return }
    if (num < referral.totalConversions) {
      setError(`Cannot set limit below current usage (${referral.totalConversions}).`); return
    }
    setSaving(true); setError('')
    try {
      await apiFetch('PATCH', `/super-admin/referrals/${referral._id}/max-uses`, { maxUses: num })
      showToast('Usage limit updated!')
      onSaved()
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <Modal
      title={`✏️ Set Usage Limit — ${referral.code}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Save', primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <div className="mb-4 p-3 rounded-lg bg-surface2 border border-border text-[12px] text-text2">
        <div className="grid grid-cols-2 gap-2">
          <div>Current uses: <strong className="text-text1">{referral.totalConversions}</strong></div>
          <div>Current limit: <strong className="text-text1">{referral.maxUses || 10}</strong></div>
        </div>
        <div className="mt-1">When limit is reached, this code will be auto-expired and a new one will be generated for the user.</div>
      </div>

      <FormGroup label="New Max Uses Limit">
        <Input
          type="number"
          value={maxUses}
          onChange={e => setMaxUses(e.target.value)}
          placeholder="e.g. 10"
          min="1"
          autoFocus
        />
      </FormGroup>
    </Modal>
  )
}