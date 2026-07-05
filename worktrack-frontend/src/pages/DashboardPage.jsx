import { useQuery } from '@tanstack/react-query'
import { FolderKanban, CheckSquare, Clock, CheckCircle, Plus, ArrowUpRight, Activity } from 'lucide-react'
import api from '../api/axios'

const quickActions = [
  { label: 'New Project', href: '/projects' },
  { label: 'Add Task', href: '/projects' },
  { label: 'Log Time', href: '/timelogs' },
]

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const stats = [
    { label: 'Total Projects', value: isLoading ? '…' : data?.totalProjects ?? 0, icon: FolderKanban, accent: '#4f46e5', light: '#eef2ff' },
    { label: 'Open Tasks',     value: isLoading ? '…' : data?.openTasks ?? 0,     icon: CheckSquare,  accent: '#d97706', light: '#fffbeb' },
    { label: 'In Progress',    value: isLoading ? '…' : data?.inProgressTasks ?? 0, icon: Clock,      accent: '#0284c7', light: '#f0f9ff' },
    { label: 'Completed',      value: isLoading ? '…' : data?.completedTasks ?? 0,  icon: CheckCircle, accent: '#16a34a', light: '#f0fdf4' },
  ]

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Your workspace at a glance</p>
      </div>

      {/* Stats — 4 columns */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(({ label, value, icon: Icon, accent, light }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
              <div style={{ background: light, borderRadius: 8, padding: 7 }}>
                <Icon size={14} color={accent} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bottom — 3 column layout */}
      <div className="bottom-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 240px', gap: 12 }}>

        {/* Recent Projects */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Projects</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4f46e5', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#94a3b8' }}>
            <FolderKanban size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>No projects yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: '#cbd5e1' }}>Create a project to see it here</p>
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={14} color="#64748b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Activity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#94a3b8' }}>
            <Activity size={24} strokeWidth={1.2} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>No activity yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: '#cbd5e1' }}>Actions will show here</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map(({ label }) => (
              <button key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, color: '#334155', cursor: 'pointer',
                textAlign: 'left',
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
