import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, FileDown, Inbox } from 'lucide-react'
import api from '../api/axios'
import { downloadCSV, downloadPDF, loadImageAsset } from '../utils/exportReport'
import logoUrl from '../assets/Taurus-Logo.png'

/* ── formatters ─────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
const empName = (r, m) => r.employeeName || m[r.employeeId]?.fullName || `#${r.employeeId}`

/* ── report configs — columns drive table + CSV + PDF ───────── */
const REPORTS = {
  attendance: {
    label: 'Attendance',
    columns: [
      { label: 'Date',      value: r => fmtDate(r.attendanceDate) },
      { label: 'Employee',  value: (r, m) => empName(r, m) },
      { label: 'Check In',  value: r => fmtTime(r.checkInTime) },
      { label: 'Check Out', value: r => fmtTime(r.checkOutTime) },
      { label: 'Hours',     value: r => r.hoursWorked != null ? String(r.hoursWorked) : '—' },
      { label: 'Status',    value: r => r.status || '—' },
    ],
  },
  leave: {
    label: 'Leave',
    columns: [
      { label: 'Employee', value: (r, m) => empName(r, m) },
      { label: 'Type',     value: r => r.leaveType || '—' },
      { label: 'From',     value: r => fmtDate(r.startDate) },
      { label: 'To',       value: r => fmtDate(r.endDate) },
      { label: 'Days',     value: r => r.totalDays != null ? String(r.totalDays) : '—' },
      { label: 'Status',   value: r => r.status || '—' },
      { label: 'Reason',   value: r => r.reason || '' },
    ],
  },
  employees: {
    label: 'Employees',
    columns: [
      { label: 'Name',        value: r => r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim() },
      { label: 'Email',       value: r => r.email || '' },
      { label: 'Department',  value: r => r.department || '—' },
      { label: 'Designation', value: r => r.designation || '—' },
      { label: 'Type',        value: r => r.employmentType || '—' },
      { label: 'Joined',      value: r => fmtDate(r.joiningDate) },
      { label: 'Status',      value: r => r.isActive ? 'Active' : 'Inactive' },
    ],
  },
}

function firstOfMonth() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function ReportsPage() {
  const [type, setType]         = useState('attendance')
  const [from, setFrom]         = useState(firstOfMonth())
  const [to, setTo]             = useState(todayISO())
  const [employeeId, setEmpId]  = useState('')     // '' = All
  const [status, setStatus]     = useState('')     // '' = All (leave)

  const config = REPORTS[type]

  // Logo ek baar load (PDF letterhead ke liye). Button click tak ready ho jata hai.
  const [brand, setBrand] = useState(null)
  useEffect(() => { loadImageAsset(logoUrl).then(setBrand).catch(() => setBrand(null)) }, [])

  // Employee list — name lookup + filter dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const empMap = Object.fromEntries(employees.map(e => [e.id, e]))

  // Report data (endpoint + params depend on type)
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ['report', type, from, to, status],
    queryFn: () => {
      if (type === 'attendance') return api.get('/attendance', { params: { from, to } }).then(r => arr(r))
      if (type === 'leave')      return api.get('/leaves', { params: status ? { status } : {} }).then(r => arr(r))
      return api.get('/employees').then(r => arr(r))
    },
  })

  // Client-side employee filter (attendance + leave)
  const data = (type === 'employees' || !employeeId)
    ? rawData
    : rawData.filter(r => String(r.employeeId) === String(employeeId))

  // Build the string matrix once — table + exports share it
  const headers = config.columns.map(c => c.label)
  const matrix  = data.map(row => config.columns.map(c => c.value(row, empMap)))

  const exportCSV = () => downloadCSV(`${type}-report.csv`, headers, matrix)
  const exportPDF = () => downloadPDF(`${type}-report.pdf`, `${config.label} Report`, headers, matrix, brand)
  const canExport = matrix.length > 0

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Generate and export attendance, leave and employee data.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={exportCSV} disabled={!canExport} style={exportBtn(canExport, false)}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={exportPDF} disabled={!canExport} className="btn-primary" style={{ opacity: canExport ? 1 : 0.5, cursor: canExport ? 'pointer' : 'not-allowed' }}>
            <FileDown size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Report">
          <select value={type} onChange={e => setType(e.target.value)} style={inSt}>
            {Object.entries(REPORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>

        {type === 'attendance' && (
          <>
            <Field label="From"><input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inSt} /></Field>
            <Field label="To"><input type="date" value={to} onChange={e => setTo(e.target.value)} style={inSt} /></Field>
          </>
        )}

        {type === 'leave' && (
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value)} style={inSt}>
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>
        )}

        {type !== 'employees' && (
          <Field label="Employee">
            <select value={employeeId} onChange={e => setEmpId(e.target.value)} style={inSt}>
              <option value="">All employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </Field>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', paddingBottom: 8 }}>
          {isLoading ? 'Loading…' : `${matrix.length} ${matrix.length === 1 ? 'row' : 'rows'}`}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${headers.length}, minmax(110px, 1fr))`, minWidth: headers.length * 120, padding: '12px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {headers.map(h => (
            <span key={h} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
        ) : matrix.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 14 }}>
              <Inbox size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No data for this report</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Try a different date range or filter.</p>
          </div>
        ) : (
          matrix.map((cells, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${headers.length}, minmax(110px, 1fr))`, minWidth: headers.length * 120, padding: '13px 18px', alignItems: 'center', borderBottom: i < matrix.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              {cells.map((c, j) => (
                <span key={j} style={{ fontSize: 14, color: j === 0 ? '#0f172a' : '#475569', fontWeight: j === 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }} title={c}>{c}</span>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function arr(r) { return Array.isArray(r.data) ? r.data : [] }

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function exportBtn(enabled) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 500,
    background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '9px 15px', cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5,
  }
}

const inSt = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff', minWidth: 150 }
