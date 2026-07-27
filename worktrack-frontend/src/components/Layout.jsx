import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, FolderKanban, Clock, Users, UserSquare2, CalendarCheck, CalendarOff, Bell, Settings, Menu, X, Check, CheckCheck, TrendingUp, LogOut, ChevronUp, ChevronDown, ChevronLeft, Sparkles, BarChart3, Compass, HelpCircle, ShieldCheck, FileText, Wallet, Receipt, ListChecks } from 'lucide-react'
import api from '../api/axios'
import { ROLE_NAV, ROLE_STYLE, isPlatformOwner } from '../auth/roles'
import notificationSound from '../assets/notification.mp3'
import useNotificationSocket from '../hooks/useNotificationSocket'
import { startTour, maybeStartTourForNewUser } from '../tour/appTour'
import GlobalSearch from './GlobalSearch'
import taurusMark from '../assets/Taurus-Logo.png'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',   icon: FolderKanban,    label: 'Projects' },
  { to: '/my-tasks',   icon: ListChecks,      label: 'My Tasks' },
  { to: '/timelogs',   icon: Clock,           label: 'Time Logs' },
  { to: '/attendance', icon: CalendarCheck,   label: 'Attendance' },
  { to: '/leaves',     icon: CalendarOff,     label: 'Leaves' },
  { to: '/employees',  icon: UserSquare2,     label: 'Employees' },
  { to: '/members',    icon: Users,           label: 'Members' },
  { to: '/engagement', icon: Sparkles,        label: 'Engagement' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/reports',    icon: FileText,        label: 'Reports' },
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
  LEAVE_APPROVED:    { color: '#16a34a', label: 'Leave Approved' },
  LEAVE_REJECTED:    { color: '#dc2626', label: 'Leave Rejected' },
  MANAGER_NUDGE:     { color: '#7c3aed', label: 'Manager Appreciation' },
  PAYSLIP_GENERATED: { color: '#15803d', label: 'Payslip Ready' },
  TASK_ASSIGNED:     { color: '#15803d', label: 'Task Assigned' },
}

