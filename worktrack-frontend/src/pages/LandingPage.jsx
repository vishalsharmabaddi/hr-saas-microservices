import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  CheckCircle2, X, BarChart2, Clock, CalendarOff, Users,
  FileText, Zap, Shield, ArrowRight, Check, ChevronDown, Menu,
} from 'lucide-react'
import taurusMark from '../assets/Taurus-Logo.png'
import dashboardImg from '../assets/Dashboard.png'

// ─── Data ────────────────────────────────────────────────────────────────────
const features = [
  { icon: FileText,   title: 'EOD Reports',        desc: 'Daily work diaries built into every task. No separate forms — people log time and notes in one place.' },
  { icon: Clock,      title: 'Time Logs — Free',   desc: 'Billable and non-billable time tracking at task level. Most tools charge extra for this. Taurus Go gives it free.' },
  { icon: BarChart2,  title: 'Workload Reports',   desc: 'See who is overloaded and who has capacity. A real-time workload view across your entire team.' },
  { icon: CalendarOff,title: 'Leave Management',   desc: 'Apply, approve, and track leaves in seconds. Managers get notified the moment a request comes in.' },
  { icon: Zap,        title: 'AI Summaries',       desc: 'AI reads the day’s EOD reports and delivers a single digest to managers. No manual review.' },
  { icon: Shield,     title: 'Role-Based Access',  desc: 'Admin, Manager, Employee — each role sees exactly what they need. Nothing more, nothing less.' },
]

const comparison = [
  { feature: 'Price (25 people)',   legacy: '$75/mo',    sheets: '$120/mo', tg: '$29/mo',  good: true  },
  { feature: 'EOD Reports',         legacy: false,       sheets: false,     tg: true,      good: true  },
  { feature: 'AI Summaries',        legacy: false,       sheets: false,     tg: true,      good: true  },
  { feature: 'Time Logs',           legacy: 'Paid',      sheets: false,     tg: 'Free',    good: true  },
  { feature: 'Workload Report',     legacy: 'Paywalled', sheets: false,     tg: 'Free',    good: true  },
  { feature: 'Leave Management',    legacy: true,        sheets: true,      tg: true,      good: false },
  { feature: 'Task Management',     legacy: true,        sheets: false,     tg: true,      good: false },
  { feature: 'Gamification',        legacy: false,       sheets: false,     tg: true,      good: true  },
  { feature: 'Setup Time',          legacy: 'Hours',     sheets: 'Hours',   tg: 'Minutes', good: true  },
]

const plans = [
  { name: 'Free',    price: '$0',     period: 'forever',   limit: 'Up to 12 people',   cta: 'Get started free', highlight: false,
    features: ['All core features', 'Leave management', 'Attendance tracking', 'Projects & tasks', 'Time logs'] },
  { name: 'Starter', price: '$29',    period: 'per month', limit: 'Up to 25 people',   cta: 'Start free trial', highlight: true,
    features: ['Everything in Free', 'AI EOD summaries', 'CSV export', 'Priority support'] },
  { name: 'Growth',  price: '$99',    period: 'per month', limit: 'Up to 150 people',  cta: 'Start free trial', highlight: false,
    features: ['Everything in Starter', 'Custom reports', 'Workload analytics', 'Milestones & issues', 'API access'] },
  { name: 'Scale',   price: 'Custom', period: '',          limit: 'Unlimited people',  cta: 'Contact sales',    highlight: false,
    features: ['Everything in Growth', 'Dedicated instance', 'SSO / SAML', 'SLA guarantee', 'Onboarding support'] },
]

