// Hardcoded super-admin (always admin, cannot be removed)
const SUPER_ADMINS = ['vishalsharmabaddi@gmail.com']

// Platform Owner = app ka creator (tum). Company Admin se ALAG — ye SAARI companies dekhta hai.
export function isPlatformOwner(email) {
  return SUPER_ADMINS.includes(email?.toLowerCase())
}

// RBAC UI helpers — backend RoleGuard ke saath match karte hain
export function canManage(role) { return role === 'ADMIN' || role === 'MANAGER' }  // deletes, leave approve
export function canAdmin(role)  { return role === 'ADMIN' }                          // employee CRUD, team manage

export function getRoleForEmail(email) {
  const normalized = email?.toLowerCase()
  if (SUPER_ADMINS.includes(normalized)) return 'ADMIN'

  // Check admin-assigned roles from Members → App Access
  const members = JSON.parse(localStorage.getItem('wt_members') || '[]')
  const found = members.find(m => m.email?.toLowerCase() === normalized)
  if (found) return found.role

  return 'EMPLOYEE'
}

export function getAppMembers() {
  return JSON.parse(localStorage.getItem('wt_members') || '[]')
}

export function addAppMember(email, role, name = '') {
  const members = getAppMembers()
  const exists = members.find(m => m.email?.toLowerCase() === email.toLowerCase())
  if (exists) {
    exists.role = role
  } else {
    members.push({ email: email.toLowerCase(), role, name, addedAt: new Date().toISOString() })
  }
  localStorage.setItem('wt_members', JSON.stringify(members))
}

export function removeAppMember(email) {
  const members = getAppMembers().filter(m => m.email?.toLowerCase() !== email.toLowerCase())
  localStorage.setItem('wt_members', JSON.stringify(members))
}

// Kaunse nav items kaunse role ko dikhenge
export const ROLE_NAV = {
  ADMIN:    ['/dashboard', '/projects', '/my-tasks', '/timelogs', '/attendance', '/leaves', '/employees', '/members', '/engagement', '/analytics', '/reports'],
  MANAGER:  ['/dashboard', '/projects', '/my-tasks', '/timelogs', '/attendance', '/leaves', '/members', '/engagement', '/analytics', '/reports'],
  EMPLOYEE: ['/dashboard', '/projects', '/my-tasks', '/timelogs', '/attendance', '/leaves'],
}

// Role badge color
export const ROLE_STYLE = {
  ADMIN:    { label: 'Admin',    bg: '#EAF7EE', color: '#16A34A' },
  MANAGER:  { label: 'Manager',  bg: '#f0fdf4', color: '#16a34a' },
  EMPLOYEE: { label: 'Member', bg: '#f8fafc', color: '#64748b' },
}
