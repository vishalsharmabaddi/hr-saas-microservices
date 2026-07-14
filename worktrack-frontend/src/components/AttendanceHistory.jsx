import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import api from '../api/axios'
import DateRangeFilter, { thisMonthRange } from './DateRangeFilter'

const statusStyle = {
  PRESENT:  { background: '#f0fdf4', color: '#16a34a', label: 'Present' },
  LATE:     { background: '#fffbeb', color: '#d97706', label: 'Late' },
  HALF_DAY: { background: '#EEF2F8', color: '#3155A4', label: 'Half Day' },
  ABSENT:   { background: '#fef2f2', color: '#dc2626', label: 'Absent' },
}

const fmtTime = dt => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Read-only attendance history for a date range. Uses existing /attendance?from&to endpoint.
export default function AttendanceHistory({ empMap = {} }) {
  const [range, setRange] = useState(thisMonthRange())

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-history', range.from, range.to],
    queryFn: () => api.get('/attendance', { params: { from: range.from, to: range.to } })
      .then(r => Array.isArray(r.data) ? r.data : []),
  })

  const cols = '1fr 130px 110px 110px 100px 80px'

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <History size={16} color="#374151" />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Attendance History</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
          {isLoading ? 'Loading…' : `${records.length} ${records.length === 1 ? 'record' : 'records'}`}
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, minWidth: 640, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Hours'].map(c => (
            <span key={c} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 14 }}>
              <History size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No records in this range</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Pick a different date range above</p>
          </div>
        ) : (
          records.map((r, i) => {
            const emp = empMap[r.employeeId]
            const st  = statusStyle[r.status] || { background: '#f1f5f9', color: '#64748b', label: r.status }
            return (
              <div key={r.id} style={{
                display: 'grid', gridTemplateColumns: cols, minWidth: 640,
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < records.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                {/* Employee — avatar + name (Leave list jaisा) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                    {emp?.firstName?.[0]}{emp?.lastName?.[0]}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{emp?.fullName ?? `Employee #${r.employeeId}`}</p>
                </div>
                <span style={{ fontSize: 13, color: '#475569' }}>{fmtDate(r.attendanceDate)}</span>
                <span style={{ fontSize: 14, color: '#334155' }}>{fmtTime(r.checkInTime)}</span>
                <span style={{ fontSize: 14, color: r.checkOutTime ? '#334155' : '#cbd5e1' }}>{fmtTime(r.checkOutTime)}</span>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: st.background, color: st.color, width: 'fit-content' }}>{st.label}</span>
                <span style={{ fontSize: 14, color: r.hoursWorked ? '#334155' : '#cbd5e1' }}>{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
