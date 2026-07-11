import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Rocket, Building2, Users, ArrowRight, ArrowLeft, Check, Plus, X, Mail } from 'lucide-react'
import api from '../api/axios'
import { ROLE_STYLE } from '../auth/roles'

const STEPS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'company', label: 'Company' },
  { key: 'invite',  label: 'Invite' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  // ── O2: Company (reuse F1 upsert) ──────────────────────────
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const company = companies[0] || null

  const [companyForm, setCompanyForm] = useState({ name: '', domain: '', logoUrl: '' })
  useEffect(() => {
    if (company) setCompanyForm({ name: company.name || '', domain: company.domain || '', logoUrl: company.logoUrl || '' })
  }, [company])

  const saveCompany = useMutation({
    mutationFn: (data) => {
      const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
      // M5 Founder path: abhi koi company nahi → register-company (company + ADMIN + naya token)
      if (!user.companyId) {
        return api.post('/auth/register-company', {
          token: user.token,                 // Google token = identity proof
          companyName: data.name,
          domain: data.domain || null,
        }).then(res => {
          const d = res.data
          const primary = d.memberships?.[0] || null
          localStorage.setItem('wt_token', d.token)             // naya token (ab companyId + ADMIN)
          localStorage.setItem('wt_user', JSON.stringify({
            ...user,
            role: primary?.role || 'ADMIN',
            companyId: primary?.companyId ?? null,
            memberships: d.memberships || [],
          }))
          return res
        })
      }
      // Existing admin sirf company details edit kar raha hai
      return company
        ? api.put(`/companies/${company.id}`, { ...company, ...data })
        : api.post('/companies', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setStep(2)                        // company save hone ke baad hi aage
    },
  })

  // ── O3: Invite team (real /api/team on finish) ─────────────
  const [invites, setInvites] = useState([])
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'EMPLOYEE' })

  function addInvite() {
    const email = inviteForm.email.trim().toLowerCase()
    if (!email) return
    setInvites(list => [...list.filter(i => i.email !== email), { email, role: inviteForm.role }])
    setInviteForm({ email: '', role: 'EMPLOYEE' })
  }
  function removeInvite(email) {
    setInvites(list => list.filter(i => i.email !== email))
  }

  async function finish() {
    // Real memberships banao — company banne ke baad token ADMIN + companyId rakhta hai.
    // allSettled: koi ek invite fail ho (jaise duplicate) to baaki na rukein.
    await Promise.allSettled(
      invites.map(i => api.post('/team', { email: i.email, role: i.role }))
    )
    localStorage.setItem('wt_onboarded', 'true')          // dobara onboarding na dikhe
    navigate('/dashboard')
  }

  // ── Navigation ─────────────────────────────────────────────
  function next() {
    if (step === 0) setStep(1)
    else if (step === 1) saveCompany.mutate(companyForm)  // advances in onSuccess
    else finish()
  }
  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  const canContinue =
    step === 1 ? (companyForm.name.trim() && !saveCompany.isPending) : true

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Progress header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>WorkTrack Setup</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i <= step ? '#4f46e5' : '#e2e8f0', transition: 'background 0.25s',
              }} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '32px 28px', minHeight: 260 }}>
          {step === 0 && <WelcomeStep />}
          {step === 1 && <CompanyStep form={companyForm} setForm={setCompanyForm} error={saveCompany.isError} />}
          {step === 2 && (
            <InviteStep
              invites={invites}
              form={inviteForm}
              setForm={setInviteForm}
              onAdd={addInvite}
              onRemove={removeInvite}
            />
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={back} disabled={step === 0} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: step === 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500,
            color: step === 0 ? '#cbd5e1' : '#64748b',
          }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isLast && (
              <button onClick={finish} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8' }}>
                Skip for now
              </button>
            )}
            <button onClick={next} disabled={!canContinue} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: canContinue ? '#4f46e5' : '#c7d2fe', color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: canContinue ? 'pointer' : 'default',
            }}>
              {saveCompany.isPending ? 'Saving…' : isLast ? <>Finish <Check size={15} /></> : <>Continue <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeStep() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <Rocket size={26} color="#4f46e5" />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>Welcome to WorkTrack</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginTop: 10, lineHeight: 1.6, maxWidth: 400, margin: '10px auto 0' }}>
        Let's set up your workspace in a couple of quick steps. You can add your company details and invite your team — it only takes a minute.
      </p>
    </div>
  )
}

function CompanyStep({ form, setForm, error }) {
  return (
    <div>
      <StepHead icon={Building2} title="Company details" subtitle="This is how your workspace appears to your team." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <Field label="Company Name" required>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. WorkTrack Inc." style={inputStyle} />
        </Field>
        <Field label="Domain">
          <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="e.g. worktrack.com" style={inputStyle} />
        </Field>
        <Field label="Logo URL">
          <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://…/logo.png" style={inputStyle} />
        </Field>
        {error && <span style={{ fontSize: 12, color: '#dc2626' }}>Save failed — company name must be unique.</span>}
      </div>
    </div>
  )
}

function InviteStep({ invites, form, setForm, onAdd, onRemove }) {
  return (
    <div>
      <StepHead icon={Users} title="Invite your team" subtitle="Add people and pick a role. You can also do this later from Members." />

      {/* Add row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <input
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
          placeholder="teammate@company.com"
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, width: 130 }}>
          <option value="EMPLOYEE">Member</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button onClick={onAdd} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: '#eef2ff', color: '#4f46e5',
          border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Invited list */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invites.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>
            <Mail size={14} /> No invites added yet — that's okay, you can skip this.
          </div>
        ) : invites.map(inv => {
          const rs = ROLE_STYLE[inv.role] || ROLE_STYLE.EMPLOYEE
          return (
            <div key={inv.email} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: 13, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: rs.color, background: rs.bg, padding: '2px 9px', borderRadius: 999 }}>{rs.label}</span>
                <button onClick={() => onRemove(inv.email)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepHead({ icon: Icon, title, subtitle }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={18} color="#4f46e5" />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{subtitle}</p>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', boxSizing: 'border-box',
}
