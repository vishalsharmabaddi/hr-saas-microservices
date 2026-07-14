import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, X, Clock, Calendar } from 'lucide-react'
import api from '../api/axios'
import { canManage } from '../auth/roles'
import DateRangeFilter, { thisMonthRange } from '../components/DateRangeFilter'

const LEAVE_TYPES = ['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'EMERGENCY']
const typeLabel   = { SICK: 'Sick Leave', CASUAL: 'Casual Leave', EARNED: 'Earned Leave', UNPAID: 'Unpaid Leave', EMERGENCY: 'Emergency Leave' }
const typeStyle   = {
  SICK:      { background: '#fef2f2', color: '#dc2626' },
  CASUAL:    { background: '#EEF2F8', color: '#3155A4' },
  EARNED:    { background: '#f0fdf4', color: '#16a34a' },
  UNPAID:    { background: '#fafafa', color: '#64748b' },
  EMERGENCY: { background: '#fff7ed', color: '#ea580c' },
}

const statusStyle = {
  PENDING:  { background: '#fffbeb', color: '#d97706' },
  APPROVED: { background: '#f0fdf4', color: '#16a34a' },
  REJECTED: { background: '#fef2f2', color: '#dc2626' },
}

const TABS = ['All', 'PENDING', 'APPROVED', 'REJECTED']

const emptyForm = { employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' }

export default function LeavePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab]       = useState('All')
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(emptyForm)
  const [approvingId, setApprovingId]   = useState(null)
  const [comment, setComment]           = useState('')
  const canApprove = canManage(JSON.parse(localStorage.getItem('wt_user') || '{}').role)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const empMap = Object.fromEntries(employees.map(e => [e.id, e]))

  const [range, setRange] = useState(thisMonthRange())
  const statusParam = activeTab === 'All' ? undefined : activeTab
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', activeTab, range.from, range.to],
    queryFn: () => api.get('/leaves', { params: {
      ...(statusParam ? { status: statusParam } : {}),
      from: range.from, to: range.to,
    } }).then(r => Array.isArray(r.data) ? r.data : []),
  })

  const applyMutation = useMutation({
    mutationFn: (data) => api.post('/leaves', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }) => api.put(`/leaves/${id}/approve`, { managerComment: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      setApprovingId(null)
      setComment('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }) => api.put(`/leaves/${id}/reject`, { managerComment: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      setApprovingId(null)
      setComment('')
    },
  })

  const pending  = leaves.filter(l => l.status === 'PENDING').length
  const approved = leaves.filter(l => l.status === 'APPROVED').length
  const rejected = leaves.filter(l => l.status === 'REJECTED').length

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage employee leave applications</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#16A34A', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 14px', fontSize: 14,
          fontWeight: 500, cursor: 'pointer', flexShrink: 0,
        }}>
          <Plus size={14} /> Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending',  value: pending,  color: '#d97706', bg: '#fffbeb', icon: Clock },
          { label: 'Approved', value: approved, color: '#16a34a', bg: '#f0fdf4', icon: Check },
          { label: 'Rejected', value: rejected, color: '#dc2626', bg: '#fef2f2', icon: X    },
        ].map(({ label, value, color, bg, icon: Icon }) => (
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

      {/* Apply Leave Form */}
      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>New Leave Application</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbSt}>EMPLOYEE</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={inSt}>
                <option value="">-- Select employee --</option>
                {employees.filter(e => e.isActive).map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbSt}>LEAVE TYPE</label>
              <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))} style={inSt}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </div>
            <div>
              <label style={lbSt}>START DATE</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inSt} />
            </div>
            <div>
              <label style={lbSt}>END DATE</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inSt} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbSt}>REASON</label>
              <input placeholder="Reason for leave..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={inSt} />
            </div>
          </div>

          {applyMutation.isError && (
            <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>Failed to submit. Check all fields.</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              disabled={!form.employeeId || !form.startDate || !form.endDate || applyMutation.isPending}
              onClick={() => applyMutation.mutate({ ...form, employeeId: Number(form.employeeId) })}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, background: '#16A34A', color: '#fff', cursor: 'pointer' }}
            >
              {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
            <button onClick={() => { setShowForm(false); applyMutation.reset() }}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, cursor: 'pointer', background: '#fff', color: '#64748b' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: 7, border: 'none', fontSize: 14, cursor: 'pointer',
            fontWeight: activeTab === tab ? 600 : 400,
            background: activeTab === tab ? '#fff' : 'transparent',
            color: activeTab === tab ? '#0f172a' : '#64748b',
            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div style={{ marginBottom: 16 }}>
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
      </div>

      {/* Leave List */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 100px 1fr', minWidth: 640, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {['Employee', 'Type', 'Dates', 'Status', 'Actions'].map(col => (
            <span key={col} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 14 }}>
              <Calendar size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No leave requests</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
              {activeTab === 'All' ? 'Click "Apply Leave" to submit a request' : `No ${activeTab.toLowerCase()} requests`}
            </p>
          </div>
        ) : (
          leaves.map((l, i) => {
            const emp = empMap[l.employeeId]
            const ts  = typeStyle[l.leaveType]   || typeStyle.CASUAL
            const ss  = statusStyle[l.status]    || statusStyle.PENDING
            const isActing = approvingId === l.id

            return (
              <div key={l.id}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 140px 100px 1fr', minWidth: 640,
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: '1px solid #f8fafc',
                }}>
                  {/* Employee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                      {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {emp?.fullName ?? `Employee #${l.employeeId}`}
                      </p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Leave type */}
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, ...ts }}>
                    {typeLabel[l.leaveType] || l.leaveType}
                  </span>

                  {/* Dates */}
                  <div>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>{l.startDate}</p>
                    {l.endDate !== l.startDate && (
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>→ {l.endDate}</p>
                    )}
                  </div>

                  {/* Status */}
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, ...ss }}>
                    {l.status}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {l.status === 'PENDING' && canApprove && (
                      <>
                        <button
                          onClick={() => setApprovingId(isActing ? null : l.id)}
                          style={{ fontSize: 13, padding: '5px 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ id: l.id, comment })}
                          disabled={rejectMutation.isPending}
                          style={{ fontSize: 13, padding: '5px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {l.managerComment && (
                      <span title={l.managerComment} style={{
                        display: 'inline-block', maxWidth: 200, fontSize: 13, color: '#64748b',
                        background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6,
                        padding: '3px 9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        Note: {l.managerComment}
                      </span>
                    )}
                  </div>
                </div>

                {/* Approve comment box — expands inline */}
                {isActing && (
                  <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      placeholder="Add comment (optional)..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14 }}
                    />
                    <button
                      onClick={() => approveMutation.mutate({ id: l.id, comment })}
                      disabled={approveMutation.isPending}
                      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      {approveMutation.isPending ? 'Approving...' : 'Confirm Approve'}
                    </button>
                    <button onClick={() => { setApprovingId(null); setComment('') }}
                      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#64748b' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const lbSt = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }
const inSt  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
