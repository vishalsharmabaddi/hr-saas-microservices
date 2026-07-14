import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Save, Check } from 'lucide-react'
import api from '../api/axios'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Admin per-company work schedule. Ye policy LATE / HALF_DAY / auto-absent decide karti hai.
export default function AttendancePolicyCard() {
  const queryClient = useQueryClient()

  const { data: policy, isLoading } = useQuery({
    queryKey: ['attendance-policy'],
    queryFn: () => api.get('/attendance/policy').then(r => r.data),
  })

  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (policy) setForm({
      workStartTime: (policy.workStartTime || '09:00').slice(0, 5),
      workEndTime:   (policy.workEndTime   || '18:00').slice(0, 5),
      graceMinutes:  policy.graceMinutes ?? 15,
      halfDayHours:  policy.halfDayHours ?? 4,
      workingDays:   policy.workingDays || 'MON,TUE,WED,THU,FRI',
    })
  }, [policy])

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/attendance/policy', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policy'] })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    },
  })

  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }

  if (isLoading || !form) {
    return <div style={card}><div style={{ color: '#94a3b8', fontSize: 14 }}>Loading attendance policy…</div></div>
  }

  const daySet = new Set(form.workingDays.split(',').filter(Boolean))
  const toggleDay = (d) => {
    const s = new Set(daySet)
    s.has(d) ? s.delete(d) : s.add(d)
    setForm(f => ({ ...f, workingDays: DAYS.filter(x => s.has(x)).join(',') }))
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Clock size={15} color="#374151" />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Attendance Policy</span>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>
        Work hours drive Late / Half-day status and the nightly auto-absent check.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <Field label="Work start">
          <input type="time" value={form.workStartTime}
            onChange={e => setForm(f => ({ ...f, workStartTime: e.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Work end">
          <input type="time" value={form.workEndTime}
            onChange={e => setForm(f => ({ ...f, workEndTime: e.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Late grace (min)">
          <input type="number" min="0" value={form.graceMinutes}
            onChange={e => setForm(f => ({ ...f, graceMinutes: Number(e.target.value) }))} style={inputStyle} />
        </Field>
        <Field label="Half-day under (hrs)">
          <input type="number" min="0" value={form.halfDayHours}
            onChange={e => setForm(f => ({ ...f, halfDayHours: Number(e.target.value) }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 8 }}>Working days</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DAYS.map(d => {
            const on = daySet.has(d)
            return (
              <button key={d} onClick={() => toggleDay(d)} style={{
                border: '1px solid', borderColor: on ? '#16A34A' : '#e2e8f0',
                background: on ? '#EAF7EE' : '#fff', color: on ? '#15803d' : '#94a3b8',
                borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {d}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Policy'}
        </button>
        {saveMutation.isError && <span style={{ fontSize: 13, color: '#dc2626' }}>Save failed — admin only.</span>}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, background: '#fff', boxSizing: 'border-box',
}
