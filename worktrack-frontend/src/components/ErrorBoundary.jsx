import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

// React me Error Boundary sirf CLASS component ho sakta hai — iske liye koi hook nahi hai.
// Neeche ke kisi bhi component ka render-time crash yahan pakda jaata hai. Ye na ho to
// React puri app ko unmount kar deta hai aur user ko blank white page dikhta hai.
export default class ErrorBoundary extends Component {
  state = { error: null }

  // Crash hote hi state badal do → agle render me fallback UI dikhega.
  static getDerivedStateFromError(error) {
    return { error }
  }

  // Sirf logging ke liye. Aage jaake yahan se error tracking service (Sentry) call hogi.
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertTriangle size={26} color="#dc2626" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred and this page could not be displayed. Your data is safe.
            Try reloading — if it keeps happening, contact support.
          </p>

          {/* Technical details sirf dev me. Production me stack trace dikhana app ke
              internals leak karta hai — attacker ko free map mil jaata hai. */}
          {import.meta.env.DEV && (
            <pre style={{ textAlign: 'left', fontSize: 12, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 24, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {String(error?.stack || error)}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Reload Page
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard' }}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
