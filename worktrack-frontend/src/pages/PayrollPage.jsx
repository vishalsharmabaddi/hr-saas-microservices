import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, Save, Play, Inbox } from 'lucide-react'
import api from '../api/axios'

/* ── helpers ─────────────────────────────────────────────── */
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const now = new Date()

const EMPTY_STRUCT = { basic: '', hra: '', specialAllowance: '', pfEnabled: true, professionalTax: '', lopEnabled: true }

export default function PayrollPage() {
  const qc = useQueryClient()

  /* employees (dropdowns + name lookup) */
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const empName = id => employees.find(e => e.id === id)?.fullName || `#${id}`

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wallet size={26} color="#16A34A" /> Payroll
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          Set salary structures, define the paid-leave policy, and generate monthly payslips.
        </p>
      </div>

      <PolicyCard qc={qc} />
      <StructureCard employees={employees} qc={qc} />
      <RunCard employees={employees} empName={empName} />
    </div>
  )
}

/* ── 1) Company paid-leave policy ─────────────────────────── */
function PolicyCard({ qc }) {
  const [quota, setQuota] = useState('')
  const { data: policy } = useQuery({
    queryKey: ['payroll-policy'],
    queryFn: () => api.get('/payroll/policy').then(r => r.data),
  })
  useEffect(() => { if (policy) setQuota(String(policy.paidLeavesPerMonth)) }, [policy])

  const save = useMutation({
    mutationFn: () => api.put('/payroll/policy', { paidLeavesPerMonth: Number(quota) || 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-policy'] }),
  })

  return (
    <section style={card}>
      <h2 style={cardTitle}>Paid-leave policy</h2>
      <p style={cardHint}>Approved leaves within this many days per month are paid. Beyond it, they become loss-of-pay (LOP).</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <Field label="Paid leaves / month">
          <input type="number" min="0" value={quota} onChange={e => setQuota(e.target.value)} style={{ ...inSt, width: 140 }} />
        </Field>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary" style={{ opacity: save.isPending ? 0.6 : 1 }}>
          <Save size={15} /> {save.isPending ? 'Saving…' : 'Save policy'}
        </button>
        {save.isSuccess && <span style={okMsg}>Saved ✓</span>}
      </div>
    </section>
  )
}

/* ── 2) Salary structure editor ───────────────────────────── */
function StructureCard({ employees, qc }) {
  const [empId, setEmpId] = useState('')
  const [form, setForm] = useState(EMPTY_STRUCT)

  // Load selected employee's structure (404 → empty defaults)
  const { data: struct } = useQuery({
    queryKey: ['payroll-structure', empId],
    enabled: !!empId,
    queryFn: () => api.get(`/payroll/structure/${empId}`).then(r => r.data).catch(() => null),
  })
  useEffect(() => {
    if (!empId) { setForm(EMPTY_STRUCT); return }
    if (struct) {
      setForm({
        basic: struct.basic ?? '', hra: struct.hra ?? '', specialAllowance: struct.specialAllowance ?? '',
        pfEnabled: struct.pfEnabled, professionalTax: struct.professionalTax ?? '', lopEnabled: struct.lopEnabled,
      })
    } else {
      setForm(EMPTY_STRUCT)
    }
  }, [empId, struct])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => api.put(`/payroll/structure/${empId}`, {
      basic: Number(form.basic) || 0,
      hra: Number(form.hra) || 0,
      specialAllowance: Number(form.specialAllowance) || 0,
      pfEnabled: form.pfEnabled,
      professionalTax: Number(form.professionalTax) || 0,
      lopEnabled: form.lopEnabled,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-structure', empId] }),
  })

  const gross = (Number(form.basic) || 0) + (Number(form.hra) || 0) + (Number(form.specialAllowance) || 0)

  return (
    <section style={card}>
      <h2 style={cardTitle}>Salary structure</h2>
      <p style={cardHint}>Pick an employee and set their monthly components. Turn deductions off (or 0) for contractors — then net = gross.</p>

      <Field label="Employee">
        <select value={empId} onChange={e => setEmpId(e.target.value)} style={{ ...inSt, minWidth: 240 }}>
          <option value="">Select employee…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
      </Field>

      {empId && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginTop: 16 }}>
            <Field label="Basic (₹)"><input type="number" value={form.basic} onChange={e => set('basic', e.target.value)} style={inSt} /></Field>
            <Field label="HRA (₹)"><input type="number" value={form.hra} onChange={e => set('hra', e.target.value)} style={inSt} /></Field>
            <Field label="Special allowance (₹)"><input type="number" value={form.specialAllowance} onChange={e => set('specialAllowance', e.target.value)} style={inSt} /></Field>
            <Field label="Professional tax (₹)"><input type="number" value={form.professionalTax} onChange={e => set('professionalTax', e.target.value)} style={inSt} /></Field>
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 16, flexWrap: 'wrap' }}>
            <label style={checkRow}>
              <input type="checkbox" checked={form.pfEnabled} onChange={e => set('pfEnabled', e.target.checked)} />
              <span>Deduct PF (12% of basic)</span>
            </label>
            <label style={checkRow}>
              <input type="checkbox" checked={form.lopEnabled} onChange={e => set('lopEnabled', e.target.checked)} />
              <span>Apply LOP (cut pay for absent / unpaid-leave days)</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#334155' }}>Gross: <b style={{ color: '#0f172a' }}>{money(gross)}</b>/month</span>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary" style={{ opacity: save.isPending ? 0.6 : 1 }}>
              <Save size={15} /> {save.isPending ? 'Saving…' : 'Save structure'}
            </button>
            {save.isSuccess && <span style={okMsg}>Saved ✓</span>}
          </div>
        </>
      )}
    </section>
  )
}

/* ── 3) Run payroll + payslips table ──────────────────────── */
function RunCard({ employees, empName }) {
  const qc = useQueryClient()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [empId, setEmpId] = useState('')   // '' = all

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payslips', month, year],
    queryFn: () => api.get('/payroll/payslips', { params: { month, year } }).then(r => Array.isArray(r.data) ? r.data : []),
  })

  const run = useMutation({
    mutationFn: () => api.post('/payroll/run', { month, year, employeeId: empId ? Number(empId) : null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payslips', month, year] }),
  })

  return (
    <section style={card}>
      <h2 style={cardTitle}>Run payroll</h2>
      <p style={cardHint}>Generate payslips for a month. Leave employee as “All” to run the whole company (only those with a salary structure).</p>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Month">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inSt}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Year">
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...inSt, width: 110 }} />
        </Field>
        <Field label="Employee">
          <select value={empId} onChange={e => setEmpId(e.target.value)} style={{ ...inSt, minWidth: 200 }}>
            <option value="">All employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </Field>
        <button onClick={() => run.mutate()} disabled={run.isPending} className="btn-primary" style={{ opacity: run.isPending ? 0.6 : 1 }}>
          <Play size={15} /> {run.isPending ? 'Generating…' : 'Generate'}
        </button>
        {run.isError && <span style={{ ...okMsg, color: '#dc2626', background: '#fef2f2' }}>
          {run.error?.response?.data?.message || 'Failed'}
        </span>}
      </div>

      {/* payslips table */}
      <div style={{ marginTop: 18, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
        <div style={{ ...rowGrid, background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['Employee', 'Gross', 'PF', 'Prof. Tax', 'LOP (days)', 'LOP ₹', 'Deductions', 'Net Pay'].map(h => (
            <span key={h} style={th}>{h}</span>
          ))}
        </div>
        {isLoading ? (
          <div style={emptyBox}>Loading…</div>
        ) : payslips.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 14, display: 'inline-block', marginBottom: 12 }}>
              <Inbox size={22} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No payslips for {MONTHS[month - 1]} {year}</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Press Generate to create them.</p>
          </div>
        ) : (
          payslips.map((p, i) => (
            <div key={p.id} style={{ ...rowGrid, borderBottom: i < payslips.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <span style={{ ...td, fontWeight: 600, color: '#0f172a' }}>{p.employeeName || empName(p.employeeId)}</span>
              <span style={td}>{money(p.grossPay)}</span>
              <span style={td}>{money(p.pf)}</span>
              <span style={td}>{money(p.professionalTax)}</span>
              <span style={td}>{p.lopDays}</span>
              <span style={td}>{money(p.lopAmount)}</span>
              <span style={td}>{money(p.totalDeductions)}</span>
              <span style={{ ...td, fontWeight: 700, color: '#16A34A' }}>{money(p.netPay)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

/* ── shared bits ──────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', marginBottom: 18 }
const cardTitle = { fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }
const cardHint = { fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }
const inSt = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }
const checkRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', cursor: 'pointer' }
const okMsg = { fontSize: 13, fontWeight: 600, color: '#16A34A', background: '#EAF7EE', padding: '6px 12px', borderRadius: 8 }
const rowGrid = { display: 'grid', gridTemplateColumns: '1.6fr repeat(7, 1fr)', minWidth: 860, padding: '12px 16px', alignItems: 'center', gap: 8 }
const th = { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }
const td = { fontSize: 14, color: '#475569', whiteSpace: 'nowrap' }
const emptyBox = { padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }
