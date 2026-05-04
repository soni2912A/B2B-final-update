import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { setToken, setLoginRole, apiFetch } from './utils/api.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const UNREAD_POLL_MS = 30000

function notifBasePath(role) {
  if (role === 'corporate_user') return '/corporate/notifications'
  if (role === 'super_admin')    return '/super-admin/notifications'
  return '/admin/notifications'
}

export function AppProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setTok]     = useState(null)
  const [role,    setRole]    = useState(null)
  const [page,    setPage]    = useState(null)
  const [authView, setAuthView] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname
      if (p === '/register' || p === '/free-trial') return 'register'
      if (p === '/login') return 'login'
    
      if (p === '/' || p === '') return 'landing'
    }
    return 'landing'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light')
  const pollRef = useRef(null)

  function toggleTheme() {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try { localStorage.setItem('theme', next) } catch {  }
      return next
    })
  }

  function defaultPage(r) {
    if (r === 'super_admin')    return 'sa-businesses'
    if (r === 'corporate_user') return 'corp-dashboard'
    return 'admin-dashboard'
  }

  const loadNotifications = useCallback(async (forRole) => {
    const r = forRole || role
    if (!r) return
    try {
      const res = await apiFetch('GET', `${notifBasePath(r)}?limit=10`)
      setNotifications(res.data?.notifications || [])
      if (typeof res.data?.unreadCount === 'number') setUnreadCount(res.data.unreadCount)
    } catch {  }
  }, [role])

  const refreshUnreadCount = useCallback(async (forRole) => {
    const r = forRole || role
    if (!r) return
    try {
      const res = await apiFetch('GET', `${notifBasePath(r)}/unread-count`)
      setUnreadCount(res.data?.count ?? 0)
    } catch {  }
  }, [role])

  async function markOneRead(id) {
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    try {
      await apiFetch('PATCH', `${notifBasePath(role)}/${id}/read`)
    } catch {  }
  }

  async function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await apiFetch('PATCH', `${notifBasePath(role)}/read-all`)
      await loadNotifications()
    } catch { /* silent */ }
  }

  function login(tok, u) {
    setTok(tok); setToken(tok)
    setUser(u);  setRole(u.role); setLoginRole(u.role)
    localStorage.setItem('auth_token', tok)
    localStorage.setItem('auth_user', JSON.stringify(u))
    setPage(defaultPage(u.role))
  }

  function logout() {
    setTok(null); setToken(null); setUser(null); setRole(null); setPage(null)
    setNotifications([]); setUnreadCount(0)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setAuthView('landing')
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser  = localStorage.getItem('auth_user')
    if (!savedToken || !savedUser) return
    try {
      const u = JSON.parse(savedUser)
      setTok(savedToken); setToken(savedToken)
      setUser(u); setRole(u.role); setLoginRole(u.role)
      setPage(defaultPage(u.role))

      apiFetch('GET', '/auth/me').then(res => {
        const fresh = res.data?.user
        if (fresh) {
          setUser(fresh); setRole(fresh.role); setLoginRole(fresh.role)
          localStorage.setItem('auth_user', JSON.stringify(fresh))
        }
      }).catch(() => { })
    } catch {  }
  }, [])

  useEffect(() => {
    const onUnauth = () => logout()
    window.addEventListener('auth:unauthorized', onUnauth)
    return () => window.removeEventListener('auth:unauthorized', onUnauth)
  }, [])

  useEffect(() => {
    if (!user || !role) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    loadNotifications(role)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => refreshUnreadCount(role), UNREAD_POLL_MS)
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [user, role, loadNotifications, refreshUnreadCount])

  function navigate(p) { setPage(p); setSidebarOpen(false) }
  function showRegister() { setAuthView('register') }
  function showLogin() { setAuthView('login') }
  function showForgot() { setAuthView('forgot') }
  function showAdminRegister() { setAuthView('admin-register') }
  function showLanding() { setAuthView('landing') }

  return (
    <Ctx.Provider value={{
      user, token, role, page, navigate, login, logout,
      authView, showRegister, showLogin, showForgot, showAdminRegister, showLanding,
      sidebarOpen, setSidebarOpen,
      notifications, unreadCount,
      loadNotifications, refreshUnreadCount, markOneRead, markAllRead,
      theme, toggleTheme,
    }}>
      {children}
    </Ctx.Provider>
  )
}