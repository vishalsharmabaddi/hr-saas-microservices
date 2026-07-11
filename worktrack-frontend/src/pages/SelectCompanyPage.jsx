import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import api from '../api/axios'
import { ROLE_STYLE } from '../auth/roles'

export default function SelectCompanyPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const memberships = user.memberships || []
  const [busy, setBusy] = useState(null)   // jis companyId pe click hua
  const [error, setError] = useState('')

  // Sirf 1 (ya 0) company ho to yahan aane ka matlab nahi — dashboard bhej do
  useEffect(() => {
    if (memberships.length <= 1) navigate('/dashboard', { replace: true })
  }, [])   // eslint-disable-line

  async function choose(m) {
    // Wahi company jisme abhi ho → seedha andar (naya token nahi chahiye)
    if (m.companyId === user.companyId) { navigate('/dashboard'); return }
    setBusy(m.companyId); setError('')
    try {
      const { data } = await api.post('/auth/switch-company', { companyId: m.companyId })
      const primary = (data.memberships || []).find(x => x.companyId === m.companyId) || null
      localStorage.setItem('wt_token', data.token)
      localStorage.setItem('wt_user', JSON.stringify({
        ...user,
        role: primary?.role || m.role,
        companyId: m.companyId,
        memberships: data.memberships || memberships,
      }))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not switch company. Try again.')
      setBusy(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '32px 28px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Choose a workspace</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 22 }}>
          You belong to more than one company. Pick one to continue.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memberships.map(m => {
            const rs = ROLE_STYLE[m.role] || ROLE_STYLE.EMPLOYEE
            const loading = busy === m.companyId
            return (
              <button key={m.companyId} onClick={() => choose(m)} disabled={busy !== null}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px',
                  cursor: busy !== null ? 'default' : 'pointer', width: '100%',
                }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={18} color="#4f46e5" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.companyName || `Company #${m.companyId}`}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: rs.color, background: rs.bg, padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginTop: 4 }}>{rs.label}</span>
                </div>
                {loading ? <span style={{ fontSize: 12, color: '#94a3b8' }}>…</span> : <ArrowRight size={16} color="#cbd5e1" />}
              </button>
            )
          })}
        </div>

        {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 14 }}>{error}</p>}
      </div>
    </div>
  )
}
