import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Clock, CheckCircle, Plus, ArrowUpRight, Activity, Users, CalendarOff, CalendarCheck, Flame, Trophy } from 'lucide-react'
import api from '../api/axios'

const statusConfig = {
  PLANNING:    { label: 'Planning',    color: '#4f46e5', bg: '#eef2ff' },
  IN_PROGRESS: { label: 'In Progress', color: '#d97706', bg: '#fffbeb' },
  ON_HOLD:     { label: 'On Hold',     color: '#dc2626', bg: '#fef2f2' },
  COMPLETED:   { label: 'Completed',   color: '#16a34a', bg: '#f0fdf4' },
  CANCELLED:   { label: 'Cancelled',   color: '#475569', bg: '#f1f5f9' },
}

function StatCard({ label, value, icon: Icon, accent, loading }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#fafbff' : '#fff',
        borderRadius: 12, padding: '18px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: hovered
          ? '0 8px 24px rgba(79,70,229,0.10)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.2px' }}>{label}</span>
        <Icon size={16} color={hovered ? accent : '#94a3b8'} strokeWidth={1.8} style={{ transition: 'color 0.18s' }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1 }}>
        {loading ? <span style={{ fontSize: 20, color: '#cbd5e1' }}>—</span> : value}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('wt_user') || '{}')

  const { data, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => r.data),
  })

  const { data: leaves = [], isLoading: leaveLoading } = useQuery({
    queryKey: ['leaves', 'PENDING'],
    queryFn: () => api.get('/leaves', { params: { status: 'PENDING' } }).then(r => r.data),
  })

  const today = new Date().toISOString().split('T')[0]
  const { data: attendance = [], isLoading: attLoading } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => api.get('/attendance', { params: { date: today } }).then(r => r.data),
  })

  const activeEmployees  = employees.filter(e => e.isActive).length
  const totalEmployees   = employees.length
  const pendingLeaves    = leaves.length
  const todayAttendance  = attendance.length

  const projectStats = [
    { label: 'Total Projects', value: data?.totalProjects   ?? 0, icon: FolderKanban, accent: '#4f46e5' },
    { label: 'Open Tasks',     value: data?.openTasks       ?? 0, icon: CheckSquare,  accent: '#d97706' },
    { label: 'In Progress',    value: data?.inProgressTasks ?? 0, icon: Clock,        accent: '#0284c7' },
    { label: 'Completed',      value: data?.completedTasks  ?? 0, icon: CheckCircle,  accent: '#16a34a' },
  ]

  const hrStats = [
    { label: 'Total Employees',     value: totalEmployees,  icon: Users,         accent: '#7c3aed' },
    { label: 'Active Employees',    value: activeEmployees, icon: Users,         accent: '#0891b2' },
    { label: "Today's Attendance",  value: todayAttendance, icon: CalendarCheck, accent: '#16a34a' },
    { label: 'Pending Leaves',      value: pendingLeaves,   icon: CalendarOff,   accent: '#dc2626' },
  ]

  const recentProjects = data?.recentProjects ?? []
  const recentLogs     = data?.recentLogs     ?? []

  const { data: xp } = useQuery({
    queryKey: ['gamification', 1],
    queryFn: () => api.get('/gamification/1/summary').then(r => r.data),
  })

  const levelColors = { ROOKIE: '#64748b', REGULAR: '#2563eb', PRO: '#7c3aed', LEGEND: '#d97706' }
  const xpMax = { ROOKIE: 100, REGULAR: 500, PRO: 1500, LEGEND: 1500 }
  const xpMin = { ROOKIE: 0, REGULAR: 100, PRO: 500, LEGEND: 1500 }
  const currentLevel = xp?.level || 'ROOKIE'
  const xpProgress = xp
    ? Math.min(100, ((xp.totalXp - xpMin[currentLevel]) / (xpMax[currentLevel] - xpMin[currentLevel])) * 100)
    : 0

  return (
    <div style={{ width: '100%' }}>

      {/* Title */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>
            Good {getGreeting()}, {user.name?.split(' ')[0] || 'there'}
          </h1>
          <p style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>Here's what's happening in your workspace today.</p>
        </div>

        {/* Compact XP strip — top right */}
        {xp && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 10, padding: '7px 14px',
          }}>
            {/* Rank badge — level initial in a hex-like shape */}
            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill={levelColors[currentLevel]} opacity="0.18" />
                <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke={levelColors[currentLevel]} strokeWidth="1.5" />
                <text x="16" y="21" textAnchor="middle" fill={levelColors[currentLevel]}
                  fontSize="12" fontWeight="800" fontFamily="system-ui">
                  {currentLevel[0]}
                </text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{xp.totalXp} XP</div>
              <div style={{ fontSize: 9, color: levelColors[currentLevel], fontWeight: 700, marginTop: 2, letterSpacing: '0.5px' }}>{currentLevel}</div>
            </div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
            {/* Progress ring mini */}
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="14" cy="14" r="10" fill="none" stroke={levelColors[currentLevel]}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 10}`}
                strokeDashoffset={`${2 * Math.PI * 10 * (1 - xpProgress / 100)}`}
                transform="rotate(-90 14 14)" />
            </svg>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
            {/* Streak */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>{xp.currentStreak >= 3 ? '🔥' : '💧'}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{xp.currentStreak}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Project Stats */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Projects</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {projectStats.map(s => <StatCard key={s.label} {...s} loading={dashLoading} />)}
      </div>

      {/* HR Stats — Admin + Manager only */}
      {user.role !== 'EMPLOYEE' && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>HR Overview</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {hrStats.map(s => <StatCard key={s.label} {...s} loading={empLoading || leaveLoading || attLoading} />)}
          </div>
        </>
      )}

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: 12 }}>

        {/* Recent Projects */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Projects</span>
            <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4f46e5', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {dashLoading ? (
            <div style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : recentProjects.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#9ca3af' }}>
              <FolderKanban size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No projects yet</p>
            </div>
          ) : recentProjects.map((p, i) => {
            const sc = statusConfig[p.status] || statusConfig.PLANNING
            return (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: i < recentProjects.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
              </div>
            )
          })}
        </div>

        {/* Recent Time Logs */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={14} color="#374151" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Time Logs</span>
          </div>
          {dashLoading ? (
            <div style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : recentLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#9ca3af' }}>
              <Activity size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No time logs yet</p>
            </div>
          ) : recentLogs.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < recentLogs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                <div style={{ fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#374151', flexShrink: 0 }}>T-{log.taskId}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{log.notes || 'No notes'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{log.logDate}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', flexShrink: 0 }}>{log.hoursLogged}h</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'New Project',    path: '/projects'  },
              { label: 'Log Time',       path: '/timelogs'  },
              { label: 'Apply Leave',    path: '/leaves'    },
              { label: 'View Members',   path: '/members'   },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#1e293b',
                cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 500,
                transition: 'background 0.15s',
              }}>
                <Plus size={13} color="#6366f1" />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
