import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'

// Koi bhi aisa URL jo humare routes se match nahi karta, yahan aata hai.
export default function NotFoundPage() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('wt_user')

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Compass size={26} color="#16A34A" strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 }}>404</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Page not found</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <button
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
          style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {isLoggedIn ? 'Back to Dashboard' : 'Go Home'}
        </button>
      </div>
    </div>
  )
}
