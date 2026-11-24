import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { FullScreenSpinner } from './components/ui/Spinner'
import Button from './components/ui/Button'
import LoginPage from './pages/LoginPage'

function RequireAdmin() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// Müvəqqəti ana səhifə (Addım 4-də layout ilə əvəz olunur)
function TempHome() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-ink">Xoş gəldin, {user?.firstName}!</h1>
      <p className="text-sm text-muted">{user?.email} · {user?.role}</p>
      <Button variant="secondary" onClick={logout}>Çıxış</Button>
    </div>
  )
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <FullScreenSpinner />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route path="/" element={<TempHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}