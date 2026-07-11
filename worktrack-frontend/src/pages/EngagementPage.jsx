import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Flame, Trophy, Zap, Send, Users, TrendingUp, AlertTriangle, CircleCheck, Minus } from 'lucide-react'
import api from '../api/axios'

const levelColors = { ROOKIE: '#64748b', REGULAR: '#2563eb', PRO: '#7c3aed', LEGEND: '#d97706' }
const statusConfig = {
  ON_FIRE: { label: 'On Fire', color: '#ea580c', bg: '#fff7ed', Icon: Flame },
  ACTIVE:  { label: 'Active',  color: '#16a34a', bg: '#f0fdf4', Icon: CircleCheck },
  AT_RISK: { label: 'At Risk', color: '#dc2626', bg: '#fef2f2', Icon: Minus },
}

export default function EngagementPage() {
  const [nudgedIds, setNudgedIds] = useState(new Set())

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team-engagement'],
    queryFn: () => api.get('/gamification/team').then(r => Array.isArray(r.data) ? r.data : []),
    refetchInterval: 30000,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-names'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Team ab email se aata hai — naam employee ke email se resolve karo
  const nameMap = Object.fromEntries(
    employees.map(e => [e.email?.toLowerCase(), e.fullName || `${e.firstName} ${e.lastName}`.trim()])
  )
  const getName = email => nameMap[email?.toLowerCase()] || (email ? email.split('@')[0] : 'Unknown')
  const getInitial = email => (getName(email) || 'E')[0].toUpperCase()

  const nudgeMutation = useMutation({
    mutationFn: ({ email, employeeName }) =>
      api.post('/gamification/nudge', { email, employeeName }),
    onSuccess: (_, vars) => setNudgedIds(s => new Set([...s, vars.email])),
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 13 }}>
      Loading…
    </div>
  )

  const onFire    = team.filter(m => m.status === 'ON_FIRE')
  const active    = team.filter(m => m.status === 'ACTIVE')
  const atRisk    = team.filter(m => m.status === 'AT_RISK')
  const topXP     = [...team].sort((a, b) => b.totalXp - a.totalXp)[0]
  const topStreak = [...team].sort((a, b) => b.currentStreak - a.currentStreak)[0]
  const engScore  = team.length > 0
    ? Math.round(((onFire.length + active.length) / team.length) * 100) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>Team Engagement</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Track team streaks, XP, and send appreciation nudges.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Engagement Score', value: `${engScore}%`, icon: TrendingUp,     color: '#4f46e5', desc: `${onFire.length + active.length} of ${team.length} active` },
          { label: 'On Fire 🔥',       value: onFire.length,  icon: Flame,          color: '#f97316', desc: '3+ day streak'      },
          { label: 'At Risk',          value: atRisk.length,  icon: AlertTriangle,  color: '#dc2626', desc: 'Streak broken'      },
          { label: 'Total Members',    value: team.length,    icon: Users,          color: '#7c3aed', desc: 'tracked in system'  },
        ].map(({ label, value, icon: Icon, color, desc }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</span>
              <Icon size={14} color={color} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Top performers */}
      {(topXP || topStreak) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {topXP && (
            <div style={{
              background: 'linear-gradient(135deg, #fef9c3, #fef3c7)',
              border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={20} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.5px' }}>TOP XP EARNER</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  {getName(topXP.email)}
                </div>
                <div style={{ fontSize: 13, color: '#d97706', fontWeight: 600, marginTop: 2 }}>{topXP.totalXp} XP · {topXP.level}</div>
              </div>
            </div>
          )}
          {topStreak && topStreak.currentStreak > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
              border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame size={20} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9a3412', letterSpacing: '0.5px' }}>LONGEST STREAK</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  {getName(topStreak.email)}
                </div>
                <div style={{ fontSize: 13, color: '#f97316', fontWeight: 600, marginTop: 2 }}>{topStreak.currentStreak} days in a row</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color="#374151" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>All Members</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{team.length} total</span>
        </div>

        {team.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            No XP data yet — members start appearing after their first time log.
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
              padding: '8px 20px', background: '#f8fafc',
              fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase',
            }}>
              <span>Employee</span>
              <span>Status</span>
              <span>XP</span>
              <span>Streak</span>
              <span>Badges</span>
              <span></span>
            </div>

            {team.map((member, i) => {
              const sc = statusConfig[member.status] || statusConfig.AT_RISK
              const nudged = nudgedIds.has(member.email)
              return (
                <div key={member.email} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                  padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < team.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: member.status === 'AT_RISK' ? '#fefefe' : '#fff',
                }}>
                  {/* Employee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: levelColors[member.level] + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: levelColors[member.level],
                    }}>
                      {getInitial(member.email)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{getName(member.email)}</div>
                      <div style={{ fontSize: 10, color: levelColors[member.level], fontWeight: 600 }}>{member.level}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 6,
                    background: sc.bg, width: 'fit-content',
                  }}>
                    <sc.Icon size={11} color={sc.color} strokeWidth={2.2} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                  </div>

                  {/* XP */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={12} color="#4f46e5" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{member.totalXp}</span>
                  </div>

                  {/* Streak */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Flame size={12} color={member.currentStreak > 0 ? '#f97316' : '#cbd5e1'} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{member.currentStreak}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>days</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {member.badges.length > 0 ? (
                      member.badges.map(b => (
                        <span key={b} title={b === 'HOT_STREAK' ? 'Hot Streak (5d)' : 'Iron Streak (30d)'} style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: b === 'HOT_STREAK' ? '#fff7ed' : '#f1f5f9',
                          color: b === 'HOT_STREAK' ? '#ea580c' : '#475569',
                          border: `1px solid ${b === 'HOT_STREAK' ? '#fed7aa' : '#e2e8f0'}`,
                        }}>{b === 'HOT_STREAK' ? 'HOT' : 'IRON'}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                    )}
                  </div>

                  {/* Nudge button */}
                  <div>
                    <button
                      onClick={() => nudgeMutation.mutate({ email: member.email, employeeName: getName(member.email) })}
                      disabled={nudged || nudgeMutation.isPending}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        cursor: nudged ? 'default' : 'pointer',
                        border: nudged ? '1px solid #d1fae5' : '1px solid #e2e8f0',
                        background: nudged ? '#ecfdf5' : '#fff',
                        color: nudged ? '#16a34a' : '#374151',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!nudged) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!nudged) e.currentTarget.style.background = '#fff' }}
                    >
                      <Send size={11} />
                      {nudged ? 'Sent!' : 'Nudge'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
