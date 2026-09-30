import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  const inputClass =
    'w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-sm'

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="max-w-2xl mb-16">
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
          Get in Touch
        </p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          CONTACT
        </h1>
        <p className="text-base md:text-lg opacity-70 leading-relaxed">
          Pertanyaan, kolaborasi, atau sekadar menyapa? Kami selalu senang mendengar dari kamu.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-16">
        {/* Info */}
        <div className="space-y-10">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-3">Email</p>
            <a href="mailto:hello@kerta.id" className="text-lg font-bold hover:opacity-60">
              hello@kerta.id
            </a>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-3">Instagram</p>
            <a href="#" className="text-lg font-bold hover:opacity-60">@kerta.id</a>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-3">Studio</p>
            <p className="text-lg font-bold leading-relaxed">
              Jl. Kemang Raya No. 12<br />
              Jakarta Selatan, 12730<br />
              Indonesia
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
          <textarea
            required
            rows={6}
            placeholder="Pesan"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={inputClass}
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition"
          >
            Kirim Pesan
          </button>
          {sent && (
            <p className="text-xs font-bold tracking-widest uppercase text-green-600 text-center">
              ✓ Pesan terkirim
            </p>
          )}
        </form>
      </div>
    </div>
  )
}