import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Calendar, Users, CheckSquare, Circle, AlertCircle } from 'lucide-react'
import api from '../api/axios'

const priorityColors = {
  LOW:      { bg: '#f1f5f9', color: '#64748b' },
  MEDIUM:   { bg: '#eff6ff', color: '#2563eb' },
  HIGH:     { bg: '#fffbeb', color: '#d97706' },
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
}

const statusColors = {
  PLANNING:    { bg: '#f1f5f9', color: '#475569' },
  IN_PROGRESS: { bg: '#eff6ff', color: '#2563eb' },
  ON_HOLD:     { bg: '#fffbeb', color: '#d97706' },
  COMPLETED:   { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:   { bg: '#fef2f2', color: '#dc2626' },
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' })

  // Fetch project
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  })

  // Fetch task lists
  const { data: taskLists = [] } = useQuery({
    queryKey: ['tasklists', id],
    queryFn: () => api.get(`/projects/${id}/tasklists`).then(r => r.data),
  })

  // Fetch tasks from first task list
  const defaultList = taskLists[0]
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', defaultList?.id],
    queryFn: () => api.get(`/tasks/tasklist/${defaultList.id}`).then(r => r.data),
    enabled: !!defaultList,
  })

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ['members', id],
    queryFn: () => api.get(`/projects/${id}/members`).then(r => r.data),
    enabled: activeTab === 'members',
  })

  // Add task mutation — auto-creates "Backlog" list if none exists
  const addTask = useMutation({
    mutationFn: async (form) => {
      let taskListId = defaultList?.id
      if (!taskListId) {
        const tl = await api.post(`/projects/${id}/tasklists`, { name: 'Backlog' })
        taskListId = tl.data.id
        queryClient.invalidateQueries({ queryKey: ['tasklists', id] })
      }
      return api.post('/tasks', {
        taskListId,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
      }).then(r => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' })
      setShowAddTask(false)
    },
  })

  if (projectLoading) {
    return <div style={{ padding: 32, color: '#94a3b8', fontSize: 14 }}>Loading…</div>
  }

  const status = statusColors[project?.status] || statusColors.PLANNING

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Back + Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/projects')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13,
          padding: 0, marginBottom: 12,
        }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              {project?.name}
            </h1>
            {project?.description && (
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.6 }}>
                {project.description}
              </p>
            )}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 8,
            background: status.bg, color: status.color, flexShrink: 0,
          }}>
            {project?.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Meta info row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          {project?.startDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
              <Calendar size={13} /> Start: {project.startDate}
            </span>
          )}
          {project?.endDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
              <Calendar size={13} /> End: {project.endDate}
            </span>
          )}
          <span style={{ fontSize: 12, color: '#64748b' }}>Type: {project?.type}</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Billing: {project?.billingType?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        {['tasks', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize',
          }}>
            {tab === 'tasks' ? `Tasks (${tasks.length})` : `Members (${members.length})`}
          </button>
        ))}
      </div>

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div>
          {/* Add Task button */}
          <div style={{ marginBottom: 12 }}>
            {!showAddTask ? (
              <button onClick={() => setShowAddTask(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 14px', fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
              }}>
                <Plus size={14} /> Add Task
              </button>
            ) : (
              /* Inline add task form */
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Row 1: Title */}
                  <div>
                    <label style={labelStyle}>Task Title *</label>
                    <input
                      autoFocus
                      value={taskForm.title}
                      onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="What needs to be done?"
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  {/* Row 2: Description */}
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Add details, context, or notes..."
                      rows={2}
                      style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  {/* Row 3: Priority + Date + Buttons */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => addTask.mutate(taskForm)}
                      disabled={!taskForm.title.trim() || addTask.isPending}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: '#4f46e5', color: '#fff', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      {addTask.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowAddTask(false)}
                      style={{
                        padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#fff',
                        fontSize: 13, color: '#64748b', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Task list */}
          {tasks.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '48px 24px', textAlign: 'center',
            }}>
              <CheckSquare size={28} color="#cbd5e1" strokeWidth={1.2} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: '#334155', margin: 0 }}>No tasks yet</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Click "Add Task" to create your first task</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {tasks.map((task, i) => {
                const p = priorityColors[task.priority] || priorityColors.MEDIUM
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px',
                    borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <Circle size={16} color="#cbd5e1" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, color: '#1e293b' }}>{task.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px',
                      borderRadius: 6, background: p.bg, color: p.color,
                    }}>{task.priority}</span>
                    {task.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
                        <Calendar size={11} /> {task.dueDate}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div>
          {members.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '48px 24px', textAlign: 'center',
            }}>
              <Users size={28} color="#cbd5e1" strokeWidth={1.2} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: '#334155', margin: 0 }}>No members yet</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Add team members to this project</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {members.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  borderBottom: i < members.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#eef2ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, color: '#4f46e5', flexShrink: 0,
                  }}>
                    {m.employeeId?.toString().charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>
                      Employee #{m.employeeId}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: '#475569',
                  }}>{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: '#475569', marginBottom: 6,
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: 13, color: '#0f172a', outline: 'none',
  boxSizing: 'border-box', background: '#fff',
}
