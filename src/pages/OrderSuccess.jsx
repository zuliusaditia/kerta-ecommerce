import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function OrderSuccess() {
  const { code } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      try {
        const data = await api.getOrder(code)
        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setOrder(null)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [code])

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-4">
          PESANAN TIDAK DITEMUKAN
        </h1>
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-10">
          Kode: {code}
        </p>
        <Link to="/shop" className="text-sm font-bold underline">
          ← Kembali ke Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
          Thank you
        </p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
          PESANAN BERHASIL
        </h1>
        <p className="text-sm opacity-60 max-w-md mx-auto">
          Kami sudah menerima pesananmu. Simpan kode di bawah untuk melacak status pesanan.
        </p>
      </div>

      <div className="bg-black text-white p-6 mb-8 text-center">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-2">
          Order Code
        </p>
        <p className="text-2xl md:text-3xl font-black tracking-wider">
          {order.order_code}
        </p>
      </div>

      <div className="border border-black/10 p-6 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase opacity-60">
            Status
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Info Kurir */}
      {order.courier_name && (
        <div className="border border-black/10 p-6 mb-8">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            {order.tracking_number ? 'Pengiriman' : 'Kurir Terpilih'}
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-3">
            <div className="bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
              {order.courier_name.toUpperCase()}
            </div>
            {order.courier_service && (
              <span className="text-xs font-bold opacity-60">
                {order.courier_service}
              </span>
            )}
            <span className="text-sm opacity-60 ml-auto">
              Rp {order.shipping_cost.toLocaleString('id-ID')}
            </span>
          </div>

          {order.tracking_number ? (
            <div className="mt-4 pt-4 border-t border-black/10">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1.5">
                Nomor Resi
              </p>
              <p className="text-base font-mono font-bold tracking-wide">
                {order.tracking_number}
              </p>
              <p className="text-[10px] opacity-50 mt-2">
                Lacak paket kamu di website resmi {order.courier_name} atau
                hubungi customer service KERTA untuk update status.
              </p>
            </div>
          ) : (
            <p className="text-[10px] opacity-50 mt-3">
              Nomor resi akan muncul setelah paket diproses oleh penjual.
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border border-black/10 p-6">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            Pengiriman
          </p>
          <p className="text-sm font-bold mb-1">{order.customer_name}</p>
          <p className="text-sm opacity-70">{order.customer_phone}</p>
          {order.customer_email && (
            <p className="text-sm opacity-70">{order.customer_email}</p>
          )}

          <div className="mt-3 pt-3 border-t border-black/5">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-1">
              Alamat
            </p>
            <p className="text-sm opacity-70 leading-relaxed">
              {order.address}
              <br />
              {order.city}
              {order.postal_code && `, ${order.postal_code}`}
            </p>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1.5">
                Catatan
              </p>
              <p className="text-xs opacity-70 italic leading-relaxed">
                "{order.notes}"
              </p>
            </div>
          )}
        </div>

        <div className="border border-black/10 p-6">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            Pembayaran
          </p>
          <p className="text-sm font-bold mb-1 capitalize">
            {order.payment_method === 'cod'
              ? 'COD (Bayar di Tempat)'
              : order.payment_method === 'qris'
              ? 'QRIS'
              : 'Transfer Bank'}
          </p>
          <p className="text-sm opacity-70">
            Dibuat pada{' '}
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="border border-black/10 p-6 mb-8">
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-6">
          Detail Produk
        </p>

        <div className="space-y-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <img
                src={item.product_image}
                alt={item.product_name}
                className="w-16 h-20 object-cover bg-gray-100"
              />
              <div className="flex-1">
                <p className="text-sm font-bold tracking-tight leading-snug mb-1">
                  {item.product_name}
                </p>
                <p className="text-xs opacity-60">
                  {item.qty} × Rp {item.price.toLocaleString('id-ID')}
                </p>
              </div>
              <p className="text-sm font-black self-end">
                Rp {(item.price * item.qty).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-black/10 mt-6 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-60">Subtotal</span>
            <span className="font-bold">
              Rp {order.subtotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Ongkir</span>
            <span className="font-bold">
              Rp {order.shipping_cost.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-black/10 mt-3">
            <span className="text-xs font-bold tracking-widest uppercase">
              Total
            </span>
            <span className="text-xl font-black">
              Rp {order.total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/shop"
          className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition"
        >
          Lanjut Belanja
        </Link>
      </div>
    </div>
  )
}

// ============================================
// STATUS BADGE
// ============================================
function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const labels = {
    pending: 'Menunggu Diproses',
    shipped: 'Sedang Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  return (
    <span
      className={`text-xs font-bold tracking-widest uppercase px-3 py-1 ${
        colors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}