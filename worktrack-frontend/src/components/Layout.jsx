import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Clock, Users, Settings, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/timelogs', icon: Clock, label: 'Time Logs' },
  { to: '/members', icon: Users, label: 'Members' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc' }}>

      {/* Overlay — tap to close sidebar on mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40,
        }} />
      )}

      {/* Sidebar — drawer on mobile, fixed panel on desktop */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ width: 220, minWidth: 220, background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Brand */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>WorkTrack</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>Project Management</div>
          </div>
          {/* Close button — only shows on mobile */}
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} style={{
            display: 'none', background: 'none', border: 'none',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
              {({ isActive }) => (
                <div className={`nav-link-item${isActive ? ' nav-active' : ''}`}>
                  <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Vishal Kumar</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Admin</div>
          </div>
          <Settings size={13} color="rgba(255,255,255,0.25)" />
        </div>
      </aside>

      {/* Main — takes remaining width, never overflows */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ height: 48, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hamburger — visible only on mobile via CSS */}
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, color: '#0f172a',
            }}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>WorkTrack Inc.</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#4f46e5', background: '#eef2ff', padding: '3px 10px', borderRadius: 6 }}>Free Plan</span>
        </header>

        {/* Page content — scrollable */}
        <main className="page-main" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>

    </div>
  )
}
