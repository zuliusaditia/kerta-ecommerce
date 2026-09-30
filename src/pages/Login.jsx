import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { sendOtp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await sendOtp(email)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`)
    }
  }

  const inputClass =
    'w-full px-4 py-4 border border-black/20 focus:border-black focus:outline-none text-sm'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">SIGN IN</h1>
          <p className="text-xs font-bold tracking-widest uppercase opacity-50">
            Masukkan email untuk menerima kode
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Kode'}
          </button>
        </form>

        <p className="text-xs opacity-50 text-center mt-8 leading-relaxed">
          Kami akan mengirim kode 6-digit ke email kamu.<br />
          Demo: kode muncul di console & otomatis terisi.
        </p>
      </div>
    </div>
  )
}