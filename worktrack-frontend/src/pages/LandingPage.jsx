import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TypeAnimation } from 'react-type-animation'
import {
  CheckCircle, X, BarChart2, Clock, CalendarOff, Users,
  FileText, Zap, Shield, ArrowRight, Check, ChevronDown,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: 'EOD Reports',
    desc: 'Daily work diaries built into every task. No separate forms — employees log time and notes in one place.',
  },
  {
    icon: Clock,
    title: 'Time Logs — Free',
    desc: 'Billable and non-billable time tracking at task level. Zoho charges extra for this. WorkTrack gives it free.',
  },
  {
    icon: BarChart2,
    title: 'Workload Reports — Free',
    desc: 'See who is overloaded and who has capacity. Real-time workload view across your entire team.',
  },
  {
    icon: CalendarOff,
    title: 'Leave Management',
    desc: 'Apply, approve, and track leaves in seconds. Manager gets notified instantly via Kafka events.',
  },
  {
    icon: Zap,
    title: 'AI Summaries',
    desc: "Claude AI reads your team's EOD reports and delivers a single daily digest to managers. No manual review.",
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Admin, Manager, Employee — each role sees exactly what they need. Nothing more, nothing less.',
  },
]

const comparison = [
  { feature: 'Price (25 employees)',    zoho: '$75/mo',  bamboo: '$120/mo', wt: '$29/mo',  wtGood: true  },
  { feature: 'EOD Reports',            zoho: false,      bamboo: false,     wt: true,      wtGood: true  },
  { feature: 'AI Summaries',           zoho: false,      bamboo: false,     wt: true,      wtGood: true  },
  { feature: 'Time Logs',              zoho: 'Paid',     bamboo: false,     wt: 'Free',    wtGood: true  },
  { feature: 'Workload Report',        zoho: 'Paywalled',bamboo: false,     wt: 'Free',    wtGood: true  },
  { feature: 'Leave Management',       zoho: true,       bamboo: true,      wt: true,      wtGood: false },
  { feature: 'Task Management',        zoho: true,       bamboo: false,     wt: true,      wtGood: false },
  { feature: 'Gamification',           zoho: false,      bamboo: false,     wt: true,      wtGood: true  },
  { feature: 'Setup Time',             zoho: 'Hours',    bamboo: 'Hours',   wt: 'Minutes', wtGood: true  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    limit: 'Up to 12 employees',
    features: ['All basic features', 'Leave management', 'Attendance tracking', 'Project & task management', 'Time logs'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: 'per month',
    limit: 'Up to 25 employees',
    features: ['Everything in Free', 'AI EOD summaries', 'CSV export', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Growth',
    price: '$99',
    period: 'per month',
    limit: 'Up to 150 employees',
    features: ['Everything in Starter', 'Custom reports', 'Workload analytics', 'Milestones & issues tracker', 'API access'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    limit: 'Unlimited employees',
    features: ['Everything in Growth', 'Dedicated instance', 'SSO / SAML', 'SLA guarantee', 'Onboarding support'],
    cta: 'Contact sales',
    highlight: false,
  },
]

// ─── Cell renderer ────────────────────────────────────────────────────────────
function Cell({ val, isWt }) {
  if (val === true)  return <CheckCircle size={16} color={isWt ? '#4f46e5' : '#16a34a'} />
  if (val === false) return <X size={16} color="#cbd5e1" />
  return <span style={{ fontSize: 12, fontWeight: 600, color: isWt ? '#4f46e5' : '#64748b' }}>{val}</span>
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  const faqs = [
    { q: 'Is WorkTrack really free?', a: 'Yes. Up to 12 employees, all core features are completely free — no credit card needed.' },
    { q: 'Can I import my existing team data?', a: 'Yes. We support CSV import for employees and projects. Getting your team set up takes under 30 minutes.' },
    { q: 'How does AI summary work?', a: 'At the end of each day, Claude AI reads all EOD time logs and generates a team digest for your manager — automatically.' },
    { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. We never sell your data or share it with third parties.' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif", color: '#0f172a' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 40px', height: 60,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
            }}>W</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>WorkTrack</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#a5b4fc',
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 4, padding: '1px 6px', letterSpacing: '0.5px',
            }}>BETA</span>
          </div>

          {/* Nav links + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none',
                fontWeight: 500, padding: '6px 12px', borderRadius: 6,
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.background = 'transparent' }}
              >{label}</a>
            ))}
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
            <button onClick={() => navigate('/login')} style={{
              background: 'none', color: 'rgba(255,255,255,0.6)', border: 'none',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '6px 12px',
            }}>
              Sign in
            </button>
            <button onClick={() => navigate('/login')} style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 18px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
            }}>
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: '#fff',
        padding: '100px 40px 120px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-block', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '4px 14px', marginBottom: 28 }}>
          <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 500 }}>
            Built for growing teams ·{' '}
            <a href="#pricing" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}>Free to start</a>
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 800,
          color: '#0f172a', lineHeight: 1.12, letterSpacing: '-1.5px',
          maxWidth: 760, margin: '0 auto 22px',
        }}>
          HR operations for teams that don't have time for
          <span style={{ display: 'block', minHeight: '1.15em' }}>
            <TypeAnimation
              sequence={[
                'complicated software', 2500,
                'expensive tools',      2500,
                'manual HR tracking',   2500,
                'messy spreadsheets',   2500,
              ]}
              speed={40}
              deletionSpeed={60}
              repeat={Infinity}
              cursor={true}
              style={{ color: '#4f46e5' }}
            />
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)', color: '#374151',
          maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7,
        }}>
          Attendance, leaves, projects, time logs, and AI summaries — all in one place.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/login')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#4f46e5', color: '#fff', border: 'none',
            borderRadius: 10, padding: '13px 28px', fontSize: 15,
            fontWeight: 600, cursor: 'pointer',
          }}>
            Get started free <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')} style={{
            background: '#fff', color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '13px 28px', fontSize: 15,
            fontWeight: 500, cursor: 'pointer',
          }}>
            View demo
          </button>
        </div>

        {/* Social proof */}
        <p style={{ marginTop: 36, fontSize: 12, color: '#6b7280' }}>
          No credit card required · Setup in 5 minutes · Cancel anytime
        </p>

        {/* Mock dashboard preview */}
        <div style={{ maxWidth: 860, margin: '56px auto 0', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.12)' }}>
          {/* Mock header bar */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.6 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 12 }}>WorkTrack Dashboard</span>
          </div>

          {/* Mock content */}
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total Projects', val: '12', color: '#818cf8' },
              { label: 'Open Tasks',     val: '38', color: '#f59e0b' },
              { label: 'Attendance Today', val: '24', color: '#34d399' },
              { label: 'Pending Leaves', val: '3',  color: '#f87171' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-1px' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Mock table rows */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Project', 'Status', 'Tasks', 'Due'].map(h => (
                  <span key={h} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>
              {[
                { name: 'HR Portal Redesign', status: 'In Progress', tasks: '12/20', due: 'Aug 15' },
                { name: 'Payroll Automation',  status: 'Planning',    tasks: '3/8',   due: 'Sep 1'  },
                { name: 'Employee Onboarding', status: 'Completed',   tasks: '8/8',   due: 'Done'   },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{row.name}</span>
                  <span style={{ fontSize: 11, color: row.status === 'Completed' ? '#34d399' : row.status === 'In Progress' ? '#f59e0b' : '#818cf8' }}>{row.status}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{row.tasks}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{row.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
              Everything your team needs.<br />Nothing they don't.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '28px 24px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={18} color="#4f46e5" strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Comparison</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px' }}>
              Why teams switch to WorkTrack
            </h2>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#0f172a', padding: '14px 24px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Feature</span>
              {['Zoho', 'BambooHR', 'WorkTrack'].map((h, i) => (
                <span key={h} style={{ fontSize: 13, fontWeight: 700, color: i === 2 ? '#818cf8' : 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{h}</span>
              ))}
            </div>

            {comparison.map((row, i) => (
              <div key={row.feature} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '13px 24px', alignItems: 'center',
                borderBottom: i < comparison.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}>
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{row.feature}</span>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Cell val={row.zoho}   isWt={false} /></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Cell val={row.bamboo} isWt={false} /></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Cell val={row.wt}     isWt={true}  /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.8px' }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 15, color: '#475569', marginTop: 12 }}>Start free. Scale as you grow. No hidden fees.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {plans.map(({ name, price, period, limit, features: feats, cta, highlight }) => {
              const isFree = name === 'Free'
              return (
                <div key={name} style={{
                  borderRadius: 16, padding: '28px 24px',
                  border: highlight ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: highlight ? '#fafafe' : '#fff',
                  position: 'relative',
                  opacity: isFree ? 1 : 0.7,
                }}>
                  {highlight && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      Most popular
                    </div>
                  )}
                  {!isFree && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.3px' }}>
                      COMING SOON
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>{price}</span>
                      {period && <span style={{ fontSize: 13, color: '#64748b' }}>{period}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{limit}</div>
                  </div>

                  {isFree ? (
                    <button onClick={() => navigate('/login')} style={{
                      width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', marginBottom: 24, border: 'none',
                      background: '#f1f5f9', color: '#334155',
                    }}>
                      {cta}
                    </button>
                  ) : (
                    <button disabled style={{
                      width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'not-allowed', marginBottom: 24, border: '1px solid #e2e8f0',
                      background: '#f8fafc', color: '#94a3b8',
                    }}>
                      Coming soon
                    </button>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {feats.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Check size={14} color={isFree ? '#4f46e5' : '#94a3b8'} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: isFree ? '#475569' : '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '70px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', textAlign: 'center', marginBottom: 40 }}>Frequently asked questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{faq.q}</span>
                <ChevronDown size={16} color="#64748b" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              {openFaq === i && <p style={{ fontSize: 13, color: '#475569', marginTop: 10, lineHeight: 1.7 }}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        padding: '80px 40px',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background circles */}
        <div style={{ position: 'absolute', top: -60, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 16px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>Free forever for small teams</span>
          </div>

          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.15 }}>
            Your team deserves tools<br />they actually enjoy using.
          </h2>

          <p style={{ fontSize: 15, color: '#475569', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7 }}>
            WorkTrack is built for the way modern teams work — fast, async, and without the overhead of enterprise software.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px 28px', fontSize: 15,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}>
              Get started free <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/login')} style={{
              background: '#fff', color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '13px 28px', fontSize: 15,
              fontWeight: 500, cursor: 'pointer',
            }}>
              View demo
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '56px 40px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Top row: brand + links */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff',
                }}>W</div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>WorkTrack</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 240 }}>
                HR operations for modern teams. Attendance, leaves, projects, and AI summaries — all in one place.
              </p>
            </div>

            {/* Product */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Product</p>
              {['Features', 'Pricing', 'FAQ', 'Changelog'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{item}</a>
              ))}
            </div>

            {/* Company */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Company</p>
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{item}</a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Legal</p>
              {['Privacy Policy', 'Terms of Service', 'Security', 'Cookies'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{item}</a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 WorkTrack. All rights reserved.</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Built with ♥ for growing teams</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
