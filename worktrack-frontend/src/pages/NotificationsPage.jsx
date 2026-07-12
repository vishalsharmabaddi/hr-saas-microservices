import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Check } from 'lucide-react'
import api from '../api/axios'

const typeStyle = {
  LEAVE_APPROVED:    { background: '#f0fdf4', color: '#16a34a', label: 'Leave Approved' },
  LEAVE_REJECTED:    { background: '#fef2f2', color: '#dc2626', label: 'Leave Rejected' },
  PAYSLIP_GENERATED: { background: '#EAF7EE', color: '#15803d', label: 'Payslip Ready' },
  MANAGER_NUDGE:     { background: '#fefce8', color: '#a16207', label: 'Appreciation' },
}

function timeAgo(dt) {
  if (!dt) return ''
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => Array.isArray(r.data) ? r.data : []),
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

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', color: '#16A34A', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '8px 14px', fontSize: 14,
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, display: 'inline-block', marginBottom: 14 }}>
              <Bell size={28} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No notifications yet</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
              Approve a leave request to see Kafka event here
            </p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const ts = typeStyle[n.type] || { background: '#f1f5f9', color: '#64748b', label: n.type }
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '16px 20px',
                borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: n.isRead ? '#fff' : '#fafbff',
                transition: 'background 0.2s',
              }}>
                {/* Dot indicator */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: n.isRead ? '#e2e8f0' : '#16A34A',
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                      ...ts,
                    }}>
                      {ts.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#1e293b', margin: 0, fontWeight: n.isRead ? 400 : 500 }}>
                    {n.message}
                  </p>
                  {n.employeeName && (
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>
                      Employee: {n.employeeName}
                    </p>
                  )}
                </div>

                {/* Mark read button */}
                {!n.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    title="Mark as read"
                  >
                    <Check size={13} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
