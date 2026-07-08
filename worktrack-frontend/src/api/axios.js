import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'X-Company-Id': '1',
    'Content-Type': 'application/json',
  },
})

export default api
