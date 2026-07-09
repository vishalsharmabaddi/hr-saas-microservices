import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Building2, Users, IndianRupee, CreditCard, Ban, CheckCircle2, Search, X } from 'lucide-react'
import { getPlatformCompanies, savePlatformCompanies, computePlatformStats, PLANS } from '../platform/platformData'

// Platform Console — sirf app owner (Platform Owner) ke liye. Company sidebar se ALAG area.
export default function PlatformAdminPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')

  // useState — kyunki suspend/activate/plan-change pe list badlegi aur re-render chahiye
  const [companies, setCompanies] = useState(() => getPlatformCompanies())
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')      // all | active | suspended
  const [selectedId, setSelectedId] = useState(null)           // detail drawer ke liye

  const stats = useMemo(() => computePlatformStats(companies), [companies])

  // Filter sirf DIKHANE ke liye list chhaanta hai — data (companies) nahi badalta
  const q = query.trim().toLowerCase()
  const filtered = companies.filter(c => {
    const matchQ = !q || `${c.name} ${c.domain}`.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || c.status === statusFilter
    return matchQ && matchS
  })

  const selected = companies.find(c => c.id === selectedId) || null

  // Status toggle → state update + localStorage save (refresh-proof)
  function toggleStatus(id) {
    setCompanies(list => {
      const next = list.map(c =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c
      )
      savePlatformCompanies(next)
      return next
    })
  }

  // Plan change (detail drawer se)
  function changePlan(id, plan) {
    setCompanies(list => {
      const next = list.map(c => c.id === id ? { ...c, plan } : c)
      savePlatformCompanies(next)
      return next
    })
  }

  const cards = [
    { icon: Building2,   label: 'Companies',       value: stats.total,                              sub: `${stats.active} active`,        tint: '#4f46e5' },
    { icon: Users,       label: 'Total Users',     value: stats.totalUsers,                         sub: 'across all tenants',            tint: '#0ea5e9' },
    { icon: IndianRupee, label: 'Monthly Revenue', value: `₹${stats.mrr.toLocaleString('en-IN')}`,  sub: 'MRR',                           tint: '#16a34a' },
    { icon: CreditCard,  label: 'Paid Customers',  value: stats.paid,                               sub: `of ${stats.total} companies`,   tint: '#7c3aed' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Dark top-bar — signal "you are in the platform console, not a company page" */}
      <header style={{
        background: '#0f172a', color: '#fff', padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={19} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Platform Console</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>WorkTrack · Owner</div>
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)', color: '#e2e8f0', borderRadius: 8,
          padding: '7px 12px', fontSize: 12.5, cursor: 'pointer',
        }}>
          <ArrowLeft size={14} /> Back to app
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Welcome back, {user.name?.split(' ')[0] || 'Owner'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
          Manage every company using WorkTrack from here.
        </p>

        {/* 4 stat cards */}
        <div style={{
          marginTop: 22, display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}>
          {cards.map(({ icon: Icon, label, value, sub, tint }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: `${tint}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <Icon size={19} color={tint} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div style={{
          marginTop: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Plan breakdown</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, marginBottom: 16 }}>
            How your {stats.total} companies are distributed across plans
          </div>

          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}>
            {Object.keys(PLANS).map(key => {
              const count = stats.byPlan[key] || 0
              const pct = stats.total ? (count / stats.total) * 100 : 0
              return count ? <div key={key} title={`${PLANS[key].label}: ${count}`}
                style={{ width: `${pct}%`, background: PLANS[key].color }} /> : null
            })}
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
            {Object.keys(PLANS).map(key => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: PLANS[key].color }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{PLANS[key].label}</span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{stats.byPlan[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Companies table */}
        <div style={{
          marginTop: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Toolbar — title + search + status filter */}
          <div style={{
            padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginRight: 'auto' }}>All companies</div>

            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc',
              border: '1px solid #e2e8f0', borderRadius: 9, padding: '7px 11px', minWidth: 220,
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search companies…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, color: '#0f172a' }}
              />
            </div>

            {/* Status filter chips */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 9, padding: 3 }}>
              {['all', 'active', 'suspended'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize', border: 'none', cursor: 'pointer',
                  padding: '5px 12px', borderRadius: 7,
                  background: statusFilter === s ? '#fff' : 'transparent',
                  color: statusFilter === s ? '#0f172a' : '#64748b',
                  boxShadow: statusFilter === s ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Company', 'Plan', 'Users', 'Status', 'Joined', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i === 2 ? 'right' : 'left', padding: '10px 22px',
                      fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No companies match your filters.
                  </td></tr>
                ) : filtered.map(c => {
                  const plan = PLANS[c.plan] || PLANS.FREE
                  const suspended = c.status === 'suspended'
                  return (
                    <tr key={c.id} onClick={() => setSelectedId(c.id)} style={{
                      borderBottom: '1px solid #f1f5f9', opacity: suspended ? 0.6 : 1, cursor: 'pointer',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 22px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.domain}</div>
                      </td>
                      <td style={{ padding: '12px 22px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: plan.color, background: plan.bg,
                          padding: '3px 10px', borderRadius: 20,
                        }}>{plan.label}</span>
                      </td>
                      <td style={{ padding: '12px 22px', textAlign: 'right', fontSize: 13, color: '#334155' }}>{c.seats}</td>
                      <td style={{ padding: '12px 22px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          color: suspended ? '#dc2626' : '#16a34a',
                          background: suspended ? '#fef2f2' : '#f0fdf4',
                        }}>{suspended ? 'Suspended' : 'Active'}</span>
                      </td>
                      <td style={{ padding: '12px 22px', fontSize: 13, color: '#64748b' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 22px', textAlign: 'right' }}>
                        {/* stopPropagation — warna row click bhi trigger hoke drawer khul jaata */}
                        <button onClick={e => { e.stopPropagation(); toggleStatus(c.id) }} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                          fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8,
                          border: `1px solid ${suspended ? '#bbf7d0' : '#fecaca'}`,
                          color: suspended ? '#16a34a' : '#dc2626',
                          background: suspended ? '#f0fdf4' : '#fef2f2',
                        }}>
                          {suspended ? <><CheckCircle2 size={14} /> Activate</> : <><Ban size={14} /> Suspend</>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Company detail drawer */}
      {selected && (
        <div onClick={() => setSelectedId(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 400, maxWidth: '92vw', height: '100%', background: '#fff',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', padding: 24, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{selected.domain}</div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            {/* Info rows */}
            <div style={{ marginTop: 22, display: 'grid', gap: 14 }}>
              <DetailRow label="Status" value={
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  color: selected.status === 'suspended' ? '#dc2626' : '#16a34a',
                  background: selected.status === 'suspended' ? '#fef2f2' : '#f0fdf4',
                }}>{selected.status === 'suspended' ? 'Suspended' : 'Active'}</span>
              } />
              <DetailRow label="Users" value={selected.seats} />
              <DetailRow label="Joined" value={new Date(selected.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <DetailRow label="MRR contribution" value={
                `₹${(selected.status === 'active' ? (PLANS[selected.plan]?.price || 0) : 0).toLocaleString('en-IN')}`
              } />
            </div>

            {/* Change plan */}
            <div style={{ marginTop: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>PLAN</label>
              <select value={selected.plan} onChange={e => changePlan(selected.id, e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #e2e8f0',
                fontSize: 13.5, color: '#0f172a', background: '#fff', cursor: 'pointer',
              }}>
                {Object.keys(PLANS).map(key => (
                  <option key={key} value={key}>{PLANS[key].label} — ₹{PLANS[key].price.toLocaleString('en-IN')}/mo</option>
                ))}
              </select>
            </div>

            {/* Suspend / Activate action */}
            <button onClick={() => toggleStatus(selected.id)} style={{
              marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '11px', borderRadius: 10,
              border: `1px solid ${selected.status === 'suspended' ? '#bbf7d0' : '#fecaca'}`,
              color: selected.status === 'suspended' ? '#16a34a' : '#dc2626',
              background: selected.status === 'suspended' ? '#f0fdf4' : '#fef2f2',
            }}>
              {selected.status === 'suspended'
                ? <><CheckCircle2 size={16} /> Activate company</>
                : <><Ban size={16} /> Suspend company</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{value}</span>
    </div>
  )
}
