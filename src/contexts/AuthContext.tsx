import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
}

interface AuthContextValue extends AuthState {
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getInitialState(): AuthState {
  const token = localStorage.getItem('accessToken')
  const userStr = localStorage.getItem('user')
  if (!token || !userStr) return { user: null, accessToken: null }
  try {
    return { user: JSON.parse(userStr) as User, accessToken: token }
  } catch {
    return { user: null, accessToken: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialState)

  const login = useCallback((user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    setState({ user, accessToken })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setState({ user: null, accessToken: null })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
