import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { adminLogin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await adminLogin(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  const inputClass =
    'w-full px-4 py-4 border border-black/20 focus:border-black focus:outline-none text-sm'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-3">
            Restricted Area
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            ADMIN
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase opacity-50">
            Login untuk akses dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          {error && (
            <p className="text-xs font-bold tracking-widest uppercase text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Masuk...' : 'Sign In as Admin'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-black/5 border border-black/10 text-center">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2">
            Demo Admin
          </p>
          <p className="text-xs font-mono">admin@kerta.id</p>
          <p className="text-xs font-mono">admin123</p>
        </div>

        <p className="text-xs opacity-50 text-center mt-6">
          Customer?{' '}
          <Link to="/login" className="underline hover:opacity-100">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}