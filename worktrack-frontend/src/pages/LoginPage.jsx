import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { getRoleForEmail } from '../auth/roles'
import api from '../api/axios'
import taurusLogo from '../assets/Taurus.png'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  function saveAndGo(user, path = '/dashboard') {
    localStorage.setItem('wt_user', JSON.stringify(user))
    navigate(path)
  }

  async function handleGoogleSuccess(credentialResponse) {
    const token = credentialResponse.credential
    try {
      // Backend token verify karega + memberships (M1 table) se role/company dega
      const { data } = await api.post('/auth/google', { token })
      const primary = data.memberships?.[0] || null   // abhi pehli company; multi-company picker baad me
      const isNewUser = !data.memberships || data.memberships.length === 0
      const pendingInvite = data.pendingInvites?.[0] || null   // koi invite jo accept hona baaki hai
      localStorage.setItem('wt_token', data.token)     // humara backend JWT (wristband)
      const manyCompanies = (data.memberships?.length || 0) > 1
      // Naya user: pending invite → accept; warna company banao (M5).
      // Purana user: 2+ companies → picker; warna dashboard.
      const dest = isNewUser
        ? (pendingInvite ? `/accept-invite?token=${pendingInvite.inviteToken}` : '/onboarding')
        : manyCompanies
          ? '/select-company'
          : '/dashboard'
      saveAndGo({
        name: data.name,
        email: data.email,
        picture: data.picture,
        token,
        role: primary?.role || null,                  // company banne tak koi role nahi
        companyId: primary?.companyId ?? null,
        memberships: data.memberships || [],
      }, dest)
    } catch (err) {
      setError('Login verification failed. Please try again.')
    }
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
    <div style={{ minHeight: '100vh', background: 'var(--tg-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>

        {/* Branding */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <img src={taurusLogo} alt="Taurus Go" style={{ width: 200, height: 'auto', display: 'inline-block', marginBottom: 8 }} />
          <div style={{ fontSize: 15, color: 'var(--tg-muted)' }}>Sign in to your workspace</div>
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
          <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>or continue with email</span>
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

        {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{error}</p>}

        <button onClick={handleEmailLogin} className="btn-primary" style={{ width: '100%', marginTop: 14 }}>
          Sign In
        </button>

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
          By signing in, you agree to Taurus Go's terms of service
        </p>
      </div>
    </div>
  )
}

const inSt = {
  width: '100%', padding: '11px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 15, outline: 'none',
  boxSizing: 'border-box', color: '#0f172a', background: '#fff',
}

export default LoginPage
