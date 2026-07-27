import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Clock, CheckCircle, AlertCircle, LogOut, Pencil, Trash2, X, LogIn, UserPlus } from 'lucide-react'
import api from '../api/axios'
import { canManage, canAdmin } from '../auth/roles'
import AttendanceHistory from '../components/AttendanceHistory'

const statusStyle = {
  PRESENT:  { background: '#f0fdf4', color: '#16a34a' },
  LATE:     { background: '#fffbeb', color: '#d97706' },
  HALF_DAY: { background: '#EEF2F8', color: '#3155A4' },
  ABSENT:   { background: '#fef2f2', color: '#dc2626' },
}

const statusLabel = {
  PRESENT:  'Present',
  LATE:     'Late',
  HALF_DAY: 'Half Day',
  ABSENT:   'Absent',
}

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AttendancePage() {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const user        = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ employeeId: '', notes: '' })
  const [editingRecord, setEditingRecord] = useState(null) // { id, checkInTime, checkOutTime, status, notes }
  const [editForm, setEditForm]     = useState({})

  // Fetch today's attendance records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then(r => Array.isArray(r.data) ? r.data : []),
    refetchInterval: 30000,
  })

  // Self-service: my own attendance today ({ enrolled, employeeName, record })
  const { data: myStatus = {}, isLoading: myLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => api.get('/attendance/me/today').then(r => r.data ?? {}),
    refetchInterval: 30000,
  })

  // Dono queries refresh — mera card + neeche ki admin table, dono turant update
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['my-attendance'] })
    queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
  }

  const meCheckInMutation = useMutation({
    mutationFn: () => api.post('/attendance/me/checkin', {}),
    onSuccess: refreshAll,
  })

  const meCheckOutMutation = useMutation({
    mutationFn: () => api.post('/attendance/me/checkout'),
    onSuccess: refreshAll,
  })

  // Fetch employees for dropdown + name lookup
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })

  const empMap = Object.fromEntries(employees.map(e => [e.id, e]))

  // Already checked-in employee IDs (to disable them in dropdown)
  const checkedInIds = new Set(records.map(r => r.employeeId))

  const checkInMutation = useMutation({
    mutationFn: (data) => api.post('/attendance/checkin', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      setShowForm(false)
      setForm({ employeeId: '', notes: '' })
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: (employeeId) => api.post('/attendance/checkout', { employeeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-today'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/attendance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      setEditingRecord(null)
    },
  })

  // Admin-only delete. Also refresh the self-service card so my own "Check In" button
  // reappears if I deleted my own record.
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/attendance/${id}`),
    onSuccess: refreshAll,
  })

  function startEdit(r) {
    setEditingRecord(r)
    setEditForm({
      checkInTime:  r.checkInTime  ? r.checkInTime.slice(0, 16)  : '',
      checkOutTime: r.checkOutTime ? r.checkOutTime.slice(0, 16) : '',
      status: r.status || 'PRESENT',
      notes:  r.notes  || '',
    })
  }

  // Stats
  const present  = records.filter(r => r.status === 'PRESENT').length
  const late     = records.filter(r => r.status === 'LATE').length
  const halfDay  = records.filter(r => r.status === 'HALF_DAY').length
  const checkedOut = records.filter(r => r.checkOutTime !== null).length

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Attendance</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{todayLabel()}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#16A34A', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 14,
            fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={14} /> Check In
        </button>
      </div>

      {/* My Attendance — self-service card */}
      <MyAttendanceCard
        status={myStatus}
        loading={myLoading}
        user={user}
        onCheckIn={() => meCheckInMutation.mutate()}
        onCheckOut={() => meCheckOutMutation.mutate()}
        checkInPending={meCheckInMutation.isPending}
        checkOutPending={meCheckOutMutation.isPending}
        error={meCheckInMutation.isError || meCheckOutMutation.isError}
        onAddSelf={() => navigate('/employees')}
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Today',  value: records.length, icon: Clock,       color: '#16A34A', bg: '#EAF7EE' },
          { label: 'Present',      value: present,        icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Late',         value: late,           icon: AlertCircle, color: '#d97706', bg: '#fffbeb' },
          { label: 'Checked Out',  value: checkedOut,     icon: LogOut,      color: '#64748b', bg: '#f1f5f9' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>{label}</span>
              <div style={{ background: bg, borderRadius: 8, padding: 6 }}>
                <Icon size={14} color={color} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Check-in form */}
      {showForm && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>EMPLOYEE</label>
            <select
              value={form.employeeId}
              onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }}
            >
              <option value="">-- Select employee --</option>
              {employees.filter(e => e.isActive).map(e => (
                <option key={e.id} value={e.id} disabled={checkedInIds.has(e.id)}>
                  {e.fullName}{checkedInIds.has(e.id) ? ' (already in)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>NOTES (optional)</label>
            <input
              placeholder="e.g. Working from office"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <button
            disabled={!form.employeeId || checkInMutation.isPending}
            onClick={() => checkInMutation.mutate({ employeeId: Number(form.employeeId), notes: form.notes || null })}
            style={{
              background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontSize: 14, fontWeight: 500,
              cursor: form.employeeId ? 'pointer' : 'not-allowed',
            }}
          >
            {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
          </button>
          <button
            onClick={() => { setShowForm(false); checkInMutation.reset() }}
            style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
          {checkInMutation.isError && (
            <p style={{ fontSize: 13, color: '#ef4444', width: '100%', margin: 0 }}>
              Failed. Employee may already be checked in today.
            </p>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Edit Attendance Record</h2>
              <button onClick={() => setEditingRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbSt}>Check-in Time</label>
                <input type="datetime-local" value={editForm.checkInTime}
                  onChange={e => setEditForm(f => ({ ...f, checkInTime: e.target.value }))}
                  style={inSt} />
              </div>
              <div>
                <label style={lbSt}>Check-out Time</label>
                <input type="datetime-local" value={editForm.checkOutTime}
                  onChange={e => setEditForm(f => ({ ...f, checkOutTime: e.target.value }))}
                  style={inSt} />
              </div>
              <div>
                <label style={lbSt}>Status</label>
                <select value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  style={inSt}>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
              <div>
                <label style={lbSt}>Notes</label>
                <input placeholder="Optional notes" value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  style={inSt} />
              </div>
            </div>

            {updateMutation.isError && (
              <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>Failed to update. Try again.</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditingRecord(null)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, cursor: 'pointer', background: '#fff', color: '#64748b' }}>
                Cancel
              </button>
              <button
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: editingRecord.id, data: {
                  checkInTime:  editForm.checkInTime  ? editForm.checkInTime  + ':00' : null,
                  checkOutTime: editForm.checkOutTime ? editForm.checkOutTime + ':00' : null,
                  status: editForm.status,
                  notes:  editForm.notes || null,
                }})}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: '#16A34A', color: '#fff' }}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px 140px', minWidth: 680, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {['Employee', 'Check In', 'Check Out', 'Status', 'Hours', ''].map(col => (
            <span key={col} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 14 }}>
              <Clock size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No attendance records today</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Click "Check In" to mark today's attendance</p>
          </div>
        ) : (
          records.map((r, i) => {
            const emp = empMap[r.employeeId]
            const st  = statusStyle[r.status] || { background: '#f1f5f9', color: '#64748b' }
            return (
              <div key={r.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px 140px', minWidth: 680,
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < records.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                {/* Employee */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: '#EAF7EE', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16A34A',
                  }}>
                    {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {emp?.fullName ?? `Employee #${r.employeeId}`}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                      {emp?.designation ?? emp?.department ?? ''}
                    </p>
                  </div>
                </div>

                {/* Check In */}
                <span style={{ fontSize: 14, color: '#334155' }}>{formatTime(r.checkInTime)}</span>

                {/* Check Out */}
                <span style={{ fontSize: 14, color: r.checkOutTime ? '#334155' : '#cbd5e1' }}>
                  {formatTime(r.checkOutTime)}
                </span>

                {/* Status */}
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600, ...st,
                }}>
                  {statusLabel[r.status] || r.status}
                </span>

                {/* Hours */}
                <span style={{ fontSize: 14, color: r.hoursWorked ? '#334155' : '#cbd5e1' }}>
                  {r.hoursWorked ? `${r.hoursWorked}h` : '—'}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {!r.checkOutTime && (
                    <button
                      onClick={() => checkOutMutation.mutate(r.employeeId)}
                      disabled={checkOutMutation.isPending}
                      style={{ fontSize: 13, padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Check Out
                    </button>
                  )}
                  {/* Edit + delete are admin-only (backend enforces it too via RoleGuard). */}
                  {canAdmin(user.role) && (
                    <>
                      <button
                        onClick={() => startEdit(r)}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Edit record"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${emp?.fullName ?? 'this employee'}'s attendance record for today?`)) {
                            deleteMutation.mutate(r.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                        title="Delete record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Attendance history — view any past date range (Admin/Manager) */}
      {canManage(user.role) && <AttendanceHistory empMap={empMap} />}
    </div>
  )
}

function MyAttendanceCard({ status, loading, user, onCheckIn, onCheckOut, checkInPending, checkOutPending, error, onAddSelf }) {
  const card = {
    background: 'linear-gradient(180deg, #F1FBF4 0%, #ffffff 60%)',
    border: '1px solid #D6EDDD', borderRadius: 14, padding: '20px 22px', marginBottom: 20,
  }
  const eyebrow = { fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#16A34A', margin: 0 }

  // Loading
  if (loading) {
    return <div style={card}><p style={eyebrow}>My Attendance</p><p style={{ fontSize: 14, color: '#64748b', margin: '8px 0 0' }}>Loading your status…</p></div>
  }

  // State 1 — not enrolled (logged-in email ka koi employee record nahi)
  if (!status.enrolled) {
    return (
      <div style={card}>
        <p style={eyebrow}>My Attendance</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={20} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>You're not in the employee directory yet</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Add yourself as an employee to track your attendance.</p>
            </div>
          </div>
          <button onClick={onAddSelf} className="btn-primary" style={{ flexShrink: 0 }}>
            <UserPlus size={16} /> Add me as an employee
          </button>
        </div>
      </div>
    )
  }

  const record     = status.record
  const name       = status.employeeName || user.name || user.email || 'You'
  const initials   = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const checkedIn  = !!record
  const checkedOut = !!record?.checkOutTime
  const st         = record ? (statusStyle[record.status] || { background: '#f1f5f9', color: '#64748b' }) : null

  return (
    <div style={card}>
      <p style={eyebrow}>My Attendance — {todayLabel()}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 12 }}>

        {/* Identity + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{name}</p>
            {checkedIn ? (
              <span style={{ display: 'inline-block', marginTop: 5, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...st }}>
                {statusLabel[record.status] || record.status}
              </span>
            ) : (
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Ready to start your day</p>
            )}
          </div>
        </div>

        {/* Times */}
        {checkedIn && (
          <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            <Metric label="Check In" value={formatTime(record.checkInTime)} />
            <Metric label="Check Out" value={checkedOut ? formatTime(record.checkOutTime) : 'running…'} muted={!checkedOut} />
            <Metric label="Hours" value={record.hoursWorked ? `${record.hoursWorked}h` : '—'} muted={!checkedOut} />
          </div>
        )}

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {!checkedIn && (
            <button onClick={onCheckIn} disabled={checkInPending} className="btn-primary">
              <LogIn size={16} /> {checkInPending ? 'Checking in…' : 'Check In'}
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button onClick={onCheckOut} disabled={checkOutPending} className="btn-primary">
              <LogOut size={16} /> {checkOutPending ? 'Checking out…' : 'Check Out'}
            </button>
          )}
          {checkedOut && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: '#16A34A' }}>
              <CheckCircle size={18} /> Done for today
            </span>
          )}
        </div>
      </div>
      {error && <p style={{ fontSize: 13, color: '#ef4444', margin: '12px 0 0' }}>Something went wrong. Please try again.</p>}
    </div>
  )
}

function Metric({ label, value, muted }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 700, color: muted ? '#cbd5e1' : '#0f172a', margin: '3px 0 0' }}>{value}</p>
    </div>
  )
}

const lbSt = { display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 5 }
const inSt  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
