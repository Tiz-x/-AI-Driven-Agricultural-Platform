/* ═══════════════════════════════════════════════════════
   types/auth.ts — Shared auth types
   Used by both Register and Login forms.
   Backend endpoints will consume these exact shapes.
   ═══════════════════════════════════════════════════════ */

export type UserRole = 'farmer' | 'buyer' | 'seller'

export interface RegisterFarmerPayload {
  fullName:    string
  email:       string
  phone:       string
  password:    string
  role:        'farmer'
  cropTypes:   string[]
  soilType:    string
  location:    string
  farmSize:    string
}

export interface RegisterBuyerSellerPayload {
  fullName:    string
  email:       string
  phone:       string
  password:    string
  role:        'buyer' | 'seller'
  intent:      'buy' | 'sell'
  cropTypes:   string[]
  location:    string
  quantity:    string
}

export type RegisterPayload = RegisterFarmerPayload | RegisterBuyerSellerPayload

export interface LoginPayload {
  email:    string
  password: string
}

export interface AuthResponse {
  token:   string
  user: {
    id:      string
    name:    string
    email:   string
    role:    UserRole
  }
}

/* ── API error shape from Node backend ── */
export interface ApiError {
  message: string
  field?:  string
}