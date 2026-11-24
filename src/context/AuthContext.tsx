import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError, AUTH_EXPIRED_EVENT, tokenStore } from '../lib/api'

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean // səhifə açılanda token yoxlanana qədər true
  login: (email: string, password: string) => Promise<void> // xəta olsa ApiError atır
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  // Səhifə yenilənəndə girişi bərpa et (yalnız admin keçir)
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    api<AdminUser>('/me')
      .then((me) => {
        if (cancelled) return
        if (me.role === 'ADMIN') setUser(me)
        else tokenStore.clear()
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) tokenStore.clear()
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Başqa sorğuda 401 gəlsə (token vaxtı bitib) istifadəçini çıxar
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: AdminUser; token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    // Adi istifadəçi bu panelə girə bilməz: token saxlamırıq
    if (res.user.role !== 'ADMIN') {
      throw new ApiError(403, 'NOT_ADMIN', 'Bu panel yalnız adminlər üçündür.')
    }
    tokenStore.set(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)