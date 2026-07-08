import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
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
import SettingsPage from './pages/SettingsPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
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
            <Route path="/access-denied"    element={<AccessDeniedPage />} />

            {/* Admin + Manager only */}
            <Route element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route path="/members"     element={<MembersPage />} />
              <Route path="/engagement"  element={<EngagementPage />} />
              <Route path="/analytics"   element={<AnalyticsPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>

          </Route>
        </Route>

        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
