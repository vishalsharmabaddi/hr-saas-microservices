import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Clock, Plus, Calendar, TrendingUp, Timer, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import api from '../api/axios'

const EMPLOYEE_ID = 1
const TODAY = new Date().toISOString().split('T')[0]
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekForOffset(offset) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
    monday: new Date(monday),
    label: `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`,
  }
}

function getMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { from: first, to: last }
}

const MONTH = getMonthRange()

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Log Time Modal ───────────────────────────────────────────────────────────
function LogTimeModal({ onClose }) {
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [form, setForm] = useState({ logDate: TODAY, hoursLogged: '', notes: '' })
  const queryClient = useQueryClient()

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const { data: taskLists = [] } = useQuery({
    queryKey: ['tasklists', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasklists`).then(r => r.data),
    enabled: !!projectId,
  })

  const firstTaskListId = taskLists[0]?.id ?? null

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', firstTaskListId],
    queryFn: () => api.get(`/tasks/tasklist/${firstTaskListId}`).then(r => r.data),
    enabled: !!firstTaskListId,
  })

  const logMutation = useMutation({
    mutationFn: (data) => api.post('/timelogs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelogs'] })
      onClose()
    },
  })

  const canSubmit = taskId && form.logDate && form.hoursLogged && !logMutation.isPending

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '24px 28px',
        width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Log Time</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>Project</label>
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setTaskId('') }}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }}
            >
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {projectId && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>Task</label>
              <select
                value={taskId}
                onChange={e => setTaskId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff' }}
              >
                <option value="">Select task...</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              {taskLists.length > 0 && tasks.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>No tasks in this project yet.</p>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>Date</label>
              <input
                type="date"
                value={form.logDate}
                onChange={e => setForm(f => ({ ...f, logDate: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>Hours</label>
              <input
                type="number" step="0.5" min="0.5" max="24" placeholder="e.g. 2.5"
                value={form.hoursLogged}
                onChange={e => setForm(f => ({ ...f, hoursLogged: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Notes — what did you work on?
            </label>
            <textarea
              rows={3}
              placeholder="Implemented login API, fixed auth bug..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13,
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          {logMutation.isError && (
            <p style={{ fontSize: 12, color: '#ef4444' }}>Failed to save. Please try again.</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: 13, cursor: 'pointer', background: '#fff', color: '#64748b',
            }}>Cancel</button>
            <button
              disabled={!canSubmit}
              onClick={() => logMutation.mutate({
                taskId: Number(taskId),
                employeeId: EMPLOYEE_ID,
                logDate: form.logDate,
                hoursLogged: Number(form.hoursLogged),
                notes: form.notes,
              })}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 'none',
                fontSize: 13, fontWeight: 500,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                background: canSubmit ? '#4f46e5' : '#e2e8f0',
                color: canSubmit ? '#fff' : '#94a3b8',
              }}
            >
              {logMutation.isPending ? 'Saving...' : 'Log Time'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TimeLogsPage() {
  const [showModal, setShowModal] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const isCustom = !!(customFrom && customTo)
  const week = getWeekForOffset(weekOffset)
  const queryFrom = isCustom ? customFrom : week.from
  const queryTo   = isCustom ? customTo   : week.to

  const { data: weekLogs = [], isLoading } = useQuery({
    queryKey: ['timelogs', 'range', EMPLOYEE_ID, queryFrom, queryTo],
    queryFn: () =>
      api.get(`/timelogs/employee/${EMPLOYEE_ID}?from=${queryFrom}&to=${queryTo}`).then(r => r.data),
  })

  const { data: monthLogs = [] } = useQuery({
    queryKey: ['timelogs', 'month', EMPLOYEE_ID],
    queryFn: () =>
      api.get(`/timelogs/employee/${EMPLOYEE_ID}?from=${MONTH.from}&to=${MONTH.to}`).then(r => r.data),
  })

  const todayHours = weekLogs.filter(l => l.logDate === TODAY).reduce((s, l) => s + l.hoursLogged, 0)
  const weekHours  = weekLogs.reduce((s, l) => s + l.hoursLogged, 0)
  const monthHours = monthLogs.reduce((s, l) => s + l.hoursLogged, 0)
  const avgPerDay  = new Date().getDate() > 0 ? (monthHours / new Date().getDate()).toFixed(1) : '0.0'

  // Group logs by date, sorted descending
  const grouped = weekLogs.reduce((acc, log) => {
    if (!acc[log.logDate]) acc[log.logDate] = []
    acc[log.logDate].push(log)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Bar chart data
  const barData = DAY_NAMES.map((day, i) => {
    const d = new Date(week.monday)
    d.setDate(week.monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const hours = weekLogs.filter(l => l.logDate === dateStr).reduce((s, l) => s + l.hoursLogged, 0)
    return { day, hours, isToday: dateStr === TODAY }
  })
  const maxHours = Math.max(...barData.map(d => d.hours), 1)

  const summaryStats = [
    { label: "Today's Hours", value: `${todayHours.toFixed(1)}h`, icon: Clock, accent: '#4f46e5', light: '#eef2ff' },
    { label: 'This Week', value: `${weekHours.toFixed(1)}h`, icon: Calendar, accent: '#0284c7', light: '#f0f9ff' },
    { label: 'This Month', value: `${monthHours.toFixed(1)}h`, icon: TrendingUp, accent: '#16a34a', light: '#f0fdf4' },
    { label: 'Avg / Day', value: `${avgPerDay}h`, icon: Timer, accent: '#d97706', light: '#fffbeb' },
  ]

  return (
    <div style={{ maxWidth: 1100 }}>

      {showModal && <LogTimeModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>Time Logs</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Daily work tracker — your EOD report</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#4f46e5', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13,
            fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={14} />
          Log Time
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {summaryStats.map(({ label, value, icon: Icon, accent, light }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
              <div style={{ background: light, borderRadius: 8, padding: 6 }}>
                <Icon size={13} color={accent} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>

        {/* Logs list — grouped by date */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>

          {/* Week / range nav bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
          }}>
            <button
              onClick={() => { if (!isCustom) setWeekOffset(o => o - 1) }}
              style={{
                background: 'none', border: 'none', padding: 4, display: 'flex', alignItems: 'center',
                cursor: isCustom ? 'not-allowed' : 'pointer',
                color: isCustom ? '#cbd5e1' : '#64748b',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Clickable date label — opens inline date picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDatePicker(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isCustom ? '#eef2ff' : 'transparent',
                  border: `1px solid ${showDatePicker ? '#6366f1' : isCustom ? '#c7d2fe' : '#e2e8f0'}`,
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <Calendar size={13} color={isCustom ? '#4f46e5' : '#64748b'} />
                <span style={{ fontSize: 13, fontWeight: 500, color: isCustom ? '#4f46e5' : '#0f172a' }}>
                  {isCustom ? `${customFrom} → ${customTo}` : week.label}
                </span>
                <Filter size={11} color={isCustom ? '#4f46e5' : '#94a3b8'} />
              </button>

              {/* Inline date picker popover */}
              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: '16px 18px', zIndex: 50, minWidth: 260,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 12, letterSpacing: '0.4px' }}>
                    CUSTOM DATE RANGE
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>FROM</label>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={e => setCustomFrom(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>TO</label>
                      <input
                        type="date"
                        value={customTo}
                        min={customFrom}
                        onChange={e => setCustomTo(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isCustom && (
                        <button
                          onClick={() => { setCustomFrom(''); setCustomTo(''); setWeekOffset(0); setShowDatePicker(false) }}
                          style={{
                            flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #e2e8f0',
                            fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer', background: '#f8fafc',
                          }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => setShowDatePicker(false)}
                        style={{
                          flex: 1, padding: '7px', borderRadius: 8, border: 'none',
                          fontSize: 12, fontWeight: 500, color: '#fff',
                          cursor: 'pointer', background: '#4f46e5',
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(isCustom || weekOffset !== 0) && (
              <button
                onClick={() => { setCustomFrom(''); setCustomTo(''); setWeekOffset(0); setShowDatePicker(false) }}
                style={{
                  fontSize: 11, fontWeight: 500, color: '#4f46e5',
                  background: '#eef2ff', border: 'none', borderRadius: 4,
                  padding: '2px 8px', cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}

            <button
              onClick={() => { if (!isCustom) setWeekOffset(o => o + 1) }}
              disabled={isCustom || weekOffset >= 0}
              style={{
                background: 'none', border: 'none', padding: 4, display: 'flex', alignItems: 'center',
                cursor: (!isCustom && weekOffset < 0) ? 'pointer' : 'not-allowed',
                color: (!isCustom && weekOffset < 0) ? '#64748b' : '#cbd5e1',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px',
            padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
          }}>
            {['Task / Notes', 'Hours'].map(col => (
              <span key={col} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : sortedDates.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <Clock size={22} color="#94a3b8" strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>No time logs this week</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, marginBottom: 18 }}>
                {isCustom ? `No entries between ${customFrom} and ${customTo}.` : weekOffset < 0 ? 'No entries logged this week.' : 'Start tracking your work hours.'}
              </p>
              {!isCustom && weekOffset === 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#4f46e5', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  Log your first entry
                </button>
              )}
            </div>
          ) : (
            sortedDates.map(date => {
              const entries = grouped[date]
              const dayTotal = entries.reduce((s, l) => s + l.hoursLogged, 0)
              const isToday = date === TODAY
              return (
                <div key={date}>
                  {/* Date header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px',
                    background: isToday ? '#fafafe' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isToday && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#4f46e5',
                          background: '#eef2ff', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.3px',
                        }}>TODAY</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        {formatDate(date)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: '#4f46e5',
                      background: '#eef2ff', borderRadius: 6, padding: '3px 10px',
                    }}>
                      {dayTotal.toFixed(1)}h
                    </span>
                  </div>

                  {/* Entries for this date */}
                  {entries.map((log, i) => (
                    <div
                      key={log.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px',
                        padding: '12px 20px 12px 32px',
                        borderBottom: '1px solid #f8fafc',
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: '#94a3b8',
                            background: '#f1f5f9', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace',
                          }}>
                            T-{log.taskId}
                          </span>
                          {log.notes ? (
                            <span style={{ fontSize: 13, color: '#1e293b' }}>{log.notes}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No notes</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#4f46e5' }}>{log.hoursLogged}h</span>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Bar chart */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${weekOffset < 0 ? Math.abs(weekOffset) : ''}w ago`}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
              {barData.map(({ day, hours, isToday }) => {
                const barH = hours > 0 ? Math.max(8, (hours / maxHours) * 56) : 4
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    {hours > 0 && (
                      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>{hours}h</span>
                    )}
                    <div style={{
                      width: '100%',
                      background: isToday ? '#4f46e5' : hours > 0 ? '#818cf8' : '#eef2ff',
                      borderRadius: 4, height: barH, transition: 'height 0.3s',
                    }} />
                    <span style={{ fontSize: 10, fontWeight: isToday ? 600 : 400, color: isToday ? '#4f46e5' : '#94a3b8' }}>
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              {weekHours.toFixed(1)}h total this week
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Summary</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Entries', value: weekLogs.length },
                { label: 'Week total', value: `${weekHours.toFixed(1)}h` },
                { label: 'Month total', value: `${monthHours.toFixed(1)}h` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: '#f8fafc', border: '1px dashed #e2e8f0',
            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              Click the date range above to filter by custom dates
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
