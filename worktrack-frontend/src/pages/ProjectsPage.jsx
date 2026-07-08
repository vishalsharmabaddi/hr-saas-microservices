import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Calendar, Users, Search } from 'lucide-react'
import api from '../api/axios'
import NewProjectModal from '../components/NewProjectModal'

function projectCode(name, id) {
  const letters = (name || '').replace(/[aeiou\s]/gi, '').toUpperCase().slice(0, 3) || name.slice(0, 2).toUpperCase()
  return `${letters}-${id}`
}

const statusColors = {
  PLANNING:    { bg: '#f1f5f9', color: '#475569' },
  IN_PROGRESS: { bg: '#eff6ff', color: '#2563eb' },
  ON_HOLD:     { bg: '#fffbeb', color: '#d97706' },
  COMPLETED:   { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:   { bg: '#fef2f2', color: '#dc2626' },
}

function ProjectCard({ project, onClick }) {
  const status = statusColors[project.status] || statusColors.PLANNING
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '18px 20px', cursor: 'pointer',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px', marginBottom: 3 }}>
            {projectCode(project.name, project.id)}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{project.name}</h3>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
          background: status.bg, color: status.color,
        }}>{project.status?.replace('_', ' ')}</span>
      </div>

      {project.description && (
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{project.description}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#94a3b8' }}>
        {project.startDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> {project.startDate}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} /> {project.projectType || 'PROJECT'}
        </span>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => Array.isArray(r.data) ? r.data : []),
  })

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    projectCode(p.name, p.id).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Modal */}
      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.3px' }}>Projects</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {isLoading ? 'Loading…' : `${filtered.length} of ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#4f46e5', color: '#fff',
          border: 'none', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Search bar */}
      {projects.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: 13, color: '#0f172a', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Projects grid or empty state */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, height: 120 }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
        </div>
      ) : search ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>No projects match "{search}"</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Try a different name or project code</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <FolderKanban size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>No projects yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, marginBottom: 20 }}>
              Create your first project to get started
            </p>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}>
              <Plus size={14} />
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
