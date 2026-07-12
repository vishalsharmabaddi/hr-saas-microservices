import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from './api/axios'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TimeLogsPage from './pages/TimeLogsPage'
import MembersPage from './pages/MembersPage'
import EmployeesPage from './pages/EmployeesPage'
import AttendancePage from './pages/AttendancePage'
import LeavePage from './pages/LeavePage'
import NotificationsPage from './pages/NotificationsPage'
import ProgressPage from './pages/ProgressPage'
import EngagementPage from './pages/EngagementPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportsPage from './pages/ReportsPage'
import PayrollPage from './pages/PayrollPage'
import MyPayslipsPage from './pages/MyPayslipsPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import SelectCompanyPage from './pages/SelectCompanyPage'
import PlatformAdminPage from './pages/PlatformAdminPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import { isPlatformOwner } from './auth/roles'
import LandingPage from './pages/LandingPage'
import Layout from './components/Layout'

// Redirect to /login if not logged in
function PrivateRoute() {
  const user = localStorage.getItem('wt_user')
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Redirect to /access-denied if role not allowed
function RoleRoute({ allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/access-denied" replace />
}

// Naya admin jisne abhi tak company set nahi ki → onboarding pe bhejo
function OnboardingGate() {
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const onboarded = localStorage.getItem('wt_onboarded') === 'true'
  const needsCheck = user.role === 'ADMIN' && !onboarded

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: needsCheck,                 // sirf tab fetch jab check zaroori ho
  })

  if (needsCheck) {
    if (isLoading) return null           // company data aane tak wait (flash na ho)
    if (companies.length === 0) return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

// Sirf Platform Owner (app creator) andar aa sakta hai — baaki sab dashboard pe wapas
function PlatformGate() {
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  return isPlatformOwner(user.email) ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Invite accept — public (login se pehle bhi khule) */}
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        <Route element={<PrivateRoute />}>
          {/* Onboarding — full page, no sidebar */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          {/* Multi-company chooser — full page, no sidebar */}
          <Route path="/select-company" element={<SelectCompanyPage />} />

          {/* Platform Console — sirf owner, apna alag full-page layout */}
          <Route element={<PlatformGate />}>
            <Route path="/platform" element={<PlatformAdminPage />} />
          </Route>

          {/* Gate: naya admin → onboarding, warna app */}
          <Route element={<OnboardingGate />}>
          <Route element={<Layout />}>

            {/* All roles */}
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/projects"         element={<ProjectsPage />} />
            <Route path="/projects/:id"     element={<ProjectDetailPage />} />
            <Route path="/timelogs"         element={<TimeLogsPage />} />
            <Route path="/attendance"       element={<AttendancePage />} />
            <Route path="/leaves"           element={<LeavePage />} />
            <Route path="/notifications"    element={<NotificationsPage />} />
            <Route path="/progress"         element={<ProgressPage />} />
            <Route path="/my-payslips"      element={<MyPayslipsPage />} />
            <Route path="/access-denied"    element={<AccessDeniedPage />} />

            {/* Admin + Manager only */}
            <Route element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route path="/members"     element={<MembersPage />} />
              <Route path="/engagement"  element={<EngagementPage />} />
              <Route path="/analytics"   element={<AnalyticsPage />} />
              <Route path="/reports"     element={<ReportsPage />} />
              <Route path="/payroll"     element={<PayrollPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>

          </Route>
          </Route>
        </Route>

        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
