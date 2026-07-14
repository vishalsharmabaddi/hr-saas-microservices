// Reusable date-range filter: From/To inputs + quick presets.
// Controlled component — parent holds { from, to } state and gets onChange({ from, to }).
// Used by Leaves, Reports, and Attendance. ISO strings are local-safe (no UTC off-by-one).

const pad = n => String(n).padStart(2, '0')
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// This-month range — pages use it as their default.
export function thisMonthRange() {
  const n = new Date()
  return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)),
           to:   iso(new Date(n.getFullYear(), n.getMonth() + 1, 0)) }
}

function buildPresets() {
  const n = new Date()
  const y = n.getFullYear(), m = n.getMonth()
  const t30 = new Date(); t30.setDate(t30.getDate() - 29)
  return [
    { label: 'This month',   from: iso(new Date(y, m, 1)),     to: iso(new Date(y, m + 1, 0)) },
    { label: 'Last month',   from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) },
    { label: 'Last 30 days', from: iso(t30),                   to: iso(new Date()) },
    { label: 'This year',    from: `${y}-01-01`,               to: `${y}-12-31` },
    { label: 'Last year',    from: `${y - 1}-01-01`,           to: `${y - 1}-12-31` },
  ]
}

const inSt = {
  border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px',
  fontSize: 13, color: '#0f172a', background: '#fff',
}

export default function DateRangeFilter({ from, to, onChange }) {
  const presets = buildPresets()

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {/* Preset chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {presets.map(p => {
          const active = p.from === from && p.to === to
          return (
            <button key={p.label} onClick={() => onChange({ from: p.from, to: p.to })}
              style={{
                border: '1px solid', borderColor: active ? '#16A34A' : '#e2e8f0',
                background: active ? '#EAF7EE' : '#fff', color: active ? '#15803d' : '#475569',
                borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Custom From / To */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
        From
        <input type="date" value={from} max={to || undefined}
          onChange={e => onChange({ from: e.target.value, to })} style={inSt} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
        To
        <input type="date" value={to} min={from || undefined}
          onChange={e => onChange({ from, to: e.target.value })} style={inSt} />
      </label>
    </div>
  )
}
