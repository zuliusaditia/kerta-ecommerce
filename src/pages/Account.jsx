import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Account() {
  const { user, customerSignOut, updateCustomer } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' })
    }
  }, [user])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const data = await api.getMyOrders()
        setOrders(data)
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')

    const { error } = await updateCustomer(form)

    if (error) {
      setSaveMsg('❌ ' + error.message)
      setSaving(false)
    } else {
      setSaveMsg('✓ Profil berhasil disimpan')
      setSaving(false)
      setTimeout(() => {
        setEditMode(false)
        setSaveMsg('')
      }, 1200)
    }
  }

  const handleLogout = async () => {
    await customerSignOut()
    navigate('/')
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const inputClass =
    'w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-sm'

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 pb-8 border-b border-black/10">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-2">
            My Account
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {user?.name || 'Welcome'}
          </h1>
          <p className="text-sm opacity-60 mt-2">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition self-start"
        >
          Sign Out
        </button>
      </div>

      {/* Profile */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold tracking-widest uppercase opacity-50">
            Profile
          </h2>
          {!editMode && (
            <button
              onClick={() => {
                setEditMode(true)
                setSaveMsg('')
              }}
              className="text-xs font-bold tracking-widest uppercase underline hover:opacity-60"
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSave} className="border border-black/10 p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase opacity-50 mb-2">
                Nama
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase opacity-50 mb-2">
                Nomor HP
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0812xxxxxxx"
                className={inputClass}
              />
            </div>

            {saveMsg && (
              <p className="text-xs font-bold tracking-widest uppercase">
                {saveMsg}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-3 hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false)
                  setSaveMsg('')
                  setForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                  })
                }}
                className="text-xs font-bold tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-black/10 p-6 grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                Nama
              </p>
              <p className="text-sm font-bold">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                Nomor HP
              </p>
              <p className="text-sm font-bold">{user?.phone || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
          Riwayat Pesanan
        </h2>

        {loading ? (
          <div className="py-16 text-center text-xs font-bold tracking-widest uppercase opacity-50">
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-black/10 py-16 text-center">
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
              Belum ada pesanan
            </p>
            <Link to="/shop" className="text-sm font-bold underline">
              Mulai Belanja →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.order_code} className="border border-black/10 p-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-black/10">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-1">
                      Order Code
                    </p>
                    <p className="font-black tracking-wide">{order.order_code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-1">
                      Tanggal
                    </p>
                    <p className="text-sm font-bold">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-12 h-16 object-cover bg-gray-100"
                    />
                  ))}
                  {order.items?.length > 4 && (
                    <div className="w-12 h-16 bg-gray-100 flex items-center justify-center text-xs font-bold opacity-60">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                {/* Info Kurir */}
                {order.courier_name && (
                  <div className="flex justify-between items-center text-xs mb-2 pt-4 border-t border-black/10">
                    <span className="font-bold tracking-widest uppercase opacity-50 text-[10px]">
                      Kurir
                    </span>
                    <span className="font-bold">
                      {order.courier_name}
                      {order.courier_service && ` — ${order.courier_service}`}
                    </span>
                  </div>
                )}

                {/* Info Resi */}
                {order.tracking_number && (
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold tracking-widest uppercase opacity-50 text-[10px]">
                      No. Resi
                    </span>
                    <span className="font-mono font-bold">
                      {order.tracking_number}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-black/10 mt-4">
                  <span className="text-xs font-bold tracking-widest uppercase opacity-50">
                    Total
                  </span>
                  <span className="font-black">
                    Rp {order.total.toLocaleString('id-ID')}
                  </span>
                </div>

                <Link
                  to={`/order/${order.order_code}`}
                  className="text-xs font-bold tracking-widest uppercase underline hover:opacity-60 mt-4 inline-block"
                >
                  Lihat Detail →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}