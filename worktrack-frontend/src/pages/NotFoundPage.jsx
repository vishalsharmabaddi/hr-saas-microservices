import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'

// Catch-all for any URL that matches no route.
export default function NotFoundPage() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('wt_user')

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Compass size={34} color="var(--tg-green-600)" strokeWidth={1.5} />
        </div>

        <div className="tg-display" style={{ fontSize: 56, fontWeight: 800, color: 'var(--tg-green-600)', lineHeight: 1, marginBottom: 14, letterSpacing: '-0.03em' }}>
          404
        </div>
        <h1 className="tg-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--tg-text)', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Page not found
        </h1>
        <p style={{ fontSize: 16, color: 'var(--tg-muted)', lineHeight: 1.65, marginBottom: 28 }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <button
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
          style={{ padding: '12px 26px', borderRadius: 10, border: 'none', background: 'var(--tg-green-600)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          {isLoggedIn ? 'Back to Dashboard' : 'Go Home'}
        </button>
      </div>
    </div>
  )
}
