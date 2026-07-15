import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

// Error boundaries must be class components — React has no hook equivalent.
// Without one, a render-time crash anywhere below unmounts the entire React
// tree and the user is left staring at a blank white page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <AlertTriangle size={34} color="#dc2626" strokeWidth={1.5} />
          </div>

          <h1 className="tg-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--tg-text)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 16, color: 'var(--tg-muted)', lineHeight: 1.65, marginBottom: 28 }}>
            An unexpected error occurred and this page could not be displayed. Your data is safe.
            Try reloading — if it keeps happening, contact support.
          </p>

          {/* Technical details in development only. Exposing stack traces in production
              hands an attacker a free map of the app's internals. */}
          {import.meta.env.DEV && (
            <pre style={{ textAlign: 'left', fontSize: 12.5, lineHeight: 1.6, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 28, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {String(error?.stack || error)}
            </pre>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 26px', borderRadius: 10, border: 'none', background: 'var(--tg-green-600)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Reload Page
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard' }}
              style={{ padding: '12px 26px', borderRadius: 10, border: '1px solid var(--tg-border)', background: 'var(--tg-card)', color: 'var(--tg-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
