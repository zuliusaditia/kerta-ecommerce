import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import StarRating from '../components/StarRating'

export default function Account() {
  const { user, customerSignOut, updateCustomer } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // ============================================
  // STATE UNTUK REVIEW
  // ============================================
  const [reviewModal, setReviewModal] = useState(null) // nyimpen data { product_id, order_id, product_name }
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  // Auto-fill form dari data user
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' })
    }
  }, [user])

  // Fetch riwayat pesanan
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

  useEffect(() => {
    fetchOrders()
  }, [])

  // Simpan profil
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')

    const { error } = await updateCustomer(form)

    if (error) {
      setSaveMsg('❌ ' + error.message)
    } else {
      setSaveMsg('✓ Profil berhasil disimpan')
      setTimeout(() => {
        setEditMode(false)
        setSaveMsg('')
      }, 1200)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await customerSignOut()
    navigate('/')
  }

  // Submit Review
  const submitReview = async () => {
    setSubmittingReview(true)
    setReviewMsg('')
    try {
      await api.submitReview({
        product_id: reviewModal.product_id,
        order_id: reviewModal.order_id,
        rating: Number(rating),
        review_text: reviewText
      })
      setReviewMsg('✓ Ulasan berhasil dikirim!')
      
      // Delay bentar biar user bisa baca pesan sukses, baru tutup modal & refresh
      setTimeout(() => {
        setReviewModal(null)
        setReviewMsg('')
        setRating(5)
        setReviewText('')
        fetchOrders() // Refresh data biar tombol "Beri Ulasan" ilang
      }, 1500)
      
    } catch (err) {
      setReviewMsg('❌ ' + err.message)
    }
    setSubmittingReview(false)
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const inputClass = 'w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-sm'

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

      {/* Profile Section */}
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
          <form onSubmit={handleSaveProfile} className="border border-black/10 p-6 space-y-4">
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
                  setForm({ name: user?.name || '', phone: user?.phone || '' })
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
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">Nama</p>
              <p className="text-sm font-bold">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">Nomor HP</p>
              <p className="text-sm font-bold">{user?.phone || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Orders Section */}
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
                    <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-1">Order Code</p>
                    <p className="font-black tracking-wide">{order.order_code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-1">Tanggal</p>
                    <p className="text-sm font-bold">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* List Item Produk & Tombol Review */}
                <div className="space-y-3 mb-6">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-black/5 p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-16 object-cover bg-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold line-clamp-1">{item.product_name}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">
                            {item.qty} × Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* LOGIKA TOMBOL REVIEW */}
                      {order.status === 'completed' ? (
                        item.is_reviewed ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase bg-green-100 text-green-800 px-3 py-1.5 border border-green-200 flex-shrink-0">
                            ✓ Sudah Diulas
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ product_id: item.product_id, order_id: order.id, product_name: item.product_name })}
                            className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition flex-shrink-0"
                          >
                            Beri Ulasan
                          </button>
                        )
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-black/10">
                  <span className="text-xs font-bold tracking-widest uppercase opacity-50">Total</span>
                  <span className="font-black">Rp {order.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          MODAL BERI ULASAN
      ============================================ */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 md:p-8 w-full max-w-md">
            <h3 className="font-black text-xl tracking-tight mb-1">Beri Ulasan</h3>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6 line-clamp-1">
              {reviewModal.product_name}
            </p>
            
            <div className="mb-6">
              <label className="block text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2">Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)} 
                    className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2">Ulasan (Opsional)</label>
              <textarea 
                rows={4} 
                value={reviewText} 
                onChange={(e) => setReviewText(e.target.value)} 
                placeholder="Gimana kualitas produknya?" 
                className={inputClass} 
              />
            </div>

            {reviewMsg && (
              <p className={`text-xs font-bold tracking-widest uppercase text-center mb-4 ${reviewMsg.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {reviewMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={submitReview} 
                disabled={submittingReview} 
                className="flex-1 bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 disabled:opacity-50"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
              <button 
                onClick={() => setReviewModal(null)} 
                className="px-6 py-4 text-xs font-bold tracking-widest uppercase border border-black hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}