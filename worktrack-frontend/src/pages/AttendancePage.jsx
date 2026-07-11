import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Clock, CheckCircle, AlertCircle, LogOut, Pencil, X } from 'lucide-react'
import api from '../api/axios'

const statusStyle = {
  PRESENT:  { background: '#f0fdf4', color: '#16a34a' },
  LATE:     { background: '#fffbeb', color: '#d97706' },
  HALF_DAY: { background: '#EEF2F8', color: '#3155A4' },
}

const statusLabel = {
  PRESENT:  'Present',
  LATE:     'Late',
  HALF_DAY: 'Half Day',
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
                  <button
                    onClick={() => startEdit(r)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                    title="Edit record"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const lbSt = { display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 5 }
const inSt  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
