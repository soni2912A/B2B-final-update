import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../AppContext.jsx'
import { PAGE_TITLES } from '../../data/navigation.js'
import { formatDate } from '../../utils/api.js'

const TYPE_ICON = {
  order:     '📋',
  delivery:  '🚚',
  invoice:   '💳',
  payment:   '💳',
  low_stock: '📦',
  corporate: '🏢',
  occasion:  '🎉',
  ticket:    '🎫',
  feedback:  '⭐',
  system:    '🔔',
}

function routeFor(role, notification) {
  const m = notification?.referenceModel
  const isCorp = role === 'corporate_user'
  switch (m) {
    case 'Order':     return isCorp ? 'corp-orders'    : 'admin-orders'
    case 'Invoice':   return isCorp ? 'corp-invoices'  : 'admin-invoices'
    case 'Delivery':  return isCorp ? 'corp-orders'    : 'admin-deliveries'
    case 'Corporate': return 'admin-corporates'
    case 'Occasion':  return isCorp ? 'corp-occasions' : 'admin-occasions'
    case 'Product':   return 'admin-inventory'
    case 'Ticket':    return isCorp ? 'corp-tickets'   : 'admin-tickets'
    default:          return null
  }
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)    return 'just now'
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)    return `${d}d ago`
  return formatDate(iso)
}

export default function Topbar() {
  const {
    page, setSidebarOpen, role, navigate,
    notifications, unreadCount,
    loadNotifications, markAllRead, markOneRead,
    theme, toggleTheme,
  } = useApp()
  const [notifOpen, setNotifOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    function onClick(e) { if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function openPanel() {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) loadNotifications()
  }

  function onItemClick(n) {
    if (!n.isRead) markOneRead(n._id)
    const route = routeFor(role, n)
    if (route) { navigate(route); setNotifOpen(false) }
  }

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-3 sm:px-5 gap-2 sm:gap-3 flex-shrink-0 z-40">
      <button
        className="md:hidden w-9 h-9 flex items-center justify-center rounded border border-border text-text2 hover:bg-surface2 flex-shrink-0"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Open menu"
      >☰</button>

      <div className="text-[14px] sm:text-[15px] font-medium text-text1 flex-1 truncate min-w-0">{PAGE_TITLES[page] || 'Dashboard'}</div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 sm:w-8 sm:h-8 rounded border border-border flex items-center justify-center text-text2 hover:bg-surface2 transition-colors flex-shrink-0"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      {/* Notifications */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={openPanel}
          className="relative w-9 h-9 sm:w-8 sm:h-8 rounded border border-border flex items-center justify-center text-text2 hover:bg-surface2 transition-colors flex-shrink-0"
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white rounded-full text-[10px] font-semibold flex items-center justify-center leading-none">
              {badgeLabel}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-10 w-[calc(100vw-1.5rem)] max-w-[320px] sm:w-80 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">Notifications</span>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="text-xs text-accent hover:underline disabled:text-text3 disabled:no-underline disabled:cursor-default"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-text2 text-[12px]">No notifications.</div>
              ) : notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => onItemClick(n)}
                  className={`flex gap-2 px-4 py-3 border-b border-border cursor-pointer hover:bg-surface2 last:border-0 ${n.isRead ? '' : 'bg-accent-light'}`}
                >
                  <div className="w-6 flex-shrink-0 text-center text-sm">{TYPE_ICON[n.type] || '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{n.title}</div>
                    <div className="text-[12px] text-text2 truncate">{n.message}</div>
                    <div className="text-[11px] text-text3 mt-0.5">{relativeTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