const faqs = [
  { q: 'Is Taurus Go really free?', a: 'Yes. Up to 12 people, all core features are completely free — no credit card needed.' },
  { q: 'Can I import my existing team data?', a: 'Yes. We support CSV import for people and projects. Getting your team set up takes under 30 minutes.' },
  { q: 'How do AI summaries work?', a: 'At the end of each day, AI reads all EOD time logs and generates a team digest for your manager — automatically.' },
  { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. We never sell your data or share it with third parties.' },
]

const GRAD = 'linear-gradient(135deg, #16A34A 0%, #4ADE80 48%, #FACC15 100%)'

// ─── Comparison cell ──────────────────────────────────────────────────────────
function Cell({ val, isTaurus }) {
  if (val === true)  return <CheckCircle2 size={17} color={isTaurus ? '#16A34A' : '#94a3b8'} />
  if (val === false) return <X size={16} color="#cbd5e1" />
  return <span style={{ fontSize: 13, fontWeight: 600, color: isTaurus ? '#15803D' : '#64748b' }}>{val}</span>
}

// ─── Reusable primary CTA ─────────────────────────────────────────────────────
function CtaButton({ children, onClick, size = 'md' }) {
  const pad = size === 'lg' ? '13px 26px' : '10px 20px'
  const fs  = size === 'lg' ? 15 : 14
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, background: GRAD,
      color: '#06210F', border: 'none', borderRadius: 10, padding: pad, fontSize: fs,
      fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 26px rgba(34,197,94,0.4)',
      transition: 'transform 0.16s ease, box-shadow 0.16s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 34px rgba(34,197,94,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 26px rgba(34,197,94,0.4)' }}
    >{children}</button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const go = () => navigate('/login')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#14251A', background: '#F7F8F5' }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(3,16,10,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="lp-nav-inner" style={{ maxWidth: 1140, margin: '0 auto', height: 62, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', display: 'flex' }}>
              <img src={taurusMark} alt="Taurus Go" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span className="tg-display" style={{ color: '#F5FBF6', fontWeight: 700, fontSize: 17 }}>Taurus <span style={{ color: '#FACC15' }}>Go</span></span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', color: '#FACC15', background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 4, padding: '1px 5px' }}>BETA</span>
          </div>

          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', fontWeight: 500, padding: '6px 12px', borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{label}</a>
            ))}
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
            <button onClick={go} style={{ background: 'none', color: 'rgba(255,255,255,0.75)', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '6px 12px' }}>Sign in</button>
            <CtaButton onClick={go}>Get started free</CtaButton>
          </div>

          <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}>
            <Menu size={22} />
          </button>
        </div>
        {menuOpen && (
          <div className="lp-mobile-menu">
            {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} className="lp-mobile-link" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <button onClick={go} style={{ marginTop: 8, background: GRAD, color: '#06210F', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Get started free</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', background: 'radial-gradient(1200px 540px at 50% 125%, rgba(74,222,128,0.55), rgba(22,163,74,0.16) 45%, transparent 70%), linear-gradient(180deg, #03100A 0%, #04140C 52%, #0A4021 100%)', overflow: 'hidden' }}>
        <div className="lp-section-pad lp-hero-grid" style={{ maxWidth: 1140, margin: '0 auto', padding: '72px 40px 80px' }}>
          {/* Left — copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '6px 14px', marginBottom: 22 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, letterSpacing: '0.2px' }}>Work Smart. Go Further.</span>
            </div>
            <h1 className="tg-display" style={{ fontSize: 50, fontWeight: 700, color: '#fff', lineHeight: 1.08, letterSpacing: '-1.5px', margin: 0 }}>
              HR operations for teams that <span style={{ background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>move fast</span>.
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: '20px 0 30px', maxWidth: 480 }}>
              Attendance, leaves, projects, time logs and AI summaries — everything your team needs in one clean workspace. No bloat, no per-seat surprises.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <CtaButton onClick={go} size="lg">Get started free <ArrowRight size={17} /></CtaButton>
              <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '13px 22px' }}>See features</a>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 26, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
              {['No credit card', 'Free up to 12 people', 'Setup in minutes'].map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} color="#4ADE80" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Right — product mock */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-6% -4%', background: 'radial-gradient(circle at 60% 40%, rgba(74,222,128,0.25), transparent 65%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }}>
              <div style={{ height: 34, background: '#0A2E17', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
              </div>
              <img src={dashboardImg} alt="Taurus Go dashboard" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="lp-section-pad" style={{ maxWidth: 1140, margin: '0 auto', padding: '84px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Everything in one place</p>
          <h2 className="tg-display" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.8px', margin: 0 }}>One workspace for the whole team</h2>
          <p style={{ fontSize: 16, color: '#5B6B60', marginTop: 14, lineHeight: 1.6 }}>Stop stitching spreadsheets and half a dozen tools together. Taurus Go runs your people ops end to end.</p>
        </div>
        <div className="lp-features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: '#fff', border: '1px solid #E6E9E3', borderRadius: 16, padding: '26px 24px', transition: 'box-shadow 0.18s, transform 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 30px rgba(22,163,74,0.10)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, #EAF7EE, #FEF9E7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={22} color="#15803D" strokeWidth={2} />
              </div>
              <h3 className="tg-display" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
              <p style={{ fontSize: 14.5, color: '#5B6B60', lineHeight: 1.6, marginTop: 8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="lp-section-pad" style={{ background: '#fff', borderTop: '1px solid #E6E9E3', borderBottom: '1px solid #E6E9E3' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '84px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 className="tg-display" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.8px', margin: 0 }}>Why teams switch to Taurus Go</h2>
            <p style={{ fontSize: 16, color: '#5B6B60', marginTop: 12 }}>The same work, a fraction of the cost and setup time.</p>
          </div>
          <div className="lp-comparison-scroll">
            <div className="lp-comparison-inner" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E6E9E3' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#0B3D1E' }}>
                <div style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Feature</div>
                {['Legacy HR', 'Spreadsheets', 'Taurus Go'].map((h, i) => (
                  <div key={h} style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, textAlign: 'center', color: i === 2 ? '#FACC15' : 'rgba(255,255,255,0.5)' }}>{h}</div>
                ))}
              </div>
              {comparison.map((row, i) => (
                <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: '1px solid #EEF1EC', background: i % 2 ? '#FAFBFA' : '#fff' }}>
                  <div style={{ padding: '13px 18px', fontSize: 14, fontWeight: 500, color: '#14251A' }}>{row.feature}</div>
                  <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'center' }}><Cell val={row.legacy} /></div>
                  <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'center' }}><Cell val={row.sheets} /></div>
                  <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'center', background: 'rgba(34,197,94,0.05)' }}><Cell val={row.tg} isTaurus /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="lp-section-pad" style={{ maxWidth: 1140, margin: '0 auto', padding: '84px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 48px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Simple pricing</p>
          <h2 className="tg-display" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.8px', margin: 0 }}>Start free. Upgrade when you grow.</h2>
          <p style={{ fontSize: 16, color: '#5B6B60', marginTop: 14 }}>No per-seat games. Flat, honest plans.</p>
        </div>
        <div className="lp-pricing-grid">
          {plans.map(p => (
            <div key={p.name} style={{
              position: 'relative', background: '#fff', borderRadius: 16, padding: '26px 24px',
              border: p.highlight ? '2px solid transparent' : '1px solid #E6E9E3',
              backgroundImage: p.highlight ? `linear-gradient(#fff,#fff), ${GRAD}` : 'none',
              backgroundOrigin: 'border-box', backgroundClip: p.highlight ? 'padding-box, border-box' : 'border-box',
              boxShadow: p.highlight ? '0 20px 50px rgba(34,197,94,0.16)' : 'none',
            }}>
              {p.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: GRAD, color: '#06210F', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99, letterSpacing: '0.5px' }}>MOST POPULAR</div>}
              <h3 className="tg-display" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
                <span className="tg-display" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-1px' }}>{p.price}</span>
                {p.period && <span style={{ fontSize: 13, color: '#94a3b8' }}>/ {p.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: '#5B6B60', marginTop: 6 }}>{p.limit}</p>
              <button onClick={go} style={{
                width: '100%', margin: '18px 0', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                border: p.highlight ? 'none' : '1px solid #C9EAD4',
                background: p.highlight ? GRAD : '#fff', color: p.highlight ? '#06210F' : '#15803D',
                boxShadow: p.highlight ? '0 8px 22px rgba(34,197,94,0.35)' : 'none',
              }}>{p.cta}</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#334155' }}>
                    <Check size={15} color="#16A34A" strokeWidth={2.5} /> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="lp-section-pad" style={{ background: '#fff', borderTop: '1px solid #E6E9E3' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '84px 40px' }}>
          <h2 className="tg-display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.6px', textAlign: 'center', margin: '0 0 40px' }}>Frequently asked questions</h2>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid #EEF1EC' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '18px 0', textAlign: 'left' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#14251A' }}>{f.q}</span>
                <ChevronDown size={18} color="#94a3b8" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {openFaq === i && <p style={{ fontSize: 15, color: '#5B6B60', lineHeight: 1.65, margin: '0 0 18px' }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section style={{ background: 'radial-gradient(700px 300px at 50% 0%, rgba(74,222,128,0.16), transparent 60%), linear-gradient(180deg, #0B3D1E, #072B14)' }}>
        <div className="lp-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <h2 className="tg-display" style={{ fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Ready to work smart?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '16px 0 30px', lineHeight: 1.6 }}>Set up your team in minutes. Free up to 12 people — no credit card required.</p>
          <CtaButton onClick={go} size="lg">Get started free <ArrowRight size={17} /></CtaButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#072B14', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="lp-section-pad" style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', display: 'flex' }}>
                <img src={taurusMark} alt="Taurus Go" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div className="tg-display" style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Taurus Go</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Work Smart. Go Further.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 22, fontSize: 14, flexWrap: 'wrap' }}>
              {[['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq']].map(([l, h]) => (
                <a key={l} href={h} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{l}</a>
              ))}
              <button onClick={go} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', padding: 0 }}>Sign in</button>
            </div>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Taurus Go. All rights reserved. · Currently in beta.
          </div>
        </div>
      </footer>
    </div>
  )
}
