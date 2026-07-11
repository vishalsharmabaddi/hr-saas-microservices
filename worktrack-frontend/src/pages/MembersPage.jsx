import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Users, Plus, Trash2, Shield, Mail, Link2, Copy, Check } from 'lucide-react'
import api from '../api/axios'
import { canManage } from '../auth/roles'

const PROJECT_ROLES = ['PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT']
const APP_ROLES     = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const projRoleLabel = { PROJECT_MANAGER: 'Project Manager', TEAM_MEMBER: 'Team Member', CLIENT: 'Client' }
const projRoleStyle = {
  PROJECT_MANAGER: { background: '#EAF7EE', color: '#16A34A' },
  TEAM_MEMBER:     { background: '#f0fdf4', color: '#16a34a' },
  CLIENT:          { background: '#fff7ed', color: '#c2410c' },
}

const appRoleStyle = {
  ADMIN:    { background: '#EAF7EE', color: '#16A34A', label: 'Admin' },
  MANAGER:  { background: '#f0fdf4', color: '#16a34a', label: 'Manager' },
  EMPLOYEE: { background: '#f8fafc', color: '#64748b', label: 'Employee' },
}

export default function MembersPage() {
  const currentUser = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const isAdmin = currentUser.role === 'ADMIN'
  const canManageMembers = canManage(currentUser.role)   // ADMIN|MANAGER — remove allowed

  const [activeTab, setActiveTab]         = useState('project')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [projectForm, setProjectForm]     = useState({ employeeId: '', role: 'TEAM_MEMBER' })
  const [appForm, setAppForm]             = useState({ email: '', name: '', role: 'EMPLOYEE' })
  const [appError, setAppError]           = useState('')
  const [inviteLink, setInviteLink]       = useState('')
  const [copied, setCopied]               = useState(false)
  const queryClient = useQueryClient()

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => Array.isArray(r.data) ? r.data : []),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })

  const empMap = Object.fromEntries(employees.map(e => [e.id, e]))
  const activeProjectId = selectedProjectId ?? projects[0]?.id ?? null

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/members`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!activeProjectId,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${activeProjectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeProjectId] })
      setShowAddProject(false)
      setProjectForm({ employeeId: '', role: 'TEAM_MEMBER' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${activeProjectId}/members/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', activeProjectId] }),
  })

  // ── App Access = real company memberships (/api/team) ──
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: isAdmin && activeTab === 'access',
  })

  // Pending invites (jinhone abhi accept nahi kiya)
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['pendingInvites'],
    queryFn: () => api.get('/team/invites').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: isAdmin && activeTab === 'access',
  })

  const inviteMutation = useMutation({
    mutationFn: (data) => api.post('/team', data).then(r => r.data),
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: ['pendingInvites'] })
      // Copy-link: backend token deta hai, usse accept-link banao
      setInviteLink(`${window.location.origin}/accept-invite?token=${invite.token}`)
      setCopied(false)
      setAppForm({ email: '', name: '', role: 'EMPLOYEE' })
      setAppError('')
    },
    onError: (err) => setAppError(err.response?.data?.message || 'Failed to create invite'),
  })

  const revokePendingMutation = useMutation({
    mutationFn: (id) => api.delete(`/team/invites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingInvites'] }),
  })

  function copyLink(link) {
    navigator.clipboard?.writeText(link)
    setInviteLink(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/team/${id}`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  })

  const removeTeamMutation = useMutation({
    mutationFn: (id) => api.delete(`/team/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  })

  function handleAddAppMember() {
    if (!appForm.email) { setAppError('Email required'); return }
    if (!appForm.email.includes('@')) { setAppError('Valid email required'); return }
    inviteMutation.mutate({ email: appForm.email, name: appForm.name, role: appForm.role })
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Members</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            {activeTab === 'project' ? 'Project team management' : 'App access and role assignment'}
          </p>
        </div>
        {activeTab === 'project' && activeProjectId && (
          <button onClick={() => setShowAddProject(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#16A34A', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            <Plus size={14} /> Add Member
          </button>
        )}
      </div>

      {/* Tabs — App Access only for ADMIN */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setActiveTab('project')} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none', fontSize: 14, cursor: 'pointer',
          fontWeight: activeTab === 'project' ? 600 : 400,
          background: activeTab === 'project' ? '#fff' : 'transparent',
          color: activeTab === 'project' ? '#0f172a' : '#64748b',
          boxShadow: activeTab === 'project' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}>
          Project Members
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('access')} style={{
            padding: '6px 16px', borderRadius: 7, border: 'none', fontSize: 14, cursor: 'pointer',
            fontWeight: activeTab === 'access' ? 600 : 400,
            background: activeTab === 'access' ? '#fff' : 'transparent',
            color: activeTab === 'access' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'access' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Shield size={13} /> App Access
          </button>
        )}
      </div>

      {/* ── PROJECT MEMBERS TAB ── */}
      {activeTab === 'project' && (
        <>
          {projects.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>Select Project</label>
              <select value={activeProjectId ?? ''} onChange={e => setSelectedProjectId(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a', background: '#fff', cursor: 'pointer' }}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {showAddProject && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>EMPLOYEE</label>
                <select value={projectForm.employeeId} onChange={e => setProjectForm(f => ({ ...f, employeeId: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
                  <option value="">-- Select employee --</option>
                  {employees.filter(e => e.isActive).map(e => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.designation || e.department || 'No role'})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>ROLE</label>
                <select value={projectForm.role} onChange={e => setProjectForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
                  {PROJECT_ROLES.map(r => <option key={r} value={r}>{projRoleLabel[r]}</option>)}
                </select>
              </div>
              <button disabled={!projectForm.employeeId || addMutation.isPending}
                onClick={() => addMutation.mutate({ employeeId: String(projectForm.employeeId), role: projectForm.role })}
                style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: projectForm.employeeId ? 'pointer' : 'not-allowed' }}>
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => { setShowAddProject(false); addMutation.reset() }}
                style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              {addMutation.isError && <p style={{ fontSize: 13, color: '#ef4444', width: '100%' }}>Failed to add. Employee may already be in this project.</p>}
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 48px', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['ID', 'Employee', 'Role', ''].map(col => (
                <span key={col} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</span>
              ))}
            </div>

            {!activeProjectId ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No projects found. Create a project first.</div>
            ) : isLoading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : members.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 16 }}><Users size={24} color="#94a3b8" strokeWidth={1.5} /></div>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#334155' }}>No members in this project</p>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, marginBottom: 20 }}>Add team members to collaborate</p>
                <button onClick={() => setShowAddProject(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  <Plus size={14} /> Add First Member
                </button>
              </div>
            ) : members.map((m, i) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 48px', padding: '14px 20px', alignItems: 'center', borderBottom: i < members.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>EMP-{String(m.employeeId).padStart(3, '0')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#EAF7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                    {empMap[m.employeeId]?.firstName?.[0]}{empMap[m.employeeId]?.lastName?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#1e293b' }}>{empMap[m.employeeId]?.fullName ?? `Employee #${m.employeeId}`}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{empMap[m.employeeId]?.designation ?? empMap[m.employeeId]?.department ?? ''}{' · '}Joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...(projRoleStyle[m.role] || { background: '#f1f5f9', color: '#64748b' }) }}>
                  {projRoleLabel[m.role] || m.role}
                </span>
                {canManageMembers && (
                <button onClick={() => removeMutation.mutate(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4 }} title="Remove">
                  <Trash2 size={14} />
                </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── APP ACCESS TAB ── */}
      {activeTab === 'access' && isAdmin && (
        <>
          {/* Add member form */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Invite Member</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>EMAIL</label>
                <input type="email" placeholder="rahul@company.com"
                  value={appForm.email} onChange={e => { setAppForm(f => ({ ...f, email: e.target.value })); setAppError('') }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>NAME (optional)</label>
                <input placeholder="Rahul Sharma"
                  value={appForm.name} onChange={e => setAppForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>ROLE</label>
                <select value={appForm.role} onChange={e => setAppForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
                  {APP_ROLES.map(r => <option key={r} value={r}>{appRoleStyle[r].label}</option>)}
                </select>
              </div>
              <button onClick={handleAddAppMember} disabled={inviteMutation.isPending} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {inviteMutation.isPending ? 'Creating…' : 'Create invite'}
              </button>
            </div>
            {appError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{appError}</p>}
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
              An invite link is created. Share it with them — they join after signing in with this exact email.
            </p>

            {/* Copy-link box — invite banne ke baad */}
            {inviteLink && (
              <div style={{ marginTop: 12, background: '#EAF7EE', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Link2 size={13} /> Invite link ready — share it with them
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input readOnly value={inviteLink} onFocus={e => e.target.select()}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #BBF7D0', fontSize: 13, background: '#fff', color: '#334155' }} />
                  <button onClick={() => copyLink(inviteLink)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pending invites — abhi tak accept nahi hue */}
          {pendingInvites.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb', fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                Pending Invites ({pendingInvites.length}) — waiting to be accepted
              </div>
              {pendingInvites.map((inv, i) => (
                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px 44px', padding: '12px 20px', alignItems: 'center', gap: 8, borderBottom: i < pendingInvites.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="#94a3b8" />
                    <span style={{ fontSize: 14, color: '#0f172a' }}>{inv.email}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{appRoleStyle[inv.role]?.label || inv.role}</span>
                  <button onClick={() => copyLink(`${window.location.origin}/accept-invite?token=${inv.token}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EAF7EE', color: '#16A34A', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', justifySelf: 'start' }}>
                    <Link2 size={13} /> Copy
                  </button>
                  <button onClick={() => revokePendingMutation.mutate(inv.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4, justifySelf: 'end' }} title="Cancel invite">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Active members list */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 48px', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              {['Email', 'Name', 'Role', ''].map(col => (
                <span key={col} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</span>
              ))}
            </div>

            {teamMembers.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No members yet. Add someone above to give them access.
              </div>
            ) : teamMembers.map((m, i) => {
              const rs = appRoleStyle[m.role] || appRoleStyle.EMPLOYEE
              const isSelf = m.email?.toLowerCase() === currentUser.email?.toLowerCase()
              return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 48px', padding: '14px 20px', alignItems: 'center', borderBottom: i < teamMembers.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="#94a3b8" />
                    <span style={{ fontSize: 14, color: '#0f172a' }}>{m.email}{isSelf && ' (You)'}</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#64748b' }}>{m.name || '—'}</span>
                  {isSelf ? (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: rs.background, color: rs.color, display: 'inline-block', width: 'fit-content' }}>{rs.label}</span>
                  ) : (
                    <select value={m.role} onChange={e => roleMutation.mutate({ id: m.id, role: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', color: rs.color, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
                      {APP_ROLES.map(r => <option key={r} value={r}>{appRoleStyle[r].label}</option>)}
                    </select>
                  )}
                  {isSelf ? (
                    <span style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center' }}>—</span>
                  ) : (
                    <button onClick={() => removeTeamMutation.mutate(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4 }} title="Remove access">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
