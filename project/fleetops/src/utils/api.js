
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'


export const BACKEND_BASE = API_BASE.replace(/\/api\/v1\/?$/, '')

let _token = null
let _loginRole = 'admin'

export function setToken(t) { _token = t }
export function setLoginRole(r) { _loginRole = r }
export function getToken() { return _token }

export async function apiFetch(method, path, body, isFormData) {
  const headers = {}
  if (_token) headers['Authorization'] = 'Bearer ' + _token
  if (!isFormData) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch (netErr) {
    throw new Error('Could not reach server. Check your connection.')
  }

  let data = {}
  try { data = await res.json() } catch { /* empty body is ok */ }

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: data }))
  }
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status}).`)
    if (Array.isArray(data.errors)) err.errors = data.errors
    err.status = res.status
    throw err
  }
  return data
}

export async function apiLogin(email, password) {
  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Login failed.')
  return data
}

export async function apiDownload(path, filename) {
  const headers = {}
  if (_token) headers['Authorization'] = 'Bearer ' + _token

  let res
  try {
    res = await fetch(API_BASE + path, { headers })
  } catch {
    throw new Error('Could not reach server. Check your connection.')
  }

  if (!res.ok) {
    let msg = `Download failed (${res.status}).`
    try { const j = await res.json(); if (j?.message) msg = j.message } catch { /* non-JSON body */ }
    throw new Error(msg)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function apiRegister(payload) {
  const res = await fetch(API_BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Registration failed.')
  return data
}

export const formatDate = d => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return '—'
  const dd   = String(dt.getDate()).padStart(2, '0')
  const mm   = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
export const formatTime = d => {
  if (!d) return '—'
  return new Date(d)
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}
export const formatCurrency = n =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })

export const initials = name =>
  (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

export const formatRole = r =>
  ({ admin: 'Administrator', staff: 'Delivery Staff', corporate_user: 'Corporate User', super_admin: 'Super Admin' }[r] || r)

export const badgeClass = status => {
  const map = {
    new: 'bg-blue-50 text-blue-800',
    processing: 'bg-amber-50 text-amber-800',
    assigned: 'bg-purple-50 text-purple-800',
    delivered: 'bg-green-50 text-green-800',
    cancelled: 'bg-red-50 text-red-800',
    paid: 'bg-green-50 text-green-800',
    pending: 'bg-amber-50 text-amber-800',
    partial: 'bg-amber-50 text-amber-800',
    overdue: 'bg-red-50 text-red-800',
    active: 'bg-green-50 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-50 text-blue-800',
    out_for_delivery: 'bg-amber-50 text-amber-800',
    in_transit: 'bg-purple-50 text-purple-800',
    failed: 'bg-red-50 text-red-800',
    open: 'bg-blue-50 text-blue-800',
    in_progress: 'bg-amber-50 text-amber-800',
    resolved: 'bg-green-50 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
    sent: 'bg-green-50 text-green-800',
    bounced: 'bg-red-50 text-red-800',
    skipped: 'bg-gray-100 text-gray-600',
    on_hold: 'bg-amber-50 text-amber-800',
    archived: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-50 text-red-800',
    starter: 'bg-blue-50 text-blue-800',
    professional: 'bg-purple-50 text-purple-800',
    enterprise: 'bg-green-50 text-green-800',
    admin: 'bg-purple-50 text-purple-800',
    staff: 'bg-blue-50 text-blue-800',
    low_stock: 'bg-amber-50 text-amber-800',
    out_of_stock: 'bg-red-50 text-red-800',
    draft: 'bg-gray-100 text-gray-600',
  }
  return (map[status] || 'bg-gray-100 text-gray-600') + ' inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap'
}