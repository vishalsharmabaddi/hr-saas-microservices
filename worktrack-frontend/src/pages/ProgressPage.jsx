import { useQuery } from '@tanstack/react-query'
import { Flame, Trophy, TrendingUp, Star } from 'lucide-react'
import api from '../api/axios'

const levelColors  = { ROOKIE: '#64748b', REGULAR: '#2563eb', PRO: '#7c3aed', LEGEND: '#d97706' }
const levelBg      = { ROOKIE: '#f1f5f9', REGULAR: '#eff6ff', PRO:  '#f5f3ff', LEGEND: '#fffbeb' }
const xpMax        = { ROOKIE: 100, REGULAR: 500, PRO: 1500, LEGEND: 9999 }
const xpMin        = { ROOKIE: 0,   REGULAR: 100, PRO: 500,  LEGEND: 1500 }
const levelOrder   = ['ROOKIE', 'REGULAR', 'PRO', 'LEGEND']

const badgeInfo = {
  HOT_STREAK:  { label: 'Hot Streak',  desc: '5-day submission streak', emoji: '🔥', color: '#f97316', bg: '#fff7ed' },
  IRON_STREAK: { label: 'Iron Streak', desc: '30-day submission streak', emoji: '🛡️', color: '#64748b', bg: '#f8fafc' },
}

export default function ProgressPage() {
  const { data: xp, isLoading } = useQuery({
    queryKey: ['gamification', 1],
    queryFn: () => api.get('/gamification/1/summary').then(r => r.data),
  })

  const { data: history = [] } = useQuery({
    queryKey: ['gamification-history', 1],
    queryFn: () => api.get('/gamification/1/history').then(r => r.data),
  })

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard').then(r => r.data),
  })

  const currentLevel = xp?.level || 'ROOKIE'
  const xpProgress = xp
    ? Math.min(100, ((xp.totalXp - xpMin[currentLevel]) / (xpMax[currentLevel] - xpMin[currentLevel])) * 100)
    : 0
  const xpToNext = xp ? Math.max(0, xpMax[currentLevel] - xp.totalXp) : 0
  const nextLevel = levelOrder[levelOrder.indexOf(currentLevel) + 1]

  // Last 14 days for bar chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const entry = history.find(h => h.logDate === dateStr)
    return { date: dateStr, xp: entry?.xpGained ?? 0, label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0,2) }
  })
  const maxXp = Math.max(...last14.map(d => d.xp), 1)

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 13 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>My Progress</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Track your XP, streaks, and badges.</p>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 140, height: 140, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', pointerEvents: 'none' }} />

        {/* Level ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96">
            {/* Track */}
            <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r="40"
              fill="none"
              stroke="url(#xpGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - xpProgress / 100)}`}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <defs>
              <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <text x="48" y="43" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="system-ui">{xp?.totalXp ?? 0}</text>
            <text x="48" y="57" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="1">XP</text>
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '1.5px',
              padding: '3px 10px', borderRadius: 6,
              background: levelColors[currentLevel] + '30',
              color: levelColors[currentLevel] === '#64748b' ? '#94a3b8' : levelColors[currentLevel],
              border: `1px solid ${levelColors[currentLevel]}40`,
            }}>{currentLevel}</span>
            {currentLevel === 'LEGEND' && <span style={{ fontSize: 12 }}>👑</span>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 12 }}>
            {nextLevel ? `${xpToNext} XP to ${nextLevel}` : 'Max Level Reached'}
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', maxWidth: 280 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${xpProgress}%`,
              background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
              transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {levelOrder.map((lvl, i) => (
              <span key={lvl} style={{
                marginRight: 12, fontWeight: levelOrder.indexOf(currentLevel) >= i ? 600 : 400,
                color: levelOrder.indexOf(currentLevel) >= i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
              }}>{lvl}</span>
            ))}
          </div>
        </div>

        {/* Streak + Badges mini stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{(xp?.currentStreak ?? 0) >= 5 ? '🔥' : '💧'}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{xp?.currentStreak ?? 0}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>day streak</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏆</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{xp?.badges?.length ?? 0}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* XP History Bar Chart */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <TrendingUp size={14} color="#374151" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>XP Last 14 Days</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
          {last14.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: day.xp > 0 ? `${Math.max(8, (day.xp / maxXp) * 80)}px` : '3px',
                background: day.xp > 0
                  ? 'linear-gradient(180deg, #7c3aed, #4f46e5)'
                  : '#f1f5f9',
                transition: 'height 0.4s ease',
              }} title={`${day.date}: ${day.xp} XP`} />
              <span style={{ fontSize: 9, color: '#9ca3af' }}>{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges section + Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Badges */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Star size={14} color="#374151" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Badges</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(badgeInfo).map(([key, info]) => {
              const earned = xp?.badges?.includes(key)
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: earned ? info.bg : '#f8fafc',
                  border: `1px solid ${earned ? info.color + '30' : '#f1f5f9'}`,
                  opacity: earned ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{info.emoji}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: earned ? info.color : '#94a3b8' }}>{info.label}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{info.desc}</div>
                  </div>
                  {earned && (
                    <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: info.color, background: info.bg, border: `1px solid ${info.color}30`, padding: '2px 8px', borderRadius: 5 }}>
                      EARNED
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Trophy size={14} color="#374151" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Team Leaderboard</span>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaderboard.map((entry, i) => (
                <div key={entry.employeeId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: i === 0 ? '#fffbeb' : '#f8fafc',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#d97706' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: i < 3 ? '#fff' : '#64748b',
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.employeeName || `Employee #${entry.employeeId}`}
                    </div>
                    <div style={{ fontSize: 10, color: levelColors[entry.level] || '#64748b', fontWeight: 600 }}>{entry.level}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{entry.totalXp} XP</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
