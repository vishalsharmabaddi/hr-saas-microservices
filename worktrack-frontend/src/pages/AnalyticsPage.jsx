import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid,
         LineChart, Line } from 'recharts'
import { BarChart3, PieChart as PieIcon, Trophy, CalendarCheck } from 'lucide-react'
import api from '../api/axios'

// Har leave type ka apna color
const LEAVE_COLORS = {
  SICK:      '#dc2626',
  CASUAL:    '#0891B2',
  EARNED:    '#16a34a',
  UNPAID:    '#64748b',
  EMERGENCY: '#ea580c',
}

// Status ke fixed colors + order (taaki chart mein hamesha same order dikhe)
const STATUS_COLORS = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626' }
const STATUS_ORDER  = ['PENDING', 'APPROVED', 'REJECTED']

// Level ke colors (Progress page se same)
const LEVEL_COLORS = { ROOKIE: '#64748b', REGULAR: '#16A34A', PRO: '#0891B2', LEGEND: '#B45309' }

export default function AnalyticsPage() {
  // Saari leaves fetch karo (koi status filter nahi — sab chahiye)
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', 'All'],
    queryFn: () => api.get('/leaves').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Leaderboard (XP ranking) + employees (naam ke liye)
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-names'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const nameMap = Object.fromEntries(
    employees.map(e => [e.id, e.fullName || `${e.firstName} ${e.lastName}`.trim()])
  )
  const getName = id => nameMap[id] || `Employee #${id}`

  // Last 14 days ka date range banao
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 13)
  const iso = d => d.toISOString().split('T')[0]

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-range', iso(fromDate), iso(toDate)],
    queryFn: () => api.get('/attendance', { params: { from: iso(fromDate), to: iso(toDate) } })
      .then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Transform: raw leaves → count by leaveType
  // { SICK: 5, CASUAL: 3 } banao, phir array of { name, value }
  const byType = leaves.reduce((acc, lv) => {
    acc[lv.leaveType] = (acc[lv.leaveType] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }))

  // Transform 2: count by status → fixed order (PENDING, APPROVED, REJECTED)
  const byStatus = leaves.reduce((acc, lv) => {
    acc[lv.status] = (acc[lv.status] || 0) + 1
    return acc
  }, {})
  const statusData = STATUS_ORDER.map(name => ({ name, value: byStatus[name] || 0 }))

  // Transform 3: leaderboard → { name, xp, level }, XP descending
  const xpData = [...leaderboard]
    .sort((a, b) => b.totalXp - a.totalXp)
    .map(e => ({ name: getName(e.employeeId), xp: e.totalXp, level: e.level }))

  // Transform 4: attendance → last 14 days, har din ka present-count
  const countByDate = attendance.reduce((acc, r) => {
    acc[r.attendanceDate] = (acc[r.attendanceDate] || 0) + 1
    return acc
  }, {})
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: dateStr,
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      present: countByDate[dateStr] || 0,
    }
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Analytics</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Team trends — leaves, engagement, and attendance insights.</p>
      </div>

      {/* Attendance Trend — Line Chart (full width) */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CalendarCheck size={14} color="#374151" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Attendance — Last 14 Days</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ stroke: '#e2e8f0' }} />
            <Line type="monotone" dataKey="present" stroke="#16A34A" strokeWidth={2} dot={{ r: 3, fill: '#16A34A' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Leave by Type — Pie Chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PieIcon size={14} color="#374151" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Leaves by Type</span>
          </div>

          {isLoading ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
          ) : typeData.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>No leave data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                  {typeData.map(entry => (
                    <Cell key={entry.name} fill={LEAVE_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave by Status — Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={14} color="#374151" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Leaves by Status</span>
          </div>

          {isLoading ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
          ) : leaves.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>No leave data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {statusData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Team XP Leaderboard — Horizontal Bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Trophy size={14} color="#374151" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Team XP Leaderboard</span>
        </div>

        {xpData.length === 0 ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>No XP data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(140, xpData.length * 52)}>
            <BarChart data={xpData} layout="vertical" margin={{ top: 4, right: 24, left: 20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13, fill: '#0f172a' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="xp" radius={[0, 6, 6, 0]} maxBarSize={34}>
                {xpData.map(entry => (
                  <Cell key={entry.name} fill={LEVEL_COLORS[entry.level] || '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
