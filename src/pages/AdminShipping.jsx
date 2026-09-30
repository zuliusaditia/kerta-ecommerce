import { useState, useEffect } from 'react'

export default function AdminShipping() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [activeCouriers, setActiveCouriers] = useState([])
  const [freeShippingMin, setFreeShippingMin] = useState(0)
  const [allCouriers, setAllCouriers] = useState([])

  // Fetch setting dari backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/settings/shipping')
        const data = await res.json()
        setActiveCouriers(data.active_couriers || [])
        setFreeShippingMin(data.free_shipping_min || 0)
        setAllCouriers(data.all_couriers || [])
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Gagal memuat setting')
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  // Toggle kurir ON/OFF
  const toggleCourier = (code) => {
    setActiveCouriers((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    )
    setSaved(false)
  }

  // Aktifin semua
  const selectAll = () => {
    setActiveCouriers(allCouriers.map((c) => c.code))
    setSaved(false)
  }

  // Matiin semua
  const deselectAll = () => {
    setActiveCouriers([])
    setSaved(false)
  }

  // Save
  const handleSave = async () => {
    if (activeCouriers.length === 0) {
      setError('Minimal aktifkan 1 kurir')
      return
    }

    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_couriers: activeCouriers,
          free_shipping_min: Number(freeShippingMin) || 0,
        }),
      })

      if (!res.ok) throw new Error('Gagal menyimpan')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2">
          Settings
        </p>
        <h2 className="text-3xl font-black tracking-tight">Shipping</h2>
        <p className="text-sm opacity-60 mt-2">
          Aktifkan atau matikan kurir yang tampil di halaman checkout.
        </p>
      </div>

      {/* Courier Toggle List */}
      <div className="border border-black/10">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-black/10 flex flex-wrap gap-3 justify-between items-center">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase">
              Kurir Aktif
            </p>
            <p className="text-[10px] opacity-50 mt-1">
              <span className="font-bold">{activeCouriers.length}</span> dari{' '}
              {allCouriers.length} kurir aktif
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 border border-black/20 hover:border-black transition"
            >
              Aktifkan Semua
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 border border-black/20 hover:border-black transition"
            >
              Matikan Semua
            </button>
          </div>
        </div>

        {/* Courier Rows */}
        <div className="divide-y divide-black/5">
          {allCouriers.map((courier) => {
            const isActive = activeCouriers.includes(courier.code)
            return (
              <div
                key={courier.code}
                className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.02] transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Status dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />

                  {/* Courier info */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight">
                      {courier.name}
                    </p>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest">
                      {courier.code}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleCourier(courier.code)}
                  role="switch"
                  aria-checked={isActive}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
                    isActive ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 self-center ml-1 ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info box */}
      <div className="border-l-4 border-black bg-black/[0.02] px-5 py-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-1">
          Info
        </p>
        <p className="text-xs opacity-70 leading-relaxed">
          Kurir yang <strong>aktif</strong> aja yang bakal muncul di halaman
          checkout customer. Untuk mempercepat loading, disarankan aktifkan
          3-4 kurir utama aja (JNE, SiCepat, J&T, AnterAja).
        </p>
      </div>

      {/* Free Shipping */}
      <div className="border border-black/10 p-6">
        <p className="text-xs font-bold tracking-widest uppercase mb-1">
          Free Shipping Minimum
        </p>
        <p className="text-[10px] opacity-50 mb-4">
          Pesanan di atas nominal ini dapat gratis ongkir (isi 0 untuk matikan)
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold opacity-50">Rp</span>
          <input
            type="number"
            value={freeShippingMin}
            onChange={(e) => {
              setFreeShippingMin(e.target.value)
              setSaved(false)
            }}
            placeholder="500000"
            className="flex-1 px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Save Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || activeCouriers.length === 0}
          className="text-xs font-bold tracking-widest uppercase bg-black text-white px-8 py-4 hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>

        {saved && (
          <span className="text-xs font-bold tracking-widest uppercase text-green-600">
            ✓ Tersimpan
          </span>
        )}

        {error && (
          <span className="text-xs font-bold tracking-widest uppercase text-red-600">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}