import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import api from '../api/axios'

const ROLES = ['PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT']

const roleLabel = {
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER:     'Team Member',
  CLIENT:          'Client',
}

const roleStyle = {
  PROJECT_MANAGER: { background: '#eef2ff', color: '#4f46e5' },
  TEAM_MEMBER:     { background: '#f0fdf4', color: '#16a34a' },
  CLIENT:          { background: '#fff7ed', color: '#c2410c' },
}

export default function MembersPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ employeeId: '', role: 'TEAM_MEMBER' })
  const queryClient = useQueryClient()

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const activeProjectId = selectedProjectId ?? projects[0]?.id ?? null

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/members`).then(r => r.data),
    enabled: !!activeProjectId,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${activeProjectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeProjectId] })
      setShowAdd(false)
      setForm({ employeeId: '', role: 'DEVELOPER' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${activeProjectId}/members/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', activeProjectId] }),
  })

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>Members</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Project team management</p>
        </div>
        {activeProjectId && (
          <button
            onClick={() => setShowAdd(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Plus size={14} />
            Add Member
          </button>
        )}
      </div>

      {/* Project selector */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 6 }}>
            Select Project
          </label>
          <select
            value={activeProjectId ?? ''}
            onChange={e => setSelectedProjectId(Number(e.target.value))}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer',
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add Member inline form */}
      {showAdd && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              EMPLOYEE ID
            </label>
            <input
              type="number"
              placeholder="e.g. 101"
              value={form.employeeId}
              onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13,
              }}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              ROLE
            </label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13, background: '#fff',
              }}
            >
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button
            disabled={!form.employeeId || addMutation.isPending}
            onClick={() => addMutation.mutate({ employeeId: String(form.employeeId), role: form.role })}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              cursor: form.employeeId ? 'pointer' : 'not-allowed',
            }}
          >
            {addMutation.isPending ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={() => { setShowAdd(false); addMutation.reset() }}
            style={{
              background: '#fff', color: '#64748b', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          {addMutation.isError && (
            <p style={{ fontSize: 12, color: '#ef4444', width: '100%' }}>
              Failed to add. Employee {form.employeeId} may already be in this project.
            </p>
          )}
        </div>
      )}

      {/* Members table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 160px 48px',
          padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
        }}>
          {['ID', 'Employee', 'Role', ''].map(col => (
            <span key={col} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {col}
            </span>
          ))}
        </div>

        {!activeProjectId ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No projects found. Create a project first from the Projects page.
          </div>
        ) : isLoading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Users size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>No members in this project</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, marginBottom: 20 }}>
              Add team members to collaborate
            </p>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Add First Member
            </button>
          </div>
        ) : (
          members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 160px 48px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < members.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                #{m.employeeId}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                  Employee {m.employeeId}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </div>
              </div>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.3px',
                ...(roleStyle[m.role] || { background: '#f1f5f9', color: '#64748b' }),
              }}>
                {roleLabel[m.role] || m.role}
              </span>
              <button
                onClick={() => removeMutation.mutate(m.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4 }}
                title="Remove from project"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
