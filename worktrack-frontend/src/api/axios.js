import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'X-Company-Id': '1',   // fallback (login se pehle / dev email login)
    'Content-Type': 'application/json',
  },
})

// Har request pe logged-in user ka companyId bhejo (login se aaya, DB-backed).
// NOTE: ye abhi bhi "client header" hai — asli security M4 me aayegi jab backend
// companyId verified token se lega aur ye header ignore karega.
api.interceptors.request.use(config => {
  try {
    const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
    if (user.companyId) config.headers['X-Company-Id'] = String(user.companyId)
    // M3: humara backend JWT (wristband). M4 me backend isi se companyId lega.
    const token = localStorage.getItem('wt_token')
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  } catch { /* ignore */ }
  return config
})

export default api
