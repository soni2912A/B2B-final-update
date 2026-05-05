import React, { useEffect, useState, useCallback } from 'react'
import { apiFetch, formatDate, formatCurrency } from '../../../utils/api.js'
import { Card, PageHeader, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Badge } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

const TYPE_OPTS  = [{ v: 'percentage', l: '% Percentage' }, { v: 'fixed', l: '₹ Fixed Amount' }]

const EMPTY = {
  code: '', description: '', type: 'percentage', value: '',
  maxDiscountAmount: '', usageLimit: '10', validFrom: '', validUntil: '', isActive: true,
}

export function SACouponsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/super-admin/coupons')
      setList(res.data?.coupons || [])
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function deactivate(id, code) {
    if (!window.confirm(`Deactivate coupon "${code}"?`)) return
    try {
      await apiFetch('DELETE', `/super-admin/coupons/${id}`)
      showToast('Coupon deactivated.')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Coupon Codes" subtitle="Create discount coupons for subscription plans">
        <Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Coupon</Btn>
      </PageHeader>

      <div className="mb-5 px-4 py-3 rounded-lg border border-yellow-200 bg-yellow-50 text-[13px] text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
        <strong>How it works:</strong> Users enter a coupon code at the plan selection step during registration. The discount is applied instantly to their subscription price.
      </div>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Used</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text2 text-sm">
                  <div className="text-3xl mb-2">🏷️</div>No coupons yet.
                </td></tr>
              ) : list.map(c => (
                <tr key={c._id}>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-bold text-[13px] text-accent tracking-widest">{c.code}</span>
                      {c.description && <span className="text-[11px] text-text2">{c.description}</span>}
                    </div>
                  </td>
                  <td className="font-semibold text-emerald-500">
                    {c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}
                    {c.maxDiscountAmount ? <span className="text-text2 font-normal text-[11px] ml-1">(max ₹{c.maxDiscountAmount})</span> : ''}
                  </td>
                  <td className="text-text2 text-sm">
                    {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  </td>
                  <td className="text-text2 text-sm">{formatDate(c.validUntil)}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <TblAction onClick={() => setEditing(c)}>Edit</TblAction>
                      {c.isActive && <TblAction variant="danger" onClick={() => deactivate(c._id, c.code)}>Deactivate</TblAction>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showCreate && <CouponModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />}
      {editing   && <CouponModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function CouponModal({ initial = null, onClose, onSaved }) {
  const mode = initial ? 'edit' : 'create'
  const [form, setForm] = useState(initial ? {
    code:              initial.code,
    description:       initial.description || '',
    type:              initial.type,
    value:             initial.value,
    maxDiscountAmount: initial.maxDiscountAmount || '',
    usageLimit:        initial.usageLimit || '',
    validFrom:         initial.validFrom?.slice(0,10) || '',
    validUntil:        initial.validUntil?.slice(0,10) || '',
    isActive:          initial.isActive,
  } : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    if (!form.code.trim())   { setError('Code is required.'); return }
    if (!form.value)         { setError('Discount value is required.'); return }
    if (!form.validFrom)     { setError('Valid from date is required.'); return }
    if (!form.validUntil)    { setError('Valid until date is required.'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        code:              form.code.toUpperCase().trim(),
        value:             Number(form.value),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit:        form.usageLimit !== '' && form.usageLimit !== null ? Number(form.usageLimit) : null,
      }
      if (mode === 'create') await apiFetch('POST', '/super-admin/coupons', payload)
      else                   await apiFetch('PATCH', `/super-admin/coupons/${initial._id}`, payload)
      showToast(mode === 'create' ? 'Coupon created!' : 'Coupon updated.')
      onSaved()
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <Modal
      title={mode === 'create' ? '🏷️ New Coupon Code' : '✏️ Edit Coupon'}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : (mode === 'create' ? 'Create Coupon' : 'Save'), primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Code" className="col-span-2">
          <Input value={form.code} onChange={set('code')} placeholder="e.g. LAUNCH50" disabled={mode === 'edit'}
            style={{ fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }} />
        </FormGroup>
        <FormGroup label="Discount Type">
          <Select value={form.type} onChange={set('type')}>
            {TYPE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label={form.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}>
          <Input type="number" value={form.value} onChange={set('value')} placeholder={form.type === 'percentage' ? '20' : '500'} min="0" />
        </FormGroup>
        {form.type === 'percentage' && (
          <FormGroup label="Max Discount Cap (₹, optional)">
            <Input type="number" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} placeholder="e.g. 2000" min="0" />
          </FormGroup>
        )}
        <FormGroup label="Usage Limit (default: 10, blank = unlimited)">
          <Input type="number" value={form.usageLimit} onChange={set('usageLimit')} placeholder="e.g. 10" min="1" />
        </FormGroup>
        <FormGroup label="Valid From">
          <Input type="date" value={form.validFrom} onChange={set('validFrom')} />
        </FormGroup>
        <FormGroup label="Valid Until">
          <Input type="date" value={form.validUntil} onChange={set('validUntil')} />
        </FormGroup>
        <FormGroup label="Description (optional)" className="col-span-2">
          <Input value={form.description} onChange={set('description')} placeholder="e.g. Launch discount for early adopters" />
        </FormGroup>
      </div>

      {/* Live preview */}
      {form.value && (
        <div className="mt-4 p-3 rounded-lg border border-border bg-surface2 text-[12px]">
          <div className="text-text3 text-[11px] uppercase tracking-wider font-medium mb-2">Preview</div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-accent text-lg tracking-widest">{form.code || 'CODE'}</span>
            <span className="text-text2">→</span>
            <span className="text-emerald-500 font-semibold">
              {form.type === 'percentage'
                ? `${form.value}% off${form.maxDiscountAmount ? ` (max ₹${form.maxDiscountAmount})` : ''}`
                : `₹${form.value} off`}
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}