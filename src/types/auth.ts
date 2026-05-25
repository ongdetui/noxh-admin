export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string | null
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  role: Role
  isVerified: boolean
  isActive: boolean
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginDto {
  email: string
  password: string
}
