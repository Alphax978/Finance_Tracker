import axios from 'axios'
import { getAuthToken } from './authToken'

// Every request needs a real Clerk session token attached — the backend
// verifies it matches the userId being accessed on every route, so without
// this header every request would just get rejected as unauthorized.
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
})

api.interceptors.request.use(async (config) => {
    const token = await getAuthToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api
