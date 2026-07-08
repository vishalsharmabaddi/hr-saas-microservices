import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { getRoleForEmail } from '../auth/roles'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  function saveAndGo(user) {
    localStorage.setItem('wt_user', JSON.stringify(user))
    navigate('/dashboard')
  }

  function handleGoogleSuccess(credentialResponse) {
    const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]))
    saveAndGo({
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      token: credentialResponse.credential,
      role: getRoleForEmail(payload.email),
    })
  }

  function handleEmailLogin() {
    if (!email || !password) { setError('Please fill all fields'); return }
    saveAndGo({
      name: email.split('@')[0],
      email,
      picture: null,
      role: getRoleForEmail(email),
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>

        {/* Branding */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>WorkTrack</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Sign in to your workspace</div>
        </div>

        {/* Google */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed. Try again.')}
            width="328"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {/* Email + Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            style={inSt}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
            style={inSt}
          />
        </div>

        {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{error}</p>}

        <button onClick={handleEmailLogin} style={{
          width: '100%', marginTop: 14, padding: '10px',
          background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}>
          Sign In
        </button>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
          By signing in, you agree to WorkTrack's terms of service
        </p>
      </div>
    </div>
  )
}

const inSt = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', color: '#0f172a', background: '#fff',
}

export default LoginPage
