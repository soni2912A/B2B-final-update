import React, { useEffect, useRef, useState } from 'react'
import { showToast } from './index.jsx'


export default function EditableCell({
  value,
  mode = 'text',
  options = [],
  render,
  onSave,
  disabled = false,
  placeholder = '—',
  inputClassName = '',
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (!editing) return
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (mode === 'select' || mode === 'date') return
    try { el.select && el.select() } catch { /* some controls don't support select */ }
  }, [editing, mode])

  function start() {
    if (disabled || saving) return
    setDraft(value ?? '')
    setEditing(true)
  }
  function cancel() {
    setEditing(false)
    setDraft(value)
  }
  async function commit(nextRaw) {

    const next = coerce(nextRaw, mode)
    const prev = coerce(value, mode)
    if (next === prev) { setEditing(false); return }

    setSaving(true)
    try {
      await onSave(next)
      setEditing(false)
    } catch (err) {
      
      setDraft(value)
      showToast(err?.message || 'Save failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && mode !== 'textarea') {
      e.preventDefault()
      commit(draft)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }


  if (!editing) {
    const shown = render ? render(value) : (value === '' || value == null ? placeholder : String(value))
    const isEmpty = value === '' || value == null
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        className={`text-left w-full px-1 -mx-1 py-0.5 rounded ${disabled ? 'cursor-default' : 'cursor-text hover:bg-surface2'} ${isEmpty ? 'text-text3' : ''}`}
        title={disabled ? undefined : 'Click to edit'}
      >
        {shown}
      </button>
    )
  }

 
  const base = `w-full px-1.5 py-0.5 border border-accent rounded bg-surface text-[13px] outline-none ${saving ? 'opacity-60' : ''} ${inputClassName}`

  if (mode === 'select') {
    return (
      <select
        ref={inputRef}
        value={draft ?? ''}
        disabled={saving}
        onChange={e => { const v = e.target.value; setDraft(v); commit(v) }}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        className={base}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (mode === 'textarea') {
    return (
      <textarea
        ref={inputRef}
        rows={2}
        value={draft ?? ''}
        disabled={saving}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        className={base + ' resize-y min-h-[40px]'}
      />
    )
  }

  return (
    <input
      ref={inputRef}
      type={mode === 'number' ? 'number' : mode === 'date' ? 'date' : 'text'}
      value={draft ?? ''}
      disabled={saving}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => commit(draft)}
      className={base}
    />
  )
}

function coerce(v, mode) {
  if (v === '' || v == null) return mode === 'number' ? null : ''
  if (mode === 'number') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  if (mode === 'date') {
 
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
  }
  return String(v)
}