function NotificationDropdown({ onClose }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => Array.isArray(r.data) ? r.data : []),
    refetchInterval: 60000,   // fallback — real-time push socket se aata hai
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

  // Click → read + related page khol do
  const openNotif = (n) => {
    if (!n.isRead) markReadMutation.mutate(n.id)
    const dest = n.type === 'PAYSLIP_GENERATED' ? '/my-payslips'
      : n.type === 'TASK_ASSIGNED' ? '/my-tasks'
      : (n.type || '').startsWith('LEAVE') ? '/leaves' : null
    onClose()
    if (dest) navigate(dest)
  }

  return (
    <div style={{
      position: 'absolute', top: 44, right: 0, width: 360,
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
          Notifications {unread > 0 && <span style={{ fontSize: 12, background: 'var(--tg-green-600)', color: '#fff', borderRadius: 10, padding: '1px 7px', marginLeft: 6 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--tg-green-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {recent.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            No notifications yet
          </div>
        ) : (
          recent.map((n, i) => {
            const ts = typeStyle[n.type] || { color: '#64748b', label: n.type }
            return (
              <div key={n.id} onClick={() => openNotif(n)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: i < recent.length - 1 ? '1px solid #f8fafc' : 'none',
                background: n.isRead ? '#fff' : '#fafbff',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#fff' : '#fafbff'}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: n.isRead ? '#e2e8f0' : 'var(--tg-green-600)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ts.color }}>{ts.label}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#1e293b', margin: 0, fontWeight: n.isRead ? 400 : 500, lineHeight: 1.4 }}>{n.message}</p>
                  {n.employeeName && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{n.employeeName}</p>}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <button onClick={() => { navigate('/notifications'); onClose() }} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--tg-green-600)', cursor: 'pointer', fontWeight: 500 }}>
            View all {notifications.length} notifications
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('tg_sidebar_collapsed') === '1')
  const [bellOpen, setBellOpen] = useState(false)

  function toggleCollapse() {
    setCollapsed(c => { localStorage.setItem('tg_sidebar_collapsed', c ? '0' : '1'); return !c })
  }
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false)
  const bellRef = useRef(null)
  const companyMenuRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const allowedPaths = ROLE_NAV[user.role] || ROLE_NAV.EMPLOYEE
  const visibleNav = navItems.filter(item => allowedPaths.includes(item.to))
  const roleStyle = ROLE_STYLE[user.role] || ROLE_STYLE.EMPLOYEE

  function handleLogout() {
    localStorage.removeItem('wt_user')
    localStorage.removeItem('wt_token')   // wristband bhi hatao
    navigate('/login')
  }

  // Multi-company: current company + switch handler
  const memberships = user.memberships || []
  const currentCompanyName = memberships.find(m => m.companyId === user.companyId)?.companyName || 'Taurus Go'

  async function switchCompany(companyId) {
    if (companyId === user.companyId) { setCompanyMenuOpen(false); return }
    try {
      const { data } = await api.post('/auth/switch-company', { companyId })
      const primary = (data.memberships || []).find(x => x.companyId === companyId) || null
      localStorage.setItem('wt_token', data.token)
      localStorage.setItem('wt_user', JSON.stringify({
        ...user, role: primary?.role || user.role, companyId, memberships: data.memberships || memberships,
      }))
      window.location.href = '/dashboard'   // poora refresh — saara data nayi company ka aaye
    } catch {
      setCompanyMenuOpen(false)
    }
  }

  // Real-time push (primary). Polling neeche ab sirf 60s fallback hai.
  useNotificationSocket(user.companyId)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => Array.isArray(r.data) ? r.data : []),
    refetchInterval: 60000,
  })
  const unread = notifications.filter(n => !n.isRead).length

  // Nayi notification aane pe: sound + toast popup (bina bell khole pata chale).
  const [toast, setToast] = useState(null)
  const prevUnread = useRef(null)
  const toastTimer = useRef(null)
  useEffect(() => {
    if (prevUnread.current !== null && unread > prevUnread.current) {
      new Audio(notificationSound).play().catch(() => {})   // autoplay block → chup, koi crash nahi
      const latest = notifications.find(n => !n.isRead) || notifications[0]
      if (latest) {
        setToast(latest)
        clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 6000)   // 6s baad khud gayab
      }
    }
    prevUnread.current = unread
  }, [unread])                                              // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target)) setCompanyMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // New user? Pehli baar login pe tour auto-start (flag na ho tab)
  useEffect(() => {
    maybeStartTourForNewUser()
  }, [])

  const openToast = (n) => {
    if (n && !n.isRead) api.put(`/notifications/${n.id}/read`).then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))
    setToast(null)
    const dest = n?.type === 'PAYSLIP_GENERATED' ? '/my-payslips'
      : n?.type === 'TASK_ASSIGNED' ? '/my-tasks'
      : (n?.type || '').startsWith('LEAVE') ? '/leaves' : null
    if (dest) navigate(dest)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--tg-bg)', position: 'fixed', top: 0, left: 0 }}>

      {/* Proactive toast — naya notification aate hi (bina bell khole) */}
      {toast && (
        <div onClick={() => openToast(toast)} style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200, width: 320, cursor: 'pointer',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.16)', padding: '14px 16px',
          animation: 'tg-toast-in 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: (typeStyle[toast.type]?.color) || '#16A34A' }}>
              {typeStyle[toast.type]?.label || 'Notification'}
            </span>
            <X size={14} color="#94a3b8" onClick={(e) => { e.stopPropagation(); setToast(null) }} />
          </div>
          <p style={{ fontSize: 13.5, color: '#1e293b', margin: 0, lineHeight: 1.4 }}>{toast.message}</p>
        </div>
      )}

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}${collapsed ? ' is-collapsed' : ''}`} style={{ width: collapsed ? 76 : 224, minWidth: collapsed ? 76 : 224, background: 'linear-gradient(180deg, #0B3D1E 0%, #082B14 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.22s ease, min-width 0.22s ease' }}>
        <div style={{ padding: collapsed ? '16px 0' : '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
          <div id="tour-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', flexShrink: 0, display: 'flex', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={taurusMark} alt="Taurus Go" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="brand-text" style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div className="tg-display" style={{
                  fontWeight: 700, fontSize: 19, letterSpacing: '-0.3px', lineHeight: 1, color: '#F5FBF6', whiteSpace: 'nowrap',
                }}>Taurus <span style={{ color: 'var(--tg-gold-400)' }}>Go</span></div>
                <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--tg-gold-400)', background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 4, padding: '1px 5px', lineHeight: 1.4, flexShrink: 0 }}>BETA</span>
              </div>
            </div>
          </div>
          <button className="collapse-btn" onClick={toggleCollapse} title={collapsed ? 'Expand' : 'Collapse'} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
            <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <nav id="tour-nav" style={{ flex: 1, padding: '12px 8px', overflow: 'hidden' }}>
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} id={`tour-${to.slice(1)}`} to={to} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
              {({ isActive }) => (
                <div className={`nav-link-item${isActive ? ' nav-active' : ''}`} title={collapsed ? label : undefined}>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.7} style={{ flexShrink: 0 }} />
                  <span className="nav-label">{label}</span>
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
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{user.name || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{user.email || ''}</div>
              </div>
              {/* Menu items */}
              {[
                ...(isPlatformOwner(user.email) ? [{ icon: ShieldCheck, label: 'Platform Console', action: () => { navigate('/platform'); setUserMenuOpen(false) }, accent: true }] : []),
                ...(user.role === 'ADMIN' ? [{ icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setUserMenuOpen(false) } }] : []),
                ...((user.role === 'ADMIN' || user.role === 'MANAGER') ? [{ icon: Wallet, label: 'Payroll', action: () => { navigate('/payroll'); setUserMenuOpen(false) } }] : []),
                { icon: TrendingUp, label: 'My Progress', action: () => { navigate('/progress'); setUserMenuOpen(false) } },
                { icon: Receipt, label: 'My Payslips', action: () => { navigate('/my-payslips'); setUserMenuOpen(false) } },
                { icon: Compass,    label: 'Take a tour', action: () => { setUserMenuOpen(false); startTour() } },
                { icon: LogOut,     label: 'Log out',     action: handleLogout, danger: true },
              ].map(({ icon: Icon, label, action, danger, accent }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 14,
                  fontWeight: accent ? 600 : 400,
                  color: danger ? '#f87171' : accent ? '#86EFAC' : 'rgba(255,255,255,0.8)',
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
          <button id="tour-user" onClick={() => setUserMenuOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--tg-grad)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06210F', fontSize: 14, fontWeight: 700,
            }}>{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-text" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2, padding: '1px 6px', borderRadius: 4, display: 'inline-block', background: roleStyle.bg, color: roleStyle.color }}>{roleStyle.label}</div>
            </div>
            <ChevronUp className="user-text" size={13} color="rgba(255,255,255,0.3)" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 52, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#0f172a' }}>
              <Menu size={20} />
            </button>
            <div ref={companyMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => memberships.length > 1 && setCompanyMenuOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                         cursor: memberships.length > 1 ? 'pointer' : 'default', padding: 0,
                         fontSize: 14, fontWeight: 500, color: '#0f172a', maxWidth: 200 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentCompanyName}</span>
                {memberships.length > 1 && <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
              </button>
              {companyMenuOpen && memberships.length > 1 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff',
                              border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              minWidth: 220, zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Switch workspace</div>
                  {memberships.map(m => {
                    const active = m.companyId === user.companyId
                    return (
                      <button key={m.companyId} onClick={() => switchCompany(m.companyId)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%',
                                 background: active ? '#f8fafc' : '#fff', border: 'none', cursor: 'pointer',
                                 padding: '9px 12px', fontSize: 14, color: '#0f172a', textAlign: 'left' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.companyName || `Company #${m.companyId}`}</span>
                        {active && <Check size={14} color="var(--tg-green-600)" style={{ flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Prominent centered search — outer div spacer rahe, inner phone pe hide */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="header-search" style={{ width: '100%', maxWidth: 460 }}>
              <GlobalSearch />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Bell Icon */}
            <div id="tour-bell" ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={() => setBellOpen(o => !o)} style={{
                position: 'relative', background: 'none', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                color: bellOpen ? 'var(--tg-green-600)' : '#64748b', display: 'flex', alignItems: 'center',
              }}>
                <Bell size={16} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                    borderRadius: 10, minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {bellOpen && <NotificationDropdown onClose={() => setBellOpen(false)} />}
            </div>

            <span id="tour-plan" className="header-plan" style={{ fontSize: 13, fontWeight: 600, color: '#15803D', background: '#EAF7EE', border: '1px solid #C9EAD4', padding: '3px 10px', borderRadius: 6 }}>Free Plan</span>
          </div>
        </header>

        <main className="page-main" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>

      {/* Floating help button — hamesha bottom-right, kabhi bhi tour dobara chalu */}
      <button
        onClick={startTour}
        title="Take a tour"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--tg-grad)', color: '#06210F', border: 'none',
          borderRadius: 999, padding: '11px 18px', cursor: 'pointer',
          fontSize: 15, fontWeight: 600,
          boxShadow: 'var(--tg-glow)',
        }}
      >
        <HelpCircle size={16} /> Take a tour
      </button>
    </div>
  )
}
