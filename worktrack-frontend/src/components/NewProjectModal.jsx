import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../api/axios'

const initialForm = {
  name: '',
  description: '',
  type: 'CLIENT',
  billingType: 'BILLABLE',
  startDate: '',
  endDate: '',
}

export default function NewProjectModal({ onClose }) {
  const [form, setForm] = useState(initialForm)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => api.post('/projects', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    mutation.mutate({
      ...form,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
  }

  return (
    /* Overlay */
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }}>
      {/* Modal card — stop click propagation so overlay click doesn't close when clicking inside */}
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>New Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Website Redesign"
              required style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="What is this project about?"
              rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Type + Billing — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Project Type</label>
              <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                <option value="CLIENT">Client</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Billing Type</label>
              <select name="billingType" value={form.billingType} onChange={handleChange} style={inputStyle}>
                <option value="BILLABLE">Billable</option>
                <option value="NON_BILLABLE">Non Billable</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
          </div>

          {/* Dates — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <p style={{ fontSize: 14, color: '#dc2626', margin: 0 }}>
              Something went wrong. Try again.
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#fff', fontSize: 14, color: '#475569', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: mutation.isPending ? '#86EFAC' : '#16A34A',
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              {mutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: '#475569', marginBottom: 6,
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
}
