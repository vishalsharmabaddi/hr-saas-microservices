import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Calendar, Users, CheckSquare, Circle, CheckCircle2, Pencil, Trash2, X, Timer } from 'lucide-react'
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
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' })
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [loggingTaskId, setLoggingTaskId] = useState(null)
  const [logForm, setLogForm] = useState({ logDate: new Date().toISOString().slice(0, 10), hoursLogged: '', notes: '' })

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

  const editTask = useMutation({
    mutationFn: ({ taskId, form }) => api.put(`/tasks/${taskId}`, {
      taskListId: defaultList?.id,
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditingTaskId(null)
    },
  })

  const deleteTask = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const logTime = useMutation({
    mutationFn: (taskId) => api.post('/timelogs', {
      taskId,
      employeeId: 1,
      logDate: logForm.logDate,
      hoursLogged: parseFloat(logForm.hoursLogged),
      notes: logForm.notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setLoggingTaskId(null)
      setLogForm({ logDate: new Date().toISOString().slice(0, 10), hoursLogged: '', notes: '' })
    },
  })

  const removeMember = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${id}/members/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', id] }),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ taskId, currentStatus }) => api.put(`/tasks/${taskId}`, {
      taskListId: defaultList?.id,
      status: currentStatus === 'OPEN' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'COMPLETED' : 'OPEN',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const changeStatus = useMutation({
    mutationFn: (newStatus) => api.put(`/projects/${id}`, {
      name: project.name,
      description: project.description,
      type: project.type,
      billingType: project.billingType,
      startDate: project.startDate,
      endDate: project.endDate,
      status: newStatus,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowStatusMenu(false)
    },
  })

  const startEdit = (task) => {
    setEditingTaskId(task.id)
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate || '',
    })
    setShowAddTask(false)
  }

  if (projectLoading) {
    return <div style={{ padding: 32, color: '#94a3b8', fontSize: 14 }}>Loading…</div>
  }

  const status = statusColors[project?.status] || statusColors.PLANNING
  const isEditable = ['PLANNING', 'IN_PROGRESS'].includes(project?.status)

  const bannerConfig = {
    ON_HOLD:   { bg: '#fffbeb', border: '#fde68a', color: '#92400e', text: 'This project is on hold — no new tasks or members can be added.' },
    COMPLETED: { bg: '#f0fdf4', border: '#bbf7d0', color: '#14532d', text: 'This project is completed — it is now read-only.' },
    CANCELLED: { bg: '#fef2f2', border: '#fecaca', color: '#7f1d1d', text: 'This project is cancelled — it is now read-only.' },
  }
  const banner = bannerConfig[project?.status]

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
          {/* Status badge — click to change */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 8,
                background: status.bg, color: status.color,
                border: `1px solid ${status.color}30`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {project?.status?.replace('_', ' ')}
              <span style={{ fontSize: 10 }}>▾</span>
            </button>

            {showStatusMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 50, minWidth: 160, overflow: 'hidden',
              }}>
                {Object.entries(statusColors).map(([s, style]) => (
                  <button
                    key={s}
                    onClick={() => changeStatus.mutate(s)}
                    style={{
                      width: '100%', padding: '9px 14px', border: 'none',
                      background: project?.status === s ? style.bg : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, color: style.color, fontWeight: project?.status === s ? 600 : 400,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = style.bg}
                    onMouseLeave={e => e.currentTarget.style.background = project?.status === s ? style.bg : '#fff'}
                  >
                    {project?.status === s && <span style={{ fontSize: 10 }}>✓</span>}
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* Status banner */}
      {banner && (
        <div style={{
          background: banner.bg, border: `1px solid ${banner.border}`,
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: banner.color, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span>
          {banner.text}
        </div>
      )}

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
          {/* Add Task button — only when editable */}
          <div style={{ marginBottom: 12 }}>
            {!showAddTask && !isEditable ? null : !showAddTask ? (
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
                const isDone = task.status === 'COMPLETED'
                const isEditing = editingTaskId === task.id

                if (isEditing) {
                  return (
                    <div key={task.id} style={{
                      padding: '14px 18px', borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: '#fafafe',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          autoFocus
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          style={{ ...inputStyle, width: '100%' }}
                        />
                        <textarea
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Description..."
                          rows={2}
                          style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            value={editForm.priority}
                            onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                            style={inputStyle}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                            style={inputStyle}
                          />
                          <button
                            disabled={!editForm.title.trim() || editTask.isPending}
                            onClick={() => editTask.mutate({ taskId: task.id, form: editForm })}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none',
                              background: '#4f46e5', color: '#fff', fontSize: 13,
                              fontWeight: 500, cursor: 'pointer',
                            }}
                          >
                            {editTask.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            style={{
                              padding: '8px 10px', borderRadius: 8,
                              border: '1px solid #e2e8f0', background: '#fff',
                              fontSize: 13, color: '#64748b', cursor: 'pointer',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                const isLogging = loggingTaskId === task.id

                return (
                  <div key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}
                    onMouseEnter={e => e.currentTarget.querySelector('.task-actions').style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.querySelector('.task-actions').style.opacity = '0'}
                    onMouseEnter={e => e.currentTarget.querySelector('.task-actions').style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.querySelector('.task-actions').style.opacity = '0'}
                  >
                    {/* Status toggle */}
                    <button
                      onClick={() => toggleStatus.mutate({ taskId: task.id, currentStatus: task.status })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex' }}
                      title={isDone ? 'Mark as Open' : 'Mark as Done'}
                    >
                      {isDone
                        ? <CheckCircle2 size={18} color="#16a34a" strokeWidth={1.8} />
                        : <Circle size={18} color="#cbd5e1" strokeWidth={1.5} />
                      }
                    </button>

                    {/* Title + description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 14, color: isDone ? '#94a3b8' : '#1e293b',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Priority badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px',
                      borderRadius: 6, background: p.bg, color: p.color, flexShrink: 0,
                    }}>
                      {task.priority}
                    </span>

                    {/* Due date */}
                    {task.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
                        <Calendar size={11} /> {task.dueDate}
                      </span>
                    )}

                    {/* Actions — Log Time always; Edit+Delete only when editable */}
                    <div className="task-actions" style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          setLoggingTaskId(loggingTaskId === task.id ? null : task.id)
                          setEditingTaskId(null)
                          setLogForm({ logDate: new Date().toISOString().slice(0, 10), hoursLogged: '', notes: '' })
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: 4, display: 'flex' }}
                        title="Log time"
                      >
                        <Timer size={14} />
                      </button>
                      {isEditable && (<>
                        <button
                          onClick={() => startEdit(task)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}
                          title="Edit task"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${task.title}"?`)) deleteTask.mutate(task.id) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4, display: 'flex' }}
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>)}
                    </div>
                  </div>

                  {/* Inline Log Time form */}
                  {isLogging && (
                    <div style={{
                      background: '#f0f9ff', borderTop: '1px dashed #bae6fd',
                      padding: '12px 18px',
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                          <label style={labelStyle}>Date</label>
                          <input type="date" value={logForm.logDate}
                            onChange={e => setLogForm(f => ({ ...f, logDate: e.target.value }))}
                            style={{ ...inputStyle, width: 140 }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Hours</label>
                          <input type="number" min="0.5" max="24" step="0.5"
                            placeholder="e.g. 2"
                            value={logForm.hoursLogged}
                            onChange={e => setLogForm(f => ({ ...f, hoursLogged: e.target.value }))}
                            style={{ ...inputStyle, width: 90 }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <label style={labelStyle}>Notes (optional)</label>
                          <input
                            placeholder="What did you work on?"
                            value={logForm.notes}
                            onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                            style={{ ...inputStyle, width: '100%' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={!logForm.hoursLogged || logTime.isPending}
                            onClick={() => logTime.mutate(task.id)}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none',
                              background: '#0284c7', color: '#fff', fontSize: 13,
                              fontWeight: 500, cursor: 'pointer',
                            }}
                          >
                            {logTime.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setLoggingTaskId(null)} style={{
                            padding: '8px 10px', borderRadius: 8,
                            border: '1px solid #e2e8f0', background: '#fff',
                            fontSize: 13, color: '#64748b', cursor: 'pointer',
                          }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
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
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    borderBottom: i < members.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.querySelector('.member-actions').style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.querySelector('.member-actions').style.opacity = '0'}
                >
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
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: '#475569',
                  }}>
                    {m.role?.replace('_', ' ')}
                  </span>
                  {isEditable && (
                    <div className="member-actions" style={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                      <button
                        onClick={() => { if (window.confirm(`Remove Employee #${m.employeeId} from this project?`)) removeMember.mutate(m.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4, display: 'flex' }}
                        title="Remove from project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
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
