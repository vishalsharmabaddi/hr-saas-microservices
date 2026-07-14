import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon, CalendarCheck } from 'lucide-react'

// Ek donut card — title + donut + center number + legend (dots + values).
// segments: [{ name, value, color }]. Contrast-safe: identity legend + direct values.
function DonutCard({ icon: Icon, title, segments, centerValue, centerLabel, emptyText, loading }) {
  const total = segments.reduce((s, x) => s + x.value, 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color="#374151" />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{title}</span>
      </div>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : total === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>{emptyText}</div>
      ) : (
        <>
          {/* Donut + center hero number */}
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={segments} dataKey="value" nameKey="name" cx="50%" cy="50%"
                     innerRadius={62} outerRadius={88} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                  {segments.map(s => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <span className="tg-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--tg-text)', lineHeight: 1, letterSpacing: '-1px' }}>{centerValue}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{centerLabel}</span>
            </div>
          </div>

          {/* Legend — dot + label + value (identity never color-alone) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 12 }}>
            {segments.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#475569' }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Dashboard ke do overview donuts. Data props se aata hai — koi apna API call nahi.
export default function DashboardCharts({
  openTasks = 0, inProgressTasks = 0, completedTasks = 0,
  todayPresent = 0, activeEmployees = 0, isManager = false, loading = false,
}) {
  const taskSegments = [
    { name: 'Open',        value: openTasks,       color: '#d97706' },
    { name: 'In Progress', value: inProgressTasks, color: '#0284c7' },
    { name: 'Completed',   value: completedTasks,  color: '#16a34a' },
  ]
  const totalTasks = openTasks + inProgressTasks + completedTasks

  const absent = Math.max(0, activeEmployees - todayPresent)
  const attendanceSegments = [
    { name: 'Present', value: todayPresent, color: '#16a34a' },
    { name: 'Absent',  value: absent,       color: '#94a3b8' },
  ]

  return (
    <>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: isManager ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 24 }}>
        <DonutCard
          icon={PieIcon}
          title="Task Status"
          segments={taskSegments}
          centerValue={totalTasks}
          centerLabel="Total tasks"
          emptyText="No tasks yet"
          loading={loading}
        />
        {isManager && (
          <DonutCard
            icon={CalendarCheck}
            title="Today's Attendance"
            segments={attendanceSegments}
            centerValue={`${todayPresent}/${activeEmployees}`}
            centerLabel="Present today"
            emptyText="No employees yet"
            loading={loading}
          />
        )}
      </div>
    </>
  )
}
