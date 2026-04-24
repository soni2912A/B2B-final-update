import React from 'react'
import { useApp } from '../../AppContext.jsx'
import { NAV_MAP, hasPermission } from '../../data/navigation.js'
import { formatRole, initials } from '../../utils/api.js'

export default function Sidebar() {
  const { user, role, page, navigate, logout, sidebarOpen } = useApp()
  const rawNav = NAV_MAP[role] || NAV_MAP.admin

  
  const filtered = []
  for (let i = 0; i < rawNav.length; i++) {
    const item = rawNav[i]
    if (item.section) {
      
      const nextSection = rawNav.slice(i + 1).findIndex(x => x.section)
      const slice = nextSection === -1 ? rawNav.slice(i + 1) : rawNav.slice(i + 1, i + 1 + nextSection)
      if (slice.some(x => !x.section && hasPermission(user, x.perm))) filtered.push(item)
    } else if (hasPermission(user, item.perm)) {
      filtered.push(item)
    }
  }
  const nav = filtered

  return (
    <aside className={`
      w-60 min-w-[240px] bg-surface border-r border-border flex flex-col overflow-y-auto z-50
      transition-transform duration-200
      md:translate-x-0 md:relative md:flex
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      fixed inset-y-0 left-0 md:static
    `}>
      {/* Logo */}
      <div className="px-5 pt-[18px] pb-3 flex items-center gap-2.5 border-b border-border mb-2 flex-shrink-0">
        <div className="w-7 h-7 bg-accent rounded-[6px] flex items-center justify-center text-white font-semibold text-[13px] flex-shrink-0">🎁</div>
        <div>
          <div className="font-semibold text-[15px] text-text1 leading-tight">B2B Bakery Platform</div>
          <div className="text-[11px] text-text2">{user?.business?.name || 'Gift Management'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1">
        {nav.map((item, i) => {
          if (item.section) return (
            <div key={i} className="px-3 pt-3 pb-1 text-[11px] font-medium text-text3 uppercase tracking-[0.06em]">{item.section}</div>
          )
          const active = page === item.id
          return (
            <div key={item.id} onClick={() => navigate(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-2 my-px rounded cursor-pointer text-[13px] transition-all duration-150 whitespace-nowrap overflow-hidden
                ${active ? 'bg-accent-light text-accent font-medium' : 'text-text2 hover:bg-surface2 hover:text-text1'}`}>
              <span className={`text-[16px] flex-shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.badge && <span className="ml-auto bg-accent text-white text-[10px] font-semibold rounded-full px-1.5 py-px min-w-[16px] text-center">!</span>}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2.5 flex-shrink-0">
        <div className="w-[30px] h-[30px] rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
          {initials(user?.name || 'U')}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[13px] font-medium truncate">{user?.name || 'User'}</div>
          <div className="text-[11px] text-text2 truncate">{formatRole(role)}</div>
        </div>
      </div>

      {/* Log Out */}
      <button
        onClick={logout}
        title="Log Out"
        aria-label="Log Out"
        className="flex items-center gap-2.5 px-4 py-3 border-t border-border text-[13px] text-text2 hover:bg-surface2 hover:text-text1 transition-colors cursor-pointer flex-shrink-0"
      >
        <span className="text-[16px] opacity-80">⎋</span>
        <span>Log Out</span>
      </button>
    </aside>
  )
}
