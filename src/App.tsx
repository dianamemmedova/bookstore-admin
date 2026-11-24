import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { FullScreenSpinner } from './components/ui/Spinner'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'
import BooksPage from './pages/BooksPage'
import OrdersPage from './pages/OrdersPage'
import UsersPage from './pages/UsersPage'
import PromosPage from './pages/PromosPage'
import GiftCardsPage from './pages/GiftCardsPage'
import MessagesPage from './pages/MessagesPage'
import NotFoundPage from './pages/NotFoundPage'

// Giriş etməyibsə /login-ə atır (daxil olandan sonra qayıtmaq üçün yolu yadda saxlayır)
function RequireAdmin() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <FullScreenSpinner />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="promos" element={<PromosPage />} />
          <Route path="gift-cards" element={<GiftCardsPage />} />
          <Route path="newsletter" element={<PlaceholderPage title="Bülleten" />} />
          <Route path="stores" element={<PlaceholderPage title="Mağazalar" />} />
          <Route path="events" element={<PlaceholderPage title="Tədbirlər" />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}