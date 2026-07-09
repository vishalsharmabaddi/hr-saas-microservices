import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

// localStorage flag — batata hai ki is user ne tour dekh liya hai
const TOUR_FLAG = 'wt_tourDone'

// Poora tour — har sidebar feature + header. Text ENGLISH only (professional product).
// Note: nav role-based hai, isliye jo element DOM me maujood nahi uska step skip ho jayega.
const ALL_STEPS = [
  { element: '#tour-brand',      popover: { title: 'Welcome to WorkTrack', description: 'This is your company workspace. Take a quick tour to see what you can do here.' } },
  { element: '#tour-dashboard',  popover: { title: 'Dashboard', description: 'Your daily overview — projects, tasks, attendance and pending leaves at a glance.' } },
  { element: '#tour-projects',   popover: { title: 'Projects', description: 'Create projects, organise them into task lists, and track progress.' } },
  { element: '#tour-timelogs',   popover: { title: 'Time Logs', description: 'Log the hours you spend on tasks. This doubles as your daily EOD report.' } },
  { element: '#tour-attendance', popover: { title: 'Attendance', description: 'Check in and out, and review your attendance records.' } },
  { element: '#tour-leaves',     popover: { title: 'Leaves', description: 'Apply for leave and track approval status in one place.' } },
  { element: '#tour-employees',  popover: { title: 'Employees', description: 'Manage your team members and their profile details.' } },
  { element: '#tour-members',    popover: { title: 'Members', description: 'Assign project roles and control who can access the app.' } },
  { element: '#tour-engagement', popover: { title: 'Engagement', description: 'Track team engagement, streaks, and send appreciation nudges.' } },
  { element: '#tour-analytics',  popover: { title: 'Analytics', description: 'Visual insights — attendance trends, leave patterns and the XP leaderboard.' } },
  { element: '#tour-bell',       popover: { title: 'Notifications', description: 'Leave approvals and important updates show up here.' } },
  { element: '#tour-plan',       popover: { title: 'Your Plan', description: 'You are on the Free plan. Upgrade anytime for more features.' } },
  { element: '#tour-user',       popover: { title: 'Your Profile', description: 'Open Settings, view your progress, restart this tour, or log out from here.' } },
]

// Sirf un steps ko rakho jinke element abhi screen par hain (role ke hisaab se)
function buildSteps() {
  return ALL_STEPS.filter(step => document.querySelector(step.element))
}

function makeTour() {
  return driver({
    showProgress: true,
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    // Tour band hote hi (Done ya X) flag set — dobara auto-start nahi hoga
    onDestroyed: () => localStorage.setItem(TOUR_FLAG, 'true'),
    steps: buildSteps(),
  })
}

// Manually start (floating button / user menu se)
export function startTour() {
  makeTour().drive()
}

// Naye user ke liye auto-start — sirf pehli baar (flag na ho tab)
export function maybeStartTourForNewUser() {
  if (localStorage.getItem(TOUR_FLAG)) return
  // DOM render hone ka thoda time do, phir start
  setTimeout(() => startTour(), 700)
}

// "Restart tour" ke liye — flag hata ke dobara chalu
export function restartTour() {
  localStorage.removeItem(TOUR_FLAG)
  startTour()
}
