import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, X, Mail, Phone, Briefcase, Calendar } from 'lucide-react'
import api from '../api/axios'
import { canAdmin } from '../auth/roles'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']
const typeLabel = { FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', INTERN: 'Intern' }
const typeStyle = {
  FULL_TIME: { background: '#f0fdf4', color: '#16a34a' },
  PART_TIME: { background: '#EEF2F8', color: '#3155A4' },
  CONTRACT:  { background: '#fffbeb', color: '#d97706' },
  INTERN:    { background: '#faf5ff', color: '#7c3aed' },
}

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', employmentType: 'FULL_TIME', joiningDate: '' }

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const isAdmin = canAdmin(JSON.parse(localStorage.getItem('wt_user') || '{}').role)

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setEditingId(null)
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => api.patch(`/employees/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.department} ${e.designation}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const activeCount   = employees.filter(e => e.isActive).length
  const inactiveCount = employees.filter(e => !e.isActive).length

  function startEdit(emp) {
    setEditingId(emp.id)
    setForm({
      firstName: emp.firstName || '', lastName: emp.lastName || '',
      email: emp.email || '', phone: emp.phone || '',
      department: emp.department || '', designation: emp.designation || '',
      employmentType: emp.employmentType || 'FULL_TIME',
      joiningDate: emp.joiningDate || '',
    })
    setShowForm(true)
  }

  function handleSubmit() {
    const payload = { ...form, joiningDate: form.joiningDate || null }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isError   = createMutation.isError   || updateMutation.isError

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            {activeCount} Active {activeCount === 1 ? 'Employee' : 'Employees'}{inactiveCount > 0 ? ` · ${inactiveCount} Inactive` : ''}
          </p>
        </div>
        {isAdmin && (
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#16A34A', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 14px', fontSize: 14,
          fontWeight: 500, cursor: 'pointer', flexShrink: 0,
        }}>
          <Plus size={14} /> Add Employee
        </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 340 }}>
        <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          placeholder="Search by name, email, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px 8px 32px',
            borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'First Name *', key: 'firstName', placeholder: 'Rahul' },
                { label: 'Last Name *',  key: 'lastName',  placeholder: 'Sharma' },
                { label: 'Email *',      key: 'email',     placeholder: 'rahul@company.com' },
                { label: 'Phone',        key: 'phone',     placeholder: '+91 98765 43210' },
                { label: 'Department',   key: 'department',   placeholder: 'Engineering' },
                { label: 'Designation',  key: 'designation',  placeholder: 'Software Engineer' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={labelSt}>{label}</label>
                  <input
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputSt}
                  />
                </div>
              ))}
              <div>
                <label style={labelSt}>Employment Type</label>
                <select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} style={inputSt}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Joining Date</label>
                <input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} style={inputSt} />
              </div>
            </div>

            {isError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>Failed to save. Check all fields and try again.</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, cursor: 'pointer', background: '#fff', color: '#64748b' }}>
                Cancel
              </button>
              <button
                disabled={!form.firstName || !form.lastName || !form.email || isPending}
                onClick={handleSubmit}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', background: '#16A34A', color: '#fff',
                }}
              >
                {isPending ? 'Saving…' : editingId ? 'Update' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee list */}
      {isLoading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '60px 24px', textAlign: 'center' }}>
          <Users size={28} color="#cbd5e1" strokeWidth={1.2} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: '#334155' }}>
            {search ? 'No employees match your search' : 'No employees yet'}
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
            {!search && 'Click "Add Employee" to get started'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'auto' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 180px', minWidth: 720, gap: 0, padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            {['Employee', 'Contact', 'Department', 'Type', 'Actions'].map(col => (
              <span key={col} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</span>
            ))}
          </div>

          {filtered.map((emp, i) => {
            const ts = typeStyle[emp.employmentType] || typeStyle.FULL_TIME
            return (
              <div key={emp.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 180px', minWidth: 720,
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                opacity: emp.isActive ? 1 : 0.45,
              }}>
                {/* Name + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: emp.isActive ? '#EAF7EE' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: emp.isActive ? '#16A34A' : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{emp.fullName}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                      EMP-{String(emp.id).padStart(3, '0')}
                      {!emp.isActive && <span style={{ color: '#ef4444', marginLeft: 4 }}>· Inactive</span>}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  {emp.email && (
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={11} /> {emp.email}
                    </p>
                  )}
                  {emp.phone && (
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {emp.phone}
                    </p>
                  )}
                </div>

                {/* Department + Designation */}
                <div>
                  {emp.department && <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={11} /> {emp.department}</p>}
                  {emp.designation && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{emp.designation}</p>}
                </div>

                {/* Employment type */}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 6, ...ts }}>
                    {typeLabel[emp.employmentType] || emp.employmentType}
                  </span>
                  {emp.joiningDate && (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {emp.joiningDate}
                    </p>
                  )}
                </div>

                {/* Actions — sirf ADMIN */}
                {isAdmin && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={() => startEdit(emp)} style={{
                    fontSize: 13, padding: '5px 12px', borderRadius: 6,
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    Edit
                  </button>
                  {emp.isActive ? (
                    <button
                      onClick={() => { if (window.confirm(`Deactivate ${emp.fullName}?`)) deactivateMutation.mutate(emp.id) }}
                      style={{
                        fontSize: 13, padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #fecaca', background: '#fff',
                        color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateMutation.mutate(emp.id)}
                      style={{
                        fontSize: 13, padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #bbf7d0', background: '#f0fdf4',
                        color: '#16a34a', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Activate
                    </button>
                  )}
                </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelSt = { display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 5 }
const inputSt  = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
