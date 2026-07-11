import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, Clock, Plus, ChevronDown } from 'lucide-react'
import api from '../api/axios'

const priorityConfig = {
  LOW:      { bg: '#f1f5f9', color: '#64748b',  label: 'Low' },
  MEDIUM:   { bg: '#EEF2F8', color: '#3155A4',  label: 'Medium' },
  HIGH:     { bg: '#fffbeb', color: '#d97706',  label: 'High' },
  CRITICAL: { bg: '#fef2f2', color: '#dc2626',  label: 'Critical' },
}

const statusConfig = {
  OPEN:        { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: 'Open' },
  IN_PROGRESS: { bg: '#EEF2F8', color: '#3155A4', dot: '#3155A4', label: 'In Progress' },
  COMPLETED:   { bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a', label: 'Completed' },
}

const headerAccent = {
  LOW:      '#64748b',
  MEDIUM:   '#16A34A',
  HIGH:     '#d97706',
  CRITICAL: '#dc2626',
}

export default function TaskDetailPanel({ taskId, onClose }) {
  const queryClient = useQueryClient()
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    hoursLogged: '',
    notes: '',
  })

  // ESC key to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(r => r.data),
    enabled: !!taskId,
  })

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['timelogs', 'task', taskId],
    queryFn: () => api.get(`/timelogs/task/${taskId}`).then(r => r.data),
    enabled: !!taskId,
  })

  const logTimeMutation = useMutation({
    mutationFn: () => api.post('/timelogs', {
      taskId,
      employeeId: 1,
      logDate: logForm.logDate,
      hoursLogged: parseFloat(logForm.hoursLogged),
      notes: logForm.notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelogs', 'task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setLogForm({ logDate: new Date().toISOString().slice(0, 10), hoursLogged: '', notes: '' })
      setShowLogForm(false)
    },
  })

  const totalLogged  = logs.reduce((sum, l) => sum + (l.hoursLogged || 0), 0)
  const estimated    = task?.estimatedHours
  const progress     = estimated ? Math.min((totalLogged / estimated) * 100, 100) : null
  const accent       = headerAccent[task?.priority] || '#16A34A'
  const p            = priorityConfig[task?.priority] || priorityConfig.MEDIUM
  const s            = statusConfig[task?.status]    || statusConfig.OPEN

  const metaItems = [
    { label: 'Created', value: task?.createdAt ? new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
    { label: 'Estimated', value: estimated ? `${estimated}h` : '—' },
    { label: 'Logged', value: totalLogged > 0 ? `${totalLogged.toFixed(1)}h` : '—' },
    { label: 'Due Date', value: task?.dueDate ?? '—' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.22)', zIndex: 100 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: '#fff', boxShadow: '-4px 0 40px rgba(0,0,0,0.14)',
        zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Colored header bar */}
        <div style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
          borderBottom: `3px solid ${accent}`,
          padding: '16px 20px 18px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 12,
              background: `${accent}18`, color: accent,
              padding: '3px 10px', borderRadius: 6, fontWeight: 600,
            }}>
              T-{taskId}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: '4px 6px', display: 'flex', borderRadius: 6,
            }}>
              <X size={15} />
            </button>
          </div>

          {taskLoading ? (
            <div style={{ height: 28, background: '#e2e8f0', borderRadius: 6, width: '60%' }} />
          ) : (
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 14px', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
              {task?.title}
            </h2>
          )}

          {/* Badges */}
          {!taskLoading && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                {s.label}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                background: p.bg, color: p.color, border: `1px solid ${p.color}30`,
              }}>
                {p.label}
              </span>
              {task?.dueDate && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, color: '#64748b', padding: '4px 10px', borderRadius: 20,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <Calendar size={11} /> {task.dueDate}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* Meta grid */}
          {!taskLoading && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '1px', background: '#f1f5f9',
              borderBottom: '1px solid #f1f5f9',
            }}>
              {metaItems.map(({ label, value }) => (
                <div key={label} style={{ background: '#fff', padding: '12px 18px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar — only if estimated hours set */}
          {progress !== null && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</span>
                <span style={{ fontSize: 13, color: accent, fontWeight: 600 }}>{totalLogged.toFixed(1)}h / {estimated}h</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Description
            </p>
            {taskLoading ? (
              <div style={{ height: 16, background: '#f1f5f9', borderRadius: 4, width: '70%' }} />
            ) : task?.description ? (
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            ) : (
              <p style={{ fontSize: 14, color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>No description added</p>
            )}
          </div>

          {/* Time Logs */}
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Time Logs
                </p>
                {logs.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: 20 }}>
                    {totalLogged.toFixed(1)}h
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowLogForm(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 13, fontWeight: 500, color: '#16A34A',
                  background: '#EAF7EE', border: 'none',
                  padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                }}
              >
                <Plus size={12} /> Log Time
              </button>
            </div>

            {/* Quick log form */}
            {showLogForm && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: 14, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelSt}>Date</label>
                    <input type="date" value={logForm.logDate}
                      onChange={e => setLogForm(f => ({ ...f, logDate: e.target.value }))}
                      style={inputSt}
                    />
                  </div>
                  <div style={{ width: 90 }}>
                    <label style={labelSt}>Hours</label>
                    <input type="number" min="0.5" max="24" step="0.5"
                      placeholder="e.g. 2"
                      value={logForm.hoursLogged}
                      onChange={e => setLogForm(f => ({ ...f, hoursLogged: e.target.value }))}
                      style={inputSt}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSt}>Notes (optional)</label>
                  <textarea
                    placeholder="What did you work on?"
                    rows={2}
                    value={logForm.notes}
                    onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ ...inputSt, width: '100%', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={!logForm.hoursLogged || logTimeMutation.isPending}
                    onClick={() => logTimeMutation.mutate()}
                    style={{
                      padding: '7px 16px', borderRadius: 7, border: 'none',
                      background: '#16A34A', color: '#fff', fontSize: 14,
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {logTimeMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setShowLogForm(false)} style={{
                    padding: '7px 12px', borderRadius: 7,
                    border: '1px solid #e2e8f0', background: '#fff',
                    fontSize: 14, color: '#64748b', cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Log entries */}
            {logsLoading ? (
              <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
            ) : logs.length === 0 && !showLogForm ? (
              <div style={{
                background: '#f8fafc', borderRadius: 10, padding: '28px 16px',
                textAlign: 'center', border: '1px dashed #e2e8f0',
              }}>
                <Clock size={24} color="#cbd5e1" strokeWidth={1.2} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>No time logged yet</p>
                <p style={{ fontSize: 13, color: '#cbd5e1', margin: '4px 0 0' }}>Click "Log Time" above to add an entry</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map((log, i) => (
                  <div key={log.id} style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    borderRadius: 10, background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}>
                    {/* Left: date dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7', flexShrink: 0 }} />
                      {i < logs.length - 1 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
                    </div>
                    {/* Right: content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10} /> {log.logDate}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0284c7' }}>{log.hoursLogged}h</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.5 }}>
                        {log.notes || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No notes</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

const labelSt = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }
const inputSt  = {
  padding: '7px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
  fontSize: 14, color: '#0f172a', outline: 'none',
  boxSizing: 'border-box', background: '#fff', width: '100%',
}
