import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { analytics } from '../lib/analytics'

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={`${className} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function LoadingRow({ text }) {
  return (
    <div className="flex items-center gap-3 py-4 text-sm opacity-70">
      <Spinner className="w-4 h-4" />
      <span className="font-bold tracking-widest uppercase text-[10px]">
        {text}
      </span>
    </div>
  )
}

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    notes: '',
    payment: 'transfer',
  })

  const [areaQuery, setAreaQuery] = useState('')
  const [areaResults, setAreaResults] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [searchingArea, setSearchingArea] = useState(false)

  const [couriers, setCouriers] = useState([])
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [areaCache] = useState(() => new Map())
  const [ratesCache] = useState(() => new Map())

  useEffect(() => {
    if (user && user.type === 'customer') {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  // Debounced area search
  useEffect(() => {
    if (areaQuery.length < 3) {
      setAreaResults([])
      return
    }
    if (selectedArea && areaQuery === selectedArea.full_address_short) return

    const timer = setTimeout(async () => {
      const cacheKey = areaQuery.toLowerCase()
      if (areaCache.has(cacheKey)) {
        setAreaResults(areaCache.get(cacheKey))
        return
      }

      setSearchingArea(true)
      try {
        const res = await fetch(
          `/api/shipping/areas?input=${encodeURIComponent(areaQuery)}`
        )
        const data = await res.json()
        setAreaResults(data || [])
        areaCache.set(cacheKey, data || [])
      } catch (err) {
        console.error('Area search error:', err)
      }
      setSearchingArea(false)
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaQuery])

  // Fetch rates when area selected
  useEffect(() => {
    if (!selectedArea) {
      setCouriers([])
      setSelectedCourier(null)
      return
    }

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0)
    const weight = Math.max(1, Math.ceil(totalQty * 0.5)) // 500g per item, min 1kg

    const cacheKey = `${selectedArea.id}-${weight}`

    if (ratesCache.has(cacheKey)) {
      const cached = ratesCache.get(cacheKey)
      setCouriers(cached)
      if (cached.length > 0) {
        setSelectedCourier(cached[0]) // sudah di-sort dari termurah
      }
      setLoadingRates(false)
      return
    }

    const fetchRates = async () => {
      setLoadingRates(true)
      setRatesError('')
      setCouriers([])
      setSelectedCourier(null)

      try {
        const res = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination_id: selectedArea.id,
            weight,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal hitung ongkir')

        setCouriers(data || [])
        ratesCache.set(cacheKey, data || [])

        if (data && data.length > 0) {
          setSelectedCourier(data[0]) // termurah
        }
      } catch (err) {
        console.error('Rates error:', err)
        setRatesError(err.message)
      }
      setLoadingRates(false)
    }

    fetchRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea])

  const shippingCost = selectedCourier?.price || 0
  const grandTotal = totalPrice + shippingCost

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-6">
          Keranjang kamu kosong
        </p>
        <Link to="/shop" className="text-sm font-bold underline">
          ← Mulai belanja
        </Link>
      </div>
    )
  }

  const generateOrderCode = () => {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `KRT-${y}${m}${d}-${rand}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!selectedArea) {
      setError('Pilih kecamatan / kode pos terlebih dahulu.')
      setSubmitting(false)
      return
    }

    if (!selectedCourier) {
      setError('Pilih kurir pengiriman terlebih dahulu.')
      setSubmitting(false)
      return
    }

    const fullCity = selectedArea.full_address_short || selectedArea.name
    const orderCode = generateOrderCode()

    try {
      await api.createOrder({
        order_code: orderCode,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        address: form.address,
        city: fullCity,
        postal_code: form.postalCode || String(selectedArea.zip || ''),
        notes: form.notes || null,
        payment_method: form.payment,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        total: grandTotal,
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image,
          price: item.price,
          qty: item.qty,
        })),
        courier_code: selectedCourier.code,
        courier_service: selectedCourier.service,
        courier_name: selectedCourier.name,
        destination_area_id: selectedArea.id, // ← TAMBAH BARIS INI
      })

      analytics.purchase(cart.map((item) => item.id))
      clearCart()
      navigate(`/order/${orderCode}`)
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Gagal membuat pesanan. Silakan coba lagi.')
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-sm disabled:bg-gray-50 disabled:opacity-60'

  const labelClass =
    'block text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2'

  const isLoggedIn = user && user.type === 'customer'

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-end justify-between mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          CHECKOUT
        </h1>

        {isLoggedIn && (
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
              Logged in as
            </p>
            <p className="text-xs font-bold">{user.email}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pengiriman */}
          <div className="border border-black/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold tracking-widest uppercase">
                Data Pengiriman
              </h2>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="text-[10px] font-bold tracking-widest uppercase underline opacity-60 hover:opacity-100"
                >
                  Login untuk auto-fill
                </Link>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penerima"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nomor HP *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email (opsional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Alamat Lengkap *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jalan, No. Rumah, RT/RW, Kelurahan"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Area Pengiriman */}
          <div className="border border-black/10 p-6">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-6">
              Area Pengiriman
            </h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Cari Kecamatan / Kode Pos *</label>
                <input
                  type="text"
                  placeholder="Contoh: Kemanggisan atau 11480"
                  value={areaQuery}
                  onChange={(e) => {
                    setAreaQuery(e.target.value)
                    if (
                      selectedArea &&
                      e.target.value !== selectedArea.full_address_short
                    ) {
                      setSelectedArea(null)
                    }
                  }}
                  className={inputClass}
                />
                <p className="text-[10px] opacity-50 mt-1.5">
                  Ketik minimal 3 karakter, pilih dari hasil pencarian
                </p>
              </div>

              {searchingArea && (
                <div className="border border-black/10 px-4 py-3 bg-gray-50">
                  <LoadingRow text="Mencari area" />
                </div>
              )}

              {!searchingArea && areaResults.length > 0 && !selectedArea && (
                <div className="border border-black/10 max-h-64 overflow-y-auto">
                  {areaResults.slice(0, 20).map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setSelectedArea(area)
                        setAreaResults([])
                        setAreaQuery(area.full_address_short)
                        if (area.zip) {
                          setForm((prev) => ({
                            ...prev,
                            postalCode: String(area.zip),
                          }))
                        }
                      }}
                      className="w-full text-left px-4 py-3 border-b border-black/5 last:border-0 hover:bg-black/5 transition"
                    >
                      <p className="text-sm font-bold">
                        {area.name}
                      </p>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        {area.district}, {area.city}, {area.province}
                        {area.zip && ` — ${area.zip}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedArea && (
                <div className="border-2 border-black bg-black/5 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                        Area Terpilih
                      </p>
                      <p className="text-sm font-bold">{selectedArea.name}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {selectedArea.district}, {selectedArea.city},{' '}
                        {selectedArea.province}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArea(null)
                        setAreaQuery('')
                        setCouriers([])
                        setSelectedCourier(null)
                      }}
                      className="text-[10px] font-bold tracking-widest uppercase underline opacity-60 hover:opacity-100"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Kode Pos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="12345"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Catatan (opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rumah pagar hitam, titip ke security, dll"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Pilih Kurir */}
          {selectedArea && (
            <div className="border border-black/10 p-6">
              <h2 className="text-xs font-bold tracking-widest uppercase mb-6">
                Pilih Kurir
              </h2>

              {loadingRates && (
                <div className="border border-black/10 px-4 py-6 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Spinner className="w-5 h-5" />
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
                        Menghitung ongkos kirim
                      </p>
                      <p className="text-xs opacity-60 mt-0.5">
                        Sedang mencari tarif terbaik untuk kamu...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {ratesError && (
                <p className="text-xs font-bold tracking-widest uppercase text-red-600 text-center py-8">
                  {ratesError}
                </p>
              )}

              {!loadingRates && !ratesError && couriers.length === 0 && (
                <p className="text-xs opacity-50 text-center py-8">
                  Tidak ada kurir tersedia untuk rute ini.
                </p>
              )}

              {!loadingRates && couriers.length > 0 && (
                <div className="space-y-2">
                  {couriers.map((c, idx) => {
                    const isSelected = selectedCourier?.code === c.code
                    return (
                      <label
                        key={`${c.code}-${idx}`}
                        className={`flex items-start gap-3 p-4 border cursor-pointer transition ${
                          isSelected
                            ? 'border-black bg-black/5'
                            : 'border-black/20 hover:border-black/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="courier"
                          checked={isSelected}
                          onChange={() => setSelectedCourier(c)}
                          className="mt-1"
                        />
                        <div className="flex-1 flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold tracking-tight text-sm">
                                {c.name}
                              </p>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold tracking-widest uppercase bg-black text-white px-2 py-0.5">
                                  Termurah
                                </span>
                              )}
                              {!c.supportsCOD && (
                                <span className="text-[9px] font-bold tracking-widest uppercase bg-gray-200 text-gray-600 px-2 py-0.5">
                                  No COD
                                </span>
                              )}
                            </div>
                            <p className="text-xs opacity-60 mt-0.5">
                              {c.service} — Estimasi {c.estimatedDate}
                            </p>
                            {c.discountPercent > 0 && (
                              <p className="text-[10px] text-green-700 font-bold mt-1">
                                Diskon {c.discountPercent}% (hemat Rp{' '}
                                {c.discount.toLocaleString('id-ID')})
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {c.discount > 0 && (
                              <p className="text-[10px] line-through opacity-40">
                                Rp {c.originalPrice.toLocaleString('id-ID')}
                              </p>
                            )}
                            <p className="font-black text-sm whitespace-nowrap">
                              Rp {c.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Metode Pembayaran */}
          <div className="border border-black/10 p-6">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-6">
              Metode Pembayaran
            </h2>

            <div className="space-y-2">
              {[
                { value: 'transfer', label: 'Transfer Bank', desc: 'BCA, BNI, Mandiri' },
                { value: 'qris', label: 'QRIS', desc: 'Scan pakai e-wallet apa saja' },
                { value: 'cod', label: 'COD (Bayar di Tempat)', desc: 'Bayar saat barang datang' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 border cursor-pointer transition ${
                    form.payment === opt.value
                      ? 'border-black bg-black/5'
                      : 'border-black/20 hover:border-black/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={form.payment === opt.value}
                    onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-bold tracking-tight">{opt.label}</p>
                    <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="lg:sticky lg:top-24 h-fit border border-black p-6">
          <h2 className="text-xs font-bold tracking-widest uppercase mb-6 pb-6 border-b border-black/10">
            Ringkasan Pesanan
          </h2>

          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-16 object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs line-clamp-1">{item.name}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {item.qty} × Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-60">Subtotal</span>
              <span className="font-bold">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Ongkir</span>
              <span className="font-bold">
                {selectedCourier
                  ? `Rp ${shippingCost.toLocaleString('id-ID')}`
                  : '—'}
              </span>
            </div>
            {selectedCourier && (
              <div className="flex justify-between text-[10px] opacity-60">
                <span className="pl-2">via {selectedCourier.name}</span>
                <span>{selectedCourier.estimatedDate}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-6 border-t border-black/10 mt-4 mb-6">
            <span className="text-xs font-bold tracking-widest uppercase">
              Total
            </span>
            <span className="text-xl font-black">
              Rp {grandTotal.toLocaleString('id-ID')}
            </span>
          </div>

          {error && (
            <p className="text-xs font-bold tracking-widest uppercase text-red-600 mb-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedCourier}
            className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Memproses</span>
              </>
            ) : (
              'Buat Pesanan'
            )}
          </button>

          {!selectedCourier && !loadingRates && (
            <p className="text-[10px] opacity-50 text-center mt-3">
              Pilih kurir untuk melanjutkan
            </p>
          )}
        </div>
      </form>
    </div>
  )
}