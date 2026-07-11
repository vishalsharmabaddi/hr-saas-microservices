import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { MailCheck } from 'lucide-react'
import api from '../api/axios'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteToken = params.get('token')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAccept(credentialResponse) {
    const googleToken = credentialResponse.credential
    setBusy(true); setError('')
    try {
      // Backend: token + email-lock check → membership banti hai + naya JWT
      const { data } = await api.post('/auth/accept-invite', { googleToken, inviteToken })
      const primary = data.memberships?.[0] || null
      localStorage.setItem('wt_token', data.token)
      localStorage.setItem('wt_onboarded', 'true')   // onboarding gate na roke
      localStorage.setItem('wt_user', JSON.stringify({
        name: data.name,
        email: data.email,
        picture: data.picture,
        token: googleToken,
        role: primary?.role || 'EMPLOYEE',
        companyId: primary?.companyId ?? null,
        memberships: data.memberships || [],
      }))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept this invite. It may be invalid or expired.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', textAlign: 'center' }}>

        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <MailCheck size={26} color="#16A34A" />
        </div>

        {!inviteToken ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Invalid invite link</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
              This link is missing its code. Ask your admin to send the invite again.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>You've been invited</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
              Sign in with Google to join the workspace. Use the <b>same email</b> your invite was sent to.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
              <GoogleLogin
                onSuccess={handleAccept}
                onError={() => setError('Google sign-in failed. Try again.')}
                text="continue_with"
                width="320"
              />
            </div>

            {busy && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 14 }}>Accepting invite…</p>}
            {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 14 }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
