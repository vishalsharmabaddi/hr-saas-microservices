import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, FolderKanban, Clock, Users, UserSquare2, CalendarCheck, CalendarOff, Bell, Settings, Menu, X, Check, CheckCheck, TrendingUp, LogOut, ChevronUp, Sparkles } from 'lucide-react'
import api from '../api/axios'
import { ROLE_NAV, ROLE_STYLE } from '../auth/roles'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',   icon: FolderKanban,    label: 'Projects' },
  { to: '/timelogs',   icon: Clock,           label: 'Time Logs' },
  { to: '/attendance', icon: CalendarCheck,   label: 'Attendance' },
  { to: '/leaves',     icon: CalendarOff,     label: 'Leaves' },
  { to: '/employees',  icon: UserSquare2,     label: 'Employees' },
  { to: '/members',    icon: Users,           label: 'Members' },
  { to: '/engagement', icon: Sparkles,        label: 'Engagement' },
]

function timeAgo(dt) {
  if (!dt) return ''
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const typeStyle = {
  LEAVE_APPROVED: { color: '#16a34a', label: 'Leave Approved' },
  LEAVE_REJECTED: { color: '#dc2626', label: 'Leave Rejected' },
  MANAGER_NUDGE:  { color: '#7c3aed', label: 'Manager Appreciation' },
}

function NotificationDropdown({ onClose }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 15000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter(n => !n.isRead).length
  const recent = notifications.slice(0, 5)

  return (
    <div style={{
      position: 'absolute', top: 44, right: 0, width: 360,
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
          Notifications {unread > 0 && <span style={{ fontSize: 11, background: '#4f46e5', color: '#fff', borderRadius: 10, padding: '1px 7px', marginLeft: 6 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} style={{ background: 'none', border: 'none', fontSize: 12, color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {recent.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No notifications yet
          </div>
        ) : (
          recent.map((n, i) => {
            const ts = typeStyle[n.type] || { color: '#64748b', label: n.type }
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px',
                borderBottom: i < recent.length - 1 ? '1px solid #f8fafc' : 'none',
                background: n.isRead ? '#fff' : '#fafbff',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: n.isRead ? '#e2e8f0' : '#4f46e5' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ts.color }}>{ts.label}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#1e293b', margin: 0, fontWeight: n.isRead ? 400 : 500, lineHeight: 1.4 }}>{n.message}</p>
                  {n.employeeName && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{n.employeeName}</p>}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <button onClick={() => { navigate('/notifications'); onClose() }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#4f46e5', cursor: 'pointer', fontWeight: 500 }}>
            View all {notifications.length} notifications
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const bellRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const allowedPaths = ROLE_NAV[user.role] || ROLE_NAV.EMPLOYEE
  const visibleNav = navItems.filter(item => allowedPaths.includes(item.to))
  const roleStyle = ROLE_STYLE[user.role] || ROLE_STYLE.EMPLOYEE

  function handleLogout() {
    localStorage.removeItem('wt_user')
    navigate('/login')
  }

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 15000,
  })
  const unread = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc', position: 'fixed', top: 0, left: 0 }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ width: 220, minWidth: 220, background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>WorkTrack</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>Project Management</div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
          {visibleNav.map(({ to, icon: Icon, label }) => (
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

        {/* User menu */}
        <div ref={userMenuRef} style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Popup menu — appears above */}
          {userMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 8, right: 8, marginBottom: 6,
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
            }}>
              {/* Name header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.name || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{user.email || ''}</div>
              </div>
              {/* Menu items */}
              {[
                { icon: TrendingUp, label: 'My Progress', action: () => { navigate('/progress'); setUserMenuOpen(false) } },
                { icon: LogOut,     label: 'Log out',     action: handleLogout, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, color: danger ? '#f87171' : 'rgba(255,255,255,0.8)',
                  textAlign: 'left',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon size={14} strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Clickable user row */}
          <button onClick={() => setUserMenuOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600,
            }}>{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, padding: '1px 6px', borderRadius: 4, display: 'inline-block', background: roleStyle.bg, color: roleStyle.color }}>{roleStyle.label}</div>
            </div>
            <ChevronUp size={13} color="rgba(255,255,255,0.3)" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 48, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#0f172a' }}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>WorkTrack Inc.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bell Icon */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={() => setBellOpen(o => !o)} style={{
                position: 'relative', background: 'none', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                color: bellOpen ? '#4f46e5' : '#64748b', display: 'flex', alignItems: 'center',
              }}>
                <Bell size={16} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
                    borderRadius: 10, minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {bellOpen && <NotificationDropdown onClose={() => setBellOpen(false)} />}
            </div>

            <span style={{ fontSize: 11, fontWeight: 500, color: '#4f46e5', background: '#eef2ff', padding: '3px 10px', borderRadius: 6 }}>Free Plan</span>
          </div>
        </header>

        <main className="page-main" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
