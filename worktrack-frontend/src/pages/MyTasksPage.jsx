import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ListChecks, Circle, CheckCircle2, Calendar, FolderKanban } from 'lucide-react'
import api from '../api/axios'

const priorityColors = {
  LOW:      { bg: '#f1f5f9', color: '#64748b' },
  MEDIUM:   { bg: '#EEF2F8', color: '#3155A4' },
  HIGH:     { bg: '#fff7ed', color: '#c2410c' },
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
}

export default function MyTasksPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks/assigned/me').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Collaborative status toggle — same open endpoint the project page uses.
  const toggleStatus = useMutation({
    mutationFn: ({ taskId, currentStatus }) => api.patch(`/tasks/${taskId}/status`, {
      status: currentStatus === 'COMPLETED' ? 'OPEN' : 'COMPLETED',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-tasks'] }),
  })

  // Group tasks by their project so the page reads project-by-project.
  const groups = Object.values(tasks.reduce((acc, t) => {
    const key = t.projectId ?? 'none'
    if (!acc[key]) acc[key] = { projectId: t.projectId, projectName: t.projectName || 'Project', tasks: [] }
    acc[key].tasks.push(t)
    return acc
  }, {}))

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Tasks</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          Every task assigned to you, across all your projects.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <ListChecks size={28} color="#cbd5e1" strokeWidth={1.2} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No tasks assigned to you yet</p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
            A manager can assign you a task from any project's Tasks tab.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map(group => (
            <div key={group.projectId ?? 'none'}>
              {/* Project header — click to open the project */}
              <button
                onClick={() => group.projectId && navigate(`/projects/${group.projectId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                  cursor: group.projectId ? 'pointer' : 'default', padding: '0 0 8px', color: '#15803D',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                <FolderKanban size={15} /> {group.projectName}
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>· {group.tasks.length}</span>
              </button>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                {group.tasks.map((task, i) => {
                  const p = priorityColors[task.priority] || priorityColors.MEDIUM
                  const isDone = task.status === 'COMPLETED'
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                        borderBottom: i < group.tasks.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <button
                        onClick={() => toggleStatus.mutate({ taskId: task.id, currentStatus: task.status })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex' }}
                        title={isDone ? 'Mark as Open' : 'Mark as Done'}
                      >
                        {isDone
                          ? <CheckCircle2 size={18} color="#16a34a" strokeWidth={1.8} />
                          : <Circle size={18} color="#cbd5e1" strokeWidth={1.5} />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 15, color: isDone ? '#94a3b8' : '#1e293b',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      <span style={{
                        fontSize: 12, fontWeight: 500, padding: '2px 8px',
                        borderRadius: 6, background: p.bg, color: p.color, flexShrink: 0,
                      }}>
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>
                          <Calendar size={11} /> {task.dueDate}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
