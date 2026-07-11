import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Flame, Trophy, Zap, Send, Users, TrendingUp, AlertTriangle, CircleCheck, Minus } from 'lucide-react'
import api from '../api/axios'

const levelColors = { ROOKIE: '#64748b', REGULAR: '#16A34A', PRO: '#0891B2', LEGEND: '#B45309' }

// Status chips — lucide icons only, no emoji. Muted professional tints.
const statusConfig = {
  ON_FIRE: { label: 'On Fire', color: '#C2410C', bg: '#FFF4ED', Icon: Flame },
  ACTIVE:  { label: 'Active',  color: '#15803D', bg: '#EAF7EE', Icon: CircleCheck },
  AT_RISK: { label: 'At Risk', color: '#B91C1C', bg: '#FEF2F2', Icon: AlertTriangle },
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

  const nameMap = Object.fromEntries(
    employees.map(e => [e.email?.toLowerCase(), e.fullName || `${e.firstName} ${e.lastName}`.trim()])
  )
  const getName = email => nameMap[email?.toLowerCase()] || (email ? email.split('@')[0] : 'Unknown')
  const getInitial = email => (getName(email) || 'E')[0].toUpperCase()

  const nudgeMutation = useMutation({
    mutationFn: ({ email, employeeName }) => api.post('/gamification/nudge', { email, employeeName }),
    onSuccess: (_, vars) => setNudgedIds(s => new Set([...s, vars.email])),
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--tg-muted)', fontSize: 15 }}>
      Loading…
    </div>
  )

  const onFire    = team.filter(m => m.status === 'ON_FIRE')
  const active    = team.filter(m => m.status === 'ACTIVE')
  const atRisk    = team.filter(m => m.status === 'AT_RISK')
  const topXP     = [...team].sort((a, b) => b.totalXp - a.totalXp)[0]
  const topStreak = [...team].sort((a, b) => b.currentStreak - a.currentStreak)[0]
  const engScore  = team.length > 0 ? Math.round(((onFire.length + active.length) / team.length) * 100) : 0

  const metrics = [
    { label: 'Engagement Score', value: `${engScore}%`, Icon: TrendingUp,    tint: '#16A34A', sub: `${onFire.length + active.length} of ${team.length} active` },
    { label: 'On Fire',          value: onFire.length,  Icon: Flame,         tint: '#C2410C', sub: '3+ day streak' },
    { label: 'At Risk',          value: atRisk.length,  Icon: AlertTriangle, tint: '#B91C1C', sub: 'streak broken' },
    { label: 'Total Members',    value: team.length,    Icon: Users,         tint: '#B45309', sub: 'tracked' },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Team Engagement</h1>
        <p style={{ fontSize: 15, color: 'var(--tg-muted)', marginTop: 4 }}>Track team streaks and XP, and recognise strong performers.</p>
      </div>

      {/* Metrics */}
      <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {metrics.map(({ label, value, Icon, tint, sub }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid var(--tg-border)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: `${tint}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={tint} strokeWidth={2} />
              </span>
            </div>
            <div className="tg-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--tg-text)', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--tg-muted)', marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Top performers */}
      {(topXP || (topStreak && topStreak.currentStreak > 0)) && (
        <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
          {topXP && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid var(--tg-border)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={20} color="#15803D" strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tg-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Top XP Earner</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tg-text)', marginTop: 3 }}>{getName(topXP.email)}</div>
                <div style={{ fontSize: 14, color: '#15803D', fontWeight: 600, marginTop: 2 }}>{topXP.totalXp} XP · {topXP.level}</div>
              </div>
            </div>
          )}
          {topStreak && topStreak.currentStreak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid var(--tg-border)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flame size={20} color="#B45309" strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tg-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Longest Streak</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tg-text)', marginTop: 3 }}>{getName(topStreak.email)}</div>
                <div style={{ fontSize: 14, color: '#B45309', fontWeight: 600, marginTop: 2 }}>{topStreak.currentStreak} days in a row</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      <div style={{ background: '#fff', border: '1px solid var(--tg-border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '15px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={15} color="#374151" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tg-text)' }}>All Members</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--tg-muted)' }}>{team.length} total</span>
        </div>

        {team.length === 0 ? (
          <div style={{ padding: '48px 22px', textAlign: 'center', color: 'var(--tg-muted)', fontSize: 15 }}>
            No engagement data yet — members appear here after their first time log.
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.9fr 1fr 1.1fr 120px', padding: '10px 22px', background: '#FAFBFA', fontSize: 12, fontWeight: 700, color: 'var(--tg-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              <span>Member</span><span>Status</span><span>XP</span><span>Streak</span><span>Badges</span><span></span>
            </div>

            {team.map((member, i) => {
              const sc = statusConfig[member.status] || statusConfig.AT_RISK
              const nudged = nudgedIds.has(member.email)
              return (
                <div key={member.email} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.9fr 1fr 1.1fr 120px', padding: '13px 22px', alignItems: 'center', borderBottom: i < team.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  {/* Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--tg-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#06210F' }}>
                      {getInitial(member.email)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tg-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(member.email)}</div>
                      <div style={{ fontSize: 12, color: levelColors[member.level] || '#64748b', fontWeight: 600 }}>{member.level}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: sc.bg, color: sc.color, fontSize: 13, fontWeight: 600 }}>
                      <sc.Icon size={12} strokeWidth={2.2} /> {sc.label}
                    </span>
                  </div>

                  {/* XP */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} color="#16A34A" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tg-text)' }}>{member.totalXp}</span>
                  </div>

                  {/* Streak */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Flame size={13} color={member.currentStreak > 0 ? '#B45309' : '#cbd5e1'} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tg-text)' }}>{member.currentStreak}</span>
                    <span style={{ fontSize: 13, color: 'var(--tg-muted)' }}>d</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {member.badges && member.badges.length > 0 ? (
                      member.badges.map(b => (
                        <span key={b} title={b === 'HOT_STREAK' ? 'Hot Streak (5d)' : 'Iron Streak (30d)'} style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                          background: b === 'HOT_STREAK' ? '#FEF3E2' : '#EEF2F8',
                          color: b === 'HOT_STREAK' ? '#B45309' : '#3155A4',
                          border: `1px solid ${b === 'HOT_STREAK' ? '#FADFB4' : '#D7E0F0'}`,
                        }}>{b === 'HOT_STREAK' ? 'HOT' : 'IRON'}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: 13, color: '#cbd5e1' }}>—</span>
                    )}
                  </div>

                  {/* Nudge */}
                  <div>
                    <button
                      onClick={() => nudgeMutation.mutate({ email: member.email, employeeName: getName(member.email) })}
                      disabled={nudged || nudgeMutation.isPending}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                        cursor: nudged ? 'default' : 'pointer',
                        border: `1px solid ${nudged ? '#C9EAD4' : 'var(--tg-border)'}`,
                        background: nudged ? '#EAF7EE' : '#fff',
                        color: nudged ? '#15803D' : '#374151',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (!nudged) { e.currentTarget.style.background = '#f1f7f2'; e.currentTarget.style.borderColor = 'var(--tg-green-500)' } }}
                      onMouseLeave={e => { if (!nudged) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--tg-border)' } }}
                    >
                      <Send size={12} />
                      {nudged ? 'Sent' : 'Nudge'}
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
