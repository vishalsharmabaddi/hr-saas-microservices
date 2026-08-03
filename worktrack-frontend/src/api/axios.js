import axios from 'axios'

// Local dev: khaali chhodo, Vite proxy '/api' ko localhost:8085 pe forward karta hai.
// Production build: VITE_API_BASE_URL set karo (Render project-service URL).
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api`,
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

// Token expire/invalid (backend 401) → session clear karke login pe bhej do.
// Warna page silently toot jaata hai. Login call ko chhoro (wo khud 401 de sakti hai).
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const isAuthCall = (error.config?.url || '').includes('/auth/')
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem('wt_token')
      localStorage.removeItem('wt_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
