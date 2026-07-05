import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Clock, CheckCircle, Plus, ArrowUpRight, Activity } from 'lucide-react'
import api from '../api/axios'

const statusConfig = {
  PLANNING:    { label: 'Planning',    color: '#4f46e5', bg: '#eef2ff' },
  IN_PROGRESS: { label: 'In Progress', color: '#d97706', bg: '#fffbeb' },
  ON_HOLD:     { label: 'On Hold',     color: '#dc2626', bg: '#fef2f2' },
  COMPLETED:   { label: 'Completed',   color: '#16a34a', bg: '#f0fdf4' },
  CANCELLED:   { label: 'Cancelled',   color: '#64748b', bg: '#f1f5f9' },
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const stats = [
    { label: 'Total Projects', value: data?.totalProjects   ?? 0, icon: FolderKanban, accent: '#4f46e5', light: '#eef2ff' },
    { label: 'Open Tasks',     value: data?.openTasks       ?? 0, icon: CheckSquare,  accent: '#d97706', light: '#fffbeb' },
    { label: 'In Progress',    value: data?.inProgressTasks ?? 0, icon: Clock,        accent: '#0284c7', light: '#f0f9ff' },
    { label: 'Completed',      value: data?.completedTasks  ?? 0, icon: CheckCircle,  accent: '#16a34a', light: '#f0fdf4' },
  ]

  const recentProjects = data?.recentProjects ?? []
  const recentLogs     = data?.recentLogs     ?? []

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Your workspace at a glance</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(({ label, value, icon: Icon, accent, light }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
              <div style={{ background: light, borderRadius: 8, padding: 7 }}>
                <Icon size={14} color={accent} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>
              {isLoading ? '…' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 3-column */}
      <div className="bottom-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: 12 }}>

        {/* Recent Projects */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Projects</span>
            <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4f46e5', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all <ArrowUpRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : recentProjects.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#94a3b8' }}>
              <FolderKanban size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No projects yet</p>
            </div>
          ) : recentProjects.map((p, i) => {
            const sc = statusConfig[p.status] || statusConfig.PLANNING
            return (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', cursor: 'pointer',
                  borderBottom: i < recentProjects.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                  {sc.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Recent Time Logs */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={14} color="#64748b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Time Logs</span>
          </div>

          {isLoading ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : recentLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#94a3b8' }}>
              <Activity size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No time logs yet</p>
            </div>
          ) : recentLogs.map((log, i) => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: i < recentLogs.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                <div style={{ fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#475569', flexShrink: 0 }}>
                    T-{log.taskId}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>
                    {log.notes || 'No notes'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{log.logDate}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0284c7', flexShrink: 0 }}>{log.hoursLogged}h</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'New Project',   path: '/projects' },
              { label: 'Log Time',      path: '/timelogs' },
              { label: 'View Members',  path: '/members' },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, color: '#334155', cursor: 'pointer',
                textAlign: 'left', width: '100%',
              }}>
                <Plus size={13} color="#94a3b8" />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
