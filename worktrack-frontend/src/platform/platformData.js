// ─────────────────────────────────────────────────────────────
// Platform Console pricing + stats helpers.
// Data ab REAL backend se aata hai (GET /api/platform/companies, owner-gated).
// Ye file sirf pricing (PLANS) aur derived stats rakhti hai — frontend pe MRR compute.
// ─────────────────────────────────────────────────────────────

// Pricing model — MRR isi se banta hai (flat monthly price per company)
export const PLANS = {
  FREE:     { label: 'Free',     price: 0,    color: '#64748b', bg: '#f1f5f9' },
  PRO:      { label: 'Pro',      price: 2400, color: '#16A34A', bg: '#EAF7EE' },
  BUSINESS: { label: 'Business', price: 7900, color: '#B45309', bg: '#FEF3E2' },
}

// Saari cards ka data ek jagah se — reduce se derive.
// companies me har item: { status: 'active'|'suspended', seats, plan }
export function computePlatformStats(companies) {
  const active = companies.filter(c => c.status === 'active')
  const totalUsers = companies.reduce((sum, c) => sum + (c.seats || 0), 0)
  const mrr = active.reduce((sum, c) => sum + (PLANS[c.plan]?.price || 0), 0)   // suspended MRR mein nahi
  const paid = companies.filter(c => c.plan !== 'FREE').length
  const byPlan = companies.reduce((acc, c) => { acc[c.plan] = (acc[c.plan] || 0) + 1; return acc }, {})
  return { total: companies.length, active: active.length, totalUsers, mrr, paid, byPlan }
}
