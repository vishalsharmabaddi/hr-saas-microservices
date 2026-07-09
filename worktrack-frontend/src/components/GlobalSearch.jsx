import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X, FolderKanban, UserSquare2 } from 'lucide-react'
import api from '../api/axios'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)     // keyboard-highlighted row
  const inputRef = useRef(null)

  // Ctrl/Cmd + K → toggle,  ESC → close
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Query badalte hi highlight top pe reset
  useEffect(() => { setActiveIndex(0) }, [query])

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: open,
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: open,
  })

  const q = query.trim().toLowerCase()
  const projectHits = q ? projects.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 5) : []
  const peopleHits = q
    ? employees.filter(e =>
        `${e.firstName || ''} ${e.lastName || ''} ${e.fullName || ''} ${e.email || ''} ${e.department || ''}`
          .toLowerCase().includes(q)
      ).slice(0, 5)
    : []

  // Ek flat list — dono groups ko ek order me rakho (keyboard traversal ke liye)
  let gi = 0
  const projectItems = projectHits.map(p => ({
    gi: gi++, key: `p-${p.id}`, icon: FolderKanban,
    title: p.name, subtitle: p.status, path: `/projects/${p.id}`,
  }))
  const peopleItems = peopleHits.map(e => ({
    gi: gi++, key: `e-${e.id}`, icon: UserSquare2,
    title: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.fullName || e.email,
    subtitle: e.department || e.designation || e.email, path: '/employees',
  }))
  const flat = [...projectItems, ...peopleItems]
  const hasResults = flat.length > 0

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  // Arrow keys + Enter (input pe)
  function onInputKey(e) {
    if (!hasResults) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flat[Math.min(activeIndex, flat.length - 1)]
      if (item) go(item.path)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '8px 12px', cursor: 'pointer', color: '#94a3b8',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#c7d2fe'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
      >
        <Search size={15} color="#64748b" />
        <span style={{ fontSize: 13, flex: 1, textAlign: 'left' }}>Search projects, people…</span>
        <kbd style={{
          fontSize: 10, fontWeight: 600, color: '#64748b', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px',
        }}>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '12vh', zIndex: 200,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <Search size={17} color="#94a3b8" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search projects, people…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0f172a', background: 'transparent' }}
              />
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
              {!q ? (
                <Empty text="Type to search across your workspace." />
              ) : !hasResults ? (
                <Empty text={`No results for “${query}”.`} />
              ) : (
                <>
                  {projectItems.length > 0 && (
                    <Group title="Projects">
                      {projectItems.map(it => (
                        <ResultRow key={it.key} {...it} active={it.gi === activeIndex}
                          onClick={() => go(it.path)} onHover={() => setActiveIndex(it.gi)} />
                      ))}
                    </Group>
                  )}
                  {peopleItems.length > 0 && (
                    <Group title="People">
                      {peopleItems.map(it => (
                        <ResultRow key={it.key} {...it} active={it.gi === activeIndex}
                          onClick={() => go(it.path)} onHover={() => setActiveIndex(it.gi)} />
                      ))}
                    </Group>
                  )}
                </>
              )}
            </div>

            <div style={{ padding: '9px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8' }}>
              <span><kbd style={kbdStyle}>↑</kbd> <kbd style={kbdStyle}>↓</kbd> to navigate</span>
              <span><kbd style={kbdStyle}>↵</kbd> to open</span>
              <span><kbd style={kbdStyle}>esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '6px 10px 4px' }}>{title}</div>
      {children}
    </div>
  )
}

function ResultRow({ icon: Icon, title, subtitle, active, onClick, onHover }) {
  return (
    <button
      onClick={onClick}
      onMouseMove={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: active ? '#eef2ff' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '8px 10px', borderRadius: 8,
      }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? '#e0e7ff' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color="#4f46e5" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
      </div>
    </button>
  )
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '32px 16px' }}>{text}</div>
}

const kbdStyle = {
  fontSize: 10, fontWeight: 600, color: '#64748b', background: '#f8fafc',
  border: '1px solid #e2e8f0', borderRadius: 3, padding: '0 4px',
}
