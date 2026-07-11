// ─────────────────────────────────────────────────────────────
// Platform Console ka DEMO data source.
// NOTE: Backend abhi single-tenant hai (sirf 1 real company).
// Jab multi-tenant backend banega, sirf getPlatformCompanies() ke
// andar API call laga dena — baaki UI/stats same chalega.
// ─────────────────────────────────────────────────────────────

// Pricing model — MRR isi se banta hai (flat monthly price per company)
export const PLANS = {
  FREE:     { label: 'Free',     price: 0,    color: '#64748b', bg: '#f1f5f9' },
  PRO:      { label: 'Pro',      price: 2400, color: '#16A34A', bg: '#EAF7EE' },
  BUSINESS: { label: 'Business', price: 7900, color: '#B45309', bg: '#FEF3E2' },
}

// Demo tenants — pehli company tumhari asli wali (Taurus Go Inc.)
const SEED = [
  { id: 1, name: 'Taurus Go Inc.', domain: 'worktrack.com', plan: 'BUSINESS', seats: 12, status: 'active',    createdAt: '2026-07-08' },
  { id: 2, name: 'Acme Corp',      domain: 'acme.com',      plan: 'PRO',      seats: 8,  status: 'active',    createdAt: '2026-05-21' },
  { id: 3, name: 'Globex',         domain: 'globex.io',     plan: 'FREE',     seats: 3,  status: 'active',    createdAt: '2026-06-02' },
  { id: 4, name: 'Initech',        domain: 'initech.com',   plan: 'PRO',      seats: 15, status: 'active',    createdAt: '2026-04-11' },
  { id: 5, name: 'Umbrella Ltd',   domain: 'umbrella.co',   plan: 'BUSINESS', seats: 24, status: 'suspended', createdAt: '2026-03-19' },
  { id: 6, name: 'Hooli',          domain: 'hooli.xyz',     plan: 'FREE',     seats: 5,  status: 'active',    createdAt: '2026-06-28' },
]

const KEY = 'wt_platform_companies'

export function getPlatformCompanies() {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr } catch { /* corrupt → reseed */ }
  }
  localStorage.setItem(KEY, JSON.stringify(SEED))
  return SEED
}

export function savePlatformCompanies(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Saari cards ka data ek jagah se — reduce se derive
export function computePlatformStats(companies) {
  const active = companies.filter(c => c.status === 'active')
  const totalUsers = companies.reduce((sum, c) => sum + (c.seats || 0), 0)
  const mrr = active.reduce((sum, c) => sum + (PLANS[c.plan]?.price || 0), 0)   // suspended MRR mein nahi
  const paid = companies.filter(c => c.plan !== 'FREE').length
  const byPlan = companies.reduce((acc, c) => { acc[c.plan] = (acc[c.plan] || 0) + 1; return acc }, {})
  return { total: companies.length, active: active.length, totalUsers, mrr, paid, byPlan }
}
