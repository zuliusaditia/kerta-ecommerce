import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  if (!user) {
    // Kalau role admin → redirect ke /admin/login
    if (role === 'admin') return <Navigate to="/admin/login" replace />
    return <Navigate to="/login" replace />
  }

  // Cek role match
  if (role && user.type !== role) {
    // Salah role → redirect ke home
    return <Navigate to="/" replace />
  }

  return children
}