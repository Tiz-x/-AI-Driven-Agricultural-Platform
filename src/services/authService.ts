

import type { RegisterPayload, LoginPayload, AuthResponse } from '../types/auth'

const BASE_URL  = import.meta.env.VITE_API_URL ?? ''
const MOCK_MODE = !BASE_URL  // true when no backend URL is set

/* ── Mock responses (frontend dev only) ───────────────── */
function mockRegister(payload: RegisterPayload): AuthResponse {
  const role = 'role' in payload ? payload.role : 'farmer'
  return {
    token: 'mock-token-dev',
    user: {
      id:    'mock-001',
      name:  payload.fullName,
      email: payload.email,
      role,
    },
  }
}

function mockLogin(payload: LoginPayload): AuthResponse {
  // Detect role from email for easy testing:
  // farmer@test.com  → farmer dashboard
  // buyer@test.com   → buyer dashboard
  // seller@test.com  → seller dashboard
  // admin@test.com   → admin dashboard
  const email = payload.email.toLowerCase()
  const role =
    email.includes('buyer')  ? 'buyer'  :
    email.includes('seller') ? 'seller' :
    email.includes('admin')  ? 'admin'  :
    'farmer'

  const nameMap: Record<string, string> = {
    farmer: 'Adewale Okafor',
    buyer:  'Chioma Eze',
    seller: 'Musa Ibrahim',
    admin:  'Admin User',
  }

  return {
    token: 'mock-token-dev',
    user: {
      id:    'mock-001',
      name:  nameMap[role],
      email: payload.email,
      role,
    },
  }
}

/* ── Real API request ──────────────────────────────────── */
async function request<T>(endpoint: string, options: RequestInit): Promise<T> {
  const res  = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Something went wrong')
  return data as T
}

/* ── Auth Service ──────────────────────────────────────── */
export const authService = {

  /** POST /api/auth/register  (mocked in dev) */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (MOCK_MODE) {
      await delay(600) // simulate network
      return mockRegister(payload)
    }
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /** POST /api/auth/login  (mocked in dev) */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (MOCK_MODE) {
      await delay(600)
      // Simulate wrong password in mock
      if (payload.password.length < 6) {
        throw new Error('Invalid email or password.')
      }
      return mockLogin(payload)
    }
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /** Save token + user to localStorage */
  saveSession: (res: AuthResponse) => {
    localStorage.setItem('agf_token', res.token)
    localStorage.setItem('agf_user', JSON.stringify(res.user))
  },

  getToken:     () => localStorage.getItem('agf_token'),
  getUser:      () => {
    const raw = localStorage.getItem('agf_user')
    return raw ? JSON.parse(raw) : null
  },
  clearSession: () => {
    localStorage.removeItem('agf_token')
    localStorage.removeItem('agf_user')
  },

  isMockMode: () => MOCK_MODE,
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))