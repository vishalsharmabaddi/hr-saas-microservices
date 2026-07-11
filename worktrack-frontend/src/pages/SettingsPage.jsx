import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Save, Check, Layers, Users, ArrowRight } from 'lucide-react'
import { ROLE_STYLE } from '../auth/roles'
import api from '../api/axios'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  // Saari companies fetch karo — pehli ko "current company" maano
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => Array.isArray(r.data) ? r.data : []),
  })
  const company = companies[0] || null   // exist karti hai ya nahi

  // Saare employees fetch karo — inse departments derive karenge
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // department-wise ginti: reduce se count → Object.entries se list → sort by count
  const departments = Object.entries(
    employees.reduce((acc, e) => {
      const dept = e.department?.trim() || 'Unassigned'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // App-level members (login roles) — real /api/team se, current user (owner) sabse upar
  const currentUser = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => Array.isArray(r.data) ? r.data : []),
  })
  // owner apni alag row me dikhta hai — list se self hata do (duplicate na ho)
  const otherMembers = teamMembers.filter(m => m.email?.toLowerCase() !== currentUser.email?.toLowerCase())

  const [form, setForm] = useState({ name: '', domain: '', logoUrl: '' })
  const [saved, setSaved] = useState(false)

  // Jab company data aaye, form ko usse bhar do
  useEffect(() => {
    if (company) setForm({ name: company.name || '', domain: company.domain || '', logoUrl: company.logoUrl || '' })
  }, [company])

  // Upsert: company hai → PUT, nahi hai → POST
  const saveMutation = useMutation({
    mutationFn: (data) =>
      company
        ? api.put(`/companies/${company.id}`, { ...company, ...data })
        : api.post('/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const canSave = form.name.trim() && !saveMutation.isPending

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Manage your company workspace, departments, and team roles.</p>
      </div>

      {/* Company Settings */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Building2 size={15} color="#374151" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Company</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
          {company ? 'Edit your company workspace details.' : 'Set up your company workspace to get started.'}
        </p>

        {isLoading ? (
          <div style={{ color: '#94a3b8', fontSize: 13, padding: '10px 0' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Company Name" required>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. WorkTrack Inc."
                style={inputStyle}
              />
            </Field>

            <Field label="Domain">
              <input
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                placeholder="e.g. worktrack.com"
                style={inputStyle}
              />
            </Field>

            <Field label="Logo URL">
              <input
                value={form.logoUrl}
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://…/logo.png"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!canSave}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: canSave ? '#4f46e5' : '#c7d2fe', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '9px 16px',
                  fontSize: 13, fontWeight: 500, cursor: canSave ? 'pointer' : 'default',
                }}
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? 'Saved!' : company ? 'Save Changes' : 'Create Company'}
              </button>
              {saveMutation.isError && (
                <span style={{ fontSize: 12, color: '#dc2626' }}>Save failed — name must be unique.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Departments Overview (Chunk F2) */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Layers size={15} color="#374151" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Departments</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
          {departments.length} department{departments.length !== 1 ? 's' : ''} • {employees.length} employee{employees.length !== 1 ? 's' : ''} total
        </p>

        {departments.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13, padding: '10px 0' }}>
            No employees yet — add employees to see departments here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.map(d => (
              <div key={d.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{d.name}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#4f46e5', background: '#eef2ff',
                  padding: '2px 10px', borderRadius: 999,
                }}>
                  {d.count} {d.count === 1 ? 'member' : 'members'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team & Roles (Chunk F3) */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="#374151" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Team & Roles</span>
          </div>
          <Link to="/members" style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
            color: '#4f46e5', textDecoration: 'none',
          }}>
            Manage <ArrowRight size={13} />
          </Link>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
          Who can log in and what they can access.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Owner (current user) — hamesha sabse upar */}
          <MemberRow
            name={currentUser.name || 'You'}
            email={currentUser.email}
            role={currentUser.role || 'ADMIN'}
            isOwner
          />

          {/* Admin-assigned members */}
          {otherMembers.map(m => (
            <MemberRow key={m.id} name={m.name || m.email?.split('@')[0]} email={m.email} role={m.role} />
          ))}
        </div>

        {otherMembers.length === 0 && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            No additional members yet. Use <Link to="/members" style={{ color: '#4f46e5' }}>Members → App Access</Link> to invite people and assign roles.
          </p>
        )}
      </div>
    </div>
  )
}

function MemberRow({ name, email, role, isOwner }) {
  const rs = ROLE_STYLE[role] || ROLE_STYLE.EMPLOYEE
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
          {name}
          {isOwner && <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>OWNER</span>}
        </div>
        {email && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>}
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600, color: rs.color, background: rs.bg,
        padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
      }}>
        {rs.label}
      </span>
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
