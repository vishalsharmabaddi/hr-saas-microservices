import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldOff size={26} color="#dc2626" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          You don't have permission to view this page. Contact your admin to request access.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
