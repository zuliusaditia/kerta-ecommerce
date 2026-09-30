import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyOtp() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()
  const { verifyOtp } = useAuth()

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const inputsRef = useRef([])

  useEffect(() => {
    if (!email) {
      navigate('/login')
    } else {
      inputsRef.current[0]?.focus()
    }
  }, [email, navigate])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }

    // Auto-verify kalau semua 6 digit terisi
    if (newCode.every((c) => c !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const digits = pasted.split('')
      setCode(digits)
      handleVerify(pasted)
    }
  }

  const handleVerify = async (token) => {
    if (token.length !== 6) return
    setLoading(true)
    setError('')

    const { data, error } = await verifyOtp(email, token)

    if (error) {
      setError('Kode tidak valid atau kadaluarsa.')
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
      setLoading(false)
    } else if (data) {
      navigate('/account')
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    setError('')

    try {
      const res = await fetch('/api/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal kirim ulang')

      setResendMsg('Kode baru sudah dikirim ke email kamu.')
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.message)
    }
    setResending(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            ENTER CODE
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-2">
            Kode dikirim ke
          </p>
          <p className="text-sm font-bold">{email}</p>
          <Link
            to="/login"
            className="text-xs underline opacity-60 hover:opacity-100 mt-2 inline-block"
          >
            Ganti email
          </Link>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black border border-black/20 focus:border-black focus:outline-none disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs font-bold tracking-widest uppercase text-red-600 text-center mb-4">
            {error}
          </p>
        )}

        {/* Success Resend */}
        {resendMsg && (
          <p className="text-xs font-bold tracking-widest uppercase text-green-600 text-center mb-4">
            {resendMsg}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-xs font-bold tracking-widest uppercase text-center opacity-50 mb-4">
            Memverifikasi...
          </p>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify(code.join(''))}
          disabled={loading || code.some((c) => !c)}
          className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-xs opacity-50 mb-2">Belum menerima kode?</p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-xs font-bold tracking-widest uppercase underline hover:opacity-60 disabled:opacity-30"
          >
            {resending ? 'Mengirim...' : 'Kirim Ulang Kode'}
          </button>
        </div>

        <p className="text-xs opacity-40 text-center mt-6 leading-relaxed">
          Cek folder <strong>Spam</strong> atau <strong>Promotions</strong> kalau
          email tidak muncul dalam 1 menit.
        </p>
      </div>
    </div>
  )
}