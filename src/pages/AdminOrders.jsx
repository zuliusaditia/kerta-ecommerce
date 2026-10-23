import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function AdminOrders({ orders, loading, onUpdate }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)
  const [shipping, setShipping] = useState(null)
  const [shipError, setShipError] = useState({})
  
  // State buat nyimpen jadwal pickup manual (khusus SPX & AnterAja)
  const [pickupInputs, setPickupInputs] = useState({})

  // ============================================
  // FILTER + SEARCH
  // ============================================
  const filteredOrders = orders.filter((order) => {
    const matchStatus = filter === 'all' || order.status === filter
    const q = search.toLowerCase().trim()
    const matchSearch =
      !q ||
      order.order_code.toLowerCase().includes(q) ||
      order.customer_name?.toLowerCase().includes(q) ||
      order.customer_phone?.includes(q)
    return matchStatus && matchSearch
  })

  // ============================================
  // HANDLE STATUS CHANGE
  // ============================================
  const handleStatusChange = async (orderCode, newStatus) => {
    setUpdating(orderCode)
    try {
      await api.updateOrderStatus(orderCode, newStatus)
      await onUpdate()
    } catch (err) {
      alert('Gagal update status: ' + err.message)
    }
    setUpdating(null)
  }

  // ============================================
  // HANDLE INPUT JADWAL PICKUP
  // ============================================
  const handlePickupChange = (orderCode, field, value) => {
    setPickupInputs((prev) => ({
      ...prev,
      [orderCode]: {
        ...(prev[orderCode] || {}),
        [field]: value,
      },
    }))
  }

  // ============================================
  // HANDLE PROSES PESANAN (auto-create ke Mengantar)
  // ============================================
  const handleShipOrder = async (orderCode) => {
    setShipping(orderCode)
    setShipError((prev) => ({ ...prev, [orderCode]: '' }))

    try {
      // Ambil inputan jadwal dari state (kalau ada)
      const currentPickup = pickupInputs[orderCode] || {}

      const res = await fetch(`/api/admin/orders/${orderCode}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_date: currentPickup.date || null,
          pickup_time: currentPickup.time || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal proses pesanan')

      await onUpdate()
    } catch (err) {
      setShipError((prev) => ({ ...prev, [orderCode]: err.message }))
    }
    setShipping(null)
  }

  // ============================================
  // COUNTS
  // ============================================
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="border border-black/10 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-black/20">
          <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-2">
          Belum ada pesanan
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-black/10">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[10px] font-bold tracking-widest uppercase px-3 py-2 border transition ${
                filter === f.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 ${filter === f.key ? 'opacity-60' : 'opacity-40'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, atau HP..."
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-black/20 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
        Menampilkan {filteredOrders.length} dari {orders.length} pesanan
      </p>

      {filteredOrders.length === 0 ? (
        <div className="border border-black/10 py-16 text-center">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            Tidak ada pesanan
          </p>
          <button
            onClick={() => {
              setFilter('all')
              setSearch('')
            }}
            className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block border border-black/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10 bg-black/5">
                <tr className="text-left">
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Order Code</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Total</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Resi</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Tanggal</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  // Cek apakah kurir ini butuh jadwal pickup
                  const needsPickup = ['spx', 'anteraja'].includes(order.courier_code)

                  return (
                    <tr key={order.order_code} className="border-b border-black/5 hover:bg-black/[0.02] transition align-top">
                      <td className="px-5 py-4">
                        <p className="font-bold tracking-wide text-xs">{order.order_code}</p>
                        <p className="text-[10px] opacity-50 mt-0.5">{order.payment_method || 'transfer'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-sm">{order.customer_name}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{order.customer_phone}</p>
                      </td>
                      <td className="px-5 py-4 font-black">
                        Rp {order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.order_code, e.target.value)}
                          disabled={updating === order.order_code}
                          className="text-[10px] font-bold tracking-widest uppercase border border-black/20 px-2 py-1.5 focus:outline-none focus:border-black disabled:opacity-50 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        {order.status === 'shipped' || order.status === 'completed' ? (
                          order.tracking_number ? (
                            <div className="text-xs">
                              <p className="font-bold uppercase">{order.courier_code}</p>
                              <p className="font-mono opacity-60">{order.tracking_number}</p>
                            </div>
                          ) : (
                            <div className="space-y-2 min-w-[200px]">
                              <div className="text-[10px] font-bold tracking-widest uppercase opacity-50 bg-black/5 px-2 py-1">
                                {order.courier_name || order.courier_code || 'Kurir'}
                              </div>
                              
                              {/* FORM PICKUP KHUSUS SPX / ANTERAJA */}
                              {needsPickup && (
                                <div className="flex flex-col gap-1.5 bg-blue-50/50 p-2 border border-blue-100">
                                  <label className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">Jadwal Pickup</label>
                                  <input 
                                    type="date" 
                                    className="text-xs border border-black/20 px-2 py-1.5 w-full focus:outline-none focus:border-black"
                                    onChange={(e) => handlePickupChange(order.order_code, 'date', e.target.value)}
                                  />
                                  <select 
                                    className="text-xs border border-black/20 px-2 py-1.5 w-full focus:outline-none focus:border-black"
                                    onChange={(e) => handlePickupChange(order.order_code, 'time', e.target.value)}
                                    defaultValue="14:00"
                                  >
                                    <option value="14:00">14:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="16:00">16:00</option>
                                    <option value="17:00">17:00</option>
                                    <option value="18:00">18:00</option>
                                    <option value="19:00">19:00</option>
                                    <option value="20:00">20:00</option>
                                    <option value="21:00">21:00</option>
                                    <option value="22:00">22:00</option>
                                  </select>
                                </div>
                              )}

                              <button
                                onClick={() => handleShipOrder(order.order_code)}
                                disabled={shipping === order.order_code}
                                className="w-full text-[10px] font-bold tracking-widest uppercase bg-black text-white px-3 py-2 hover:bg-gray-800 transition disabled:opacity-50"
                              >
                                {shipping === order.order_code ? 'Memproses...' : 'Proses Pesanan'}
                              </button>
                              {shipError[order.order_code] && (
                                <p className="text-[9px] text-red-600 font-bold text-center leading-tight">
                                  {shipError[order.order_code]}
                                </p>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] opacity-40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs opacity-60 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/order/${order.order_code}`}
                          className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60 whitespace-nowrap"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const needsPickup = ['spx', 'anteraja'].includes(order.courier_code)

              return (
                <div key={order.order_code} className="border border-black/10 p-4">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-black/10">
                    <div>
                      <p className="font-bold text-xs tracking-wide">{order.order_code}</p>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="font-black text-sm">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">Customer</p>
                    <p className="text-sm font-bold">{order.customer_name}</p>
                    <p className="text-[10px] opacity-60">{order.customer_phone}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1.5">Status</p>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.order_code, e.target.value)}
                      disabled={updating === order.order_code}
                      className="w-full text-[10px] font-bold tracking-widest uppercase border border-black/20 px-3 py-2 focus:outline-none focus:border-black disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {(order.status === 'shipped' || order.status === 'completed') && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1.5">Resi</p>
                      {order.tracking_number ? (
                        <div className="text-xs bg-black/5 p-3">
                          <p className="font-bold uppercase">{order.courier_code}</p>
                          <p className="font-mono opacity-60 mt-0.5">{order.tracking_number}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold tracking-widest uppercase opacity-50 bg-black/5 px-3 py-2">
                            Kurir: {order.courier_name || order.courier_code}
                            {order.courier_service && ` — ${order.courier_service}`}
                          </div>
                          
                          {/* FORM PICKUP MOBILE */}
                          {needsPickup && (
                            <div className="flex flex-col gap-1.5 bg-blue-50/50 p-2 border border-blue-100">
                              <label className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">Jadwal Pickup</label>
                              <input 
                                type="date" 
                                className="text-xs border border-black/20 px-2 py-1.5 w-full focus:outline-none focus:border-black"
                                onChange={(e) => handlePickupChange(order.order_code, 'date', e.target.value)}
                              />
                              <select 
                                className="text-xs border border-black/20 px-2 py-1.5 w-full focus:outline-none focus:border-black"
                                onChange={(e) => handlePickupChange(order.order_code, 'time', e.target.value)}
                                defaultValue="14:00"
                              >
                                <option value="14:00">14:00</option>
                                <option value="15:00">15:00</option>
                                <option value="16:00">16:00</option>
                                <option value="17:00">17:00</option>
                                <option value="18:00">18:00</option>
                                <option value="19:00">19:00</option>
                                <option value="20:00">20:00</option>
                                <option value="21:00">21:00</option>
                                <option value="22:00">22:00</option>
                              </select>
                            </div>
                          )}

                          <button
                            onClick={() => handleShipOrder(order.order_code)}
                            disabled={shipping === order.order_code}
                            className="w-full text-[10px] font-bold tracking-widest uppercase bg-black text-white px-3 py-2 hover:bg-gray-800 transition disabled:opacity-50"
                          >
                            {shipping === order.order_code ? 'Memproses...' : 'Proses Pesanan'}
                          </button>
                          {shipError[order.order_code] && (
                            <p className="text-[9px] text-red-600 font-bold text-center">
                              {shipError[order.order_code]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    to={`/order/${order.order_code}`}
                    className="block w-full text-center text-[10px] font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition"
                  >
                    Lihat Detail
                  </Link>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}