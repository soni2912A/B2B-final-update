import React, { useEffect, useRef } from 'react'
import { badgeClass, initials } from '../../utils/api.js'


export function Badge({ status }) {
  return <span className={badgeClass(status)}>{status?.replace(/_/g, ' ')}</span>
}

export function Avatar({ name, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-11 h-11 text-base' : 'w-7 h-7 text-[10px]'
  return (
    <div className={`${sz} rounded-full bg-accent-light flex items-center justify-center font-semibold text-accent flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

export function Btn({ children, variant = 'secondary', size = 'md', onClick, disabled, className = '', type = 'button', title }) {
  const base = 'inline-flex items-center gap-1.5 rounded font-medium font-sans cursor-pointer border transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-[13px]', lg: 'px-4 py-2 text-sm' }
  const variants = {
    primary:   'bg-accent text-white border-accent hover:bg-accent-mid',
    secondary: 'bg-surface text-text1 border-border2 hover:bg-surface2',
    danger:    'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
    ghost:     'bg-transparent text-text2 border-transparent hover:bg-surface2',
  }
  return (
    <button type={type} title={title} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}


export function Card({ children, className = '', noPad }) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${noPad ? '' : 'p-3.5 sm:p-5'} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="text-[14px] font-medium text-text1">{title}</div>
        {subtitle && <div className="text-xs text-text2">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}


export function StatCard({ label, value, delta, deltaType = 'up' }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="text-xs text-text2 mb-1.5">{label}</div>
      <div className="text-[22px] font-semibold text-text1">{value}</div>
      {delta && <div className={`text-[11px] mt-1 ${deltaType === 'up' ? 'text-green-600' : 'text-red-600'}`}>{delta}</div>}
    </div>
  )
}


export function TableWrap({ children }) {
  return <div className="md:overflow-x-auto"><table className="fleet-table">{children}</table></div>
}

export function TblAction({ children, onClick, variant = 'default', title, disabled }) {
  const variants = {
    default: 'text-text2 border-border hover:bg-surface2 hover:text-text1',
    danger:  'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700',
  }
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`text-xs px-2 py-0.5 rounded-[5px] border bg-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${disabled ? '' : 'cursor-pointer'} ${variants[variant] || variants.default}`}
    >
      {children}
    </button>
  )
}

export function Modal({ title, children, onClose, actions = [], size = '' }) {
  const maxW = size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-stretch sm:items-center sm:justify-center sm:p-5"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-surface rounded-none sm:rounded-xl w-full ${maxW} h-full sm:h-auto sm:max-h-[90vh] flex flex-col shadow-lg overflow-hidden`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex-shrink-0 gap-3">
          <span className="text-[15px] font-semibold truncate">{title}</span>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center bg-surface2 rounded-md hover:bg-border text-text2 text-sm cursor-pointer flex-shrink-0"
          >✕</button>
        </div>
        <div className="px-4 sm:px-5 py-4 sm:py-5 overflow-y-auto flex-1">{children}</div>
        {actions.length > 0 && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-2.5 flex-shrink-0">
            {actions.map((a, i) => (
              <Btn key={i} variant={a.variant || (a.primary ? 'primary' : 'secondary')} onClick={a.onClick} title={a.title} disabled={a.disabled} className="w-full sm:w-auto justify-center">{a.label}</Btn>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


export function FormGroup({ label, required, error, hint, children, htmlFor }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-text2 mb-1.5">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <div className="mt-1 text-[11px] text-red-600">{error}</div>}
      {!error && hint && <div className="mt-1 text-[11px] text-text3">{hint}</div>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] font-sans outline-none focus:border-accent transition-colors'

export function Input({ ...props }) { return <input className={inputCls} {...props} /> }
export function Select({ children, ...props }) { return <select className={inputCls} {...props}>{children}</select> }
export function Textarea({ ...props }) { return <textarea className={`${inputCls} resize-y min-h-[80px]`} {...props} /> }


export function FilterBar({ fields = [], values: controlledValues, onChange, onClear }) {
  const [internal, setInternal] = React.useState({})
  const values = controlledValues || internal

  const setVal = (key, val) => {
    if (!controlledValues) setInternal(v => ({ ...v, [key]: val }))
    onChange && onChange(key, val)
  }

  const clearAll = () => {
    if (!controlledValues) setInternal({})
    onClear && onClear()
  }

  return (
    <div className="flex gap-2.5 mb-4 flex-wrap items-center">
      {fields.map((f, i) => {
        const key = f.key || `f${i}`
        const val = values[key] ?? ''

        if (f.type === 'select')
          return (
            <select
              key={key}
              value={val}
              onChange={e => setVal(key, e.target.value)}
              className="h-[34px] px-2.5 border border-border2 rounded bg-surface text-[13px] text-text1 font-sans outline-none focus:border-accent cursor-pointer min-w-[140px] max-w-[220px]"
            >
              <option value="">{f.placeholder}</option>
              {(f.options || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          )

        if (f.type === 'date')
          return (
            <input
              key={key}
              type="date"
              value={val}
              onChange={e => setVal(key, e.target.value)}
              className="h-[34px] px-2.5 border border-border2 rounded bg-surface text-[13px] text-text1 font-sans outline-none focus:border-accent"
            />
          )

        // Default: search / text with ✕ clear
        return (
          <div key={key} className="relative flex-1 min-w-[140px] max-w-[220px]">
            <input
              type="text"
              value={val}
              placeholder={f.placeholder}
              onChange={e => setVal(key, e.target.value)}
              className="w-full h-[34px] pl-2.5 pr-8 border border-border2 rounded bg-surface text-[13px] text-text1 font-sans outline-none focus:border-accent"
            />
            {val && (
              <button
                type="button"
                onClick={() => setVal(key, '')}
                title="Clear"
                aria-label="Clear"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-text3 hover:text-text1 hover:bg-surface2 cursor-pointer text-[11px]"
              >✕</button>
            )}
          </div>
        )
      })}
      <Btn size="sm" onClick={clearAll} title="Clear all filters">Clear</Btn>
    </div>
  )
}

export function Pagination({ total = 0, page = 1, limit = 10, onPageChange, onLimitChange, pageSizes = [10, 20, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  const go = p => {
    if (!onPageChange) return
    if (p < 1 || p > totalPages || p === page) return
    onPageChange(p)
  }

  const pageList = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageList.push(i)
  } else {
    pageList.push(1)
    if (page > 4) pageList.push('…')
    const start = Math.max(2, page - 1)
    const end   = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pageList.push(i)
    if (page < totalPages - 3) pageList.push('…')
    pageList.push(totalPages)
  }

  return (
    <div className="flex items-center gap-3 mt-4 justify-between flex-wrap px-4 pb-3">
      <div className="flex items-center gap-2 text-xs text-text2">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={e => onLimitChange && onLimitChange(Number(e.target.value))}
          className="h-[28px] px-1.5 border border-border2 rounded bg-surface text-text1 text-xs outline-none focus:border-accent cursor-pointer"
        >
          {pageSizes.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="ml-2">Showing {from}-{to} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          title="Previous"
          aria-label="Previous page"
          className="w-[30px] h-[30px] border border-border rounded bg-surface text-text2 text-xs flex items-center justify-center cursor-pointer hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed"
        >‹</button>
        {pageList.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1 text-text3 text-xs">…</span>
            : <button
                key={p}
                onClick={() => go(p)}
                title={`Page ${p}`}
                aria-label={`Page ${p}`}
                className={`w-[30px] h-[30px] border rounded text-xs flex items-center justify-center cursor-pointer ${p === page ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text2 hover:bg-surface2'}`}
              >{p}</button>
        )}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          title="Next"
          aria-label="Next page"
          className="w-[30px] h-[30px] border border-border rounded bg-surface text-text2 text-xs flex items-center justify-center cursor-pointer hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed"
        >›</button>
      </div>
    </div>
  )
}


export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-text2 text-[13px]">
      <div className="spinner" /> Loading…
    </div>
  )
}

export function Empty({ icon = '📭', text = 'No records found.', sub }) {
  return (
    <div className="text-center py-12 text-text2">
      <div className="text-3xl mb-3 opacity-40">{icon}</div>
      <div className="text-sm">{text}</div>
      {sub && <div className="text-xs text-text3 mt-1">{sub}</div>}
    </div>
  )
}


export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0.5 bg-surface2 rounded p-[3px] mb-5 w-fit">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-3.5 py-1.5 rounded-[6px] text-[13px] transition-all duration-150 cursor-pointer ${active === t.id ? 'bg-surface text-text1 font-medium shadow-sm' : 'text-text2 hover:text-text1'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}


export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-semibold text-text1 truncate">{title}</h1>
        {subtitle && <p className="text-[12px] sm:text-[13px] text-text2 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">{children}</div>}
    </div>
  )
}

export function ProgressBar({ pct, color = 'bg-accent' }) {
  return (
    <div className="h-1.5 bg-surface2 rounded overflow-hidden mt-1.5">
      <div className={`h-full ${color} rounded transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  )
}

let _setToast = null
export function registerToast(fn) { _setToast = fn }
export function showToast(msg, type = 'success') {
  let m = (msg ?? '').toString().trim()
  if (m && !/[.!?…]$/.test(m)) m += '.'
  if (_setToast) _setToast({ msg: m, type, id: Date.now() })
}

export function ToastContainer() {
  const [toast, setToast] = React.useState(null)
  const timerRef = useRef(null)

  useEffect(() => { registerToast(setToast) }, [])
  useEffect(() => {
    if (toast) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setToast(null), 3000)
    }
  }, [toast])

  if (!toast) return null
  const icons = { success: '✓', error: '✗', info: 'ℹ' }
  return (
    <div className="fixed bottom-5 right-5 bg-text1 text-surface px-4 py-2.5 rounded-lg text-[13px] z-[999] flex items-center gap-2 shadow-lg toast-show">
      <span>{icons[toast.type] || '✓'}</span>
      {toast.msg}
    </div>
  )
}

export function PhoneInput({ value = '', onChange, placeholder, required = false }) {
  const CODES = [
    { code: '+971', flag: '🇦🇪', max: 10 },
    { code: '+91',  flag: '🇮🇳', max: 10 },
    { code: '+1',   flag: '🇺🇸', max: 10 },
    { code: '+44',  flag: '🇬🇧', max: 10 },
    { code: '+61',  flag: '🇦🇺', max: 10 },
    { code: '+65',  flag: '🇸🇬', max: 10 },
  ]
  
  const sorted = [...CODES].sort((a, b) => b.code.length - a.code.length)
  function parseVal(v) {
    const s = String(v || '')
    const found = sorted.find(c => s.startsWith(c.code))
    if (found) return { cc: found.code, num: s.slice(found.code.length).replace(/^\s+/, '') }
    return { cc: '+91', num: s }
  }
  const init = parseVal(value)
  const [cc,      setCc]      = React.useState(init.cc)
  const [num,     setNum]     = React.useState(init.num)
  const [touched, setTouched] = React.useState(false)
  const conf  = CODES.find(c => c.code === cc) || CODES[1]
  const valid = num.length === 0 || num.length === conf.max

  function handleCc(e) {
    const nc   = e.target.value
    const nmax = (CODES.find(c => c.code === nc) || CODES[1]).max
    const trimmed = num.slice(0, nmax)
    setCc(nc)
    setNum(trimmed)
    setTouched(false)
    onChange?.({ target: { value: trimmed ? `${nc} ${trimmed}` : '' } })
  }
  function handleNum(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, conf.max)
    setNum(raw)
    onChange?.({ target: { value: raw ? `${cc} ${raw}` : '' } })
  }

  return (
    <div className="w-full">
      <div className="flex w-full" style={{ gap: '6px' }}>
        <select
          value={cc}
          onChange={handleCc}
          className="h-9 flex-shrink-0 rounded-md border border-border bg-surface2 text-text1 text-[12px] focus:outline-none focus:ring-1 focus:ring-accent"
          style={{ width: '112px', paddingLeft: '5px', paddingRight: '2px' }}
        >
          {CODES.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
        <input
          type="tel"
          value={num}
          onChange={handleNum}
          onBlur={() => setTouched(true)}
          onFocus={() => setTouched(false)}
          placeholder={placeholder || Array(conf.max + 1).join('0')}
          required={required}
          className="flex-1 min-w-0 h-9 px-3 rounded-md border border-border bg-surface2 text-text1 text-[13px] placeholder:text-text3 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      {touched && !valid && num.length > 0 && (
        <div className="text-[11px] text-red-500 mt-1">
          Enter exactly {conf.max} digits for {cc}
        </div>
      )}
    </div>
  )
}


