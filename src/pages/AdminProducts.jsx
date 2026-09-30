import { useState } from 'react'
import { api } from '../lib/api'

export default function AdminProducts({ products, loading, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const emptyForm = {
    name: '',
    price: '',
    image: '',
    category: 'Pakaian',
    rating: 4.5,
    sold: 0,
    description: '',
  }

  const [form, setForm] = useState(emptyForm)

  // ============================================
  // FILTER + SEARCH
  // ============================================
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    )
  })

  // ============================================
  // HANDLERS
  // ============================================
  const startEdit = (product) => {
    setForm({ ...product, price: String(product.price) })
    setEditing(product.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      price: Number(form.price),
      image: form.image,
      category: form.category,
      rating: Number(form.rating),
      sold: Number(form.sold),
      description: form.description,
    }

    try {
      if (editing) {
        await api.updateProduct(editing, payload)
      } else {
        await api.createProduct(payload)
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      onUpdate()
    } catch (err) {
      alert('Gagal simpan: ' + err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus produk "${name}"?`)) return
    try {
      await api.deleteProduct(id)
      onUpdate()
    } catch (err) {
      alert('Gagal hapus: ' + err.message)
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-black/20 focus:border-black focus:outline-none text-sm'

  const labelClass =
    'block text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2'

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============================================
          TOOLBAR
      ============================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-black/10">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
            Products
          </p>
          <p className="text-2xl font-black tracking-tight">
            {filteredProducts.length}{' '}
            <span className="opacity-40 text-lg">
              / {products.length}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1 lg:w-64">
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
              placeholder="Cari produk..."
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-black/20 focus:border-black focus:outline-none"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={startAdd}
            className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-5 py-3 hover:bg-gray-800 transition whitespace-nowrap"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* ============================================
          FORM (Create / Edit)
      ============================================ */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-black p-6 md:p-8 bg-black/[0.02]"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                {editing ? 'Edit Produk' : 'Tambah Produk Baru'}
              </p>
              <p className="text-xl font-black tracking-tight">
                {editing ? form.name || 'Unnamed' : 'Produk Baru'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
                setForm(emptyForm)
              }}
              className="text-xs font-bold tracking-widest uppercase opacity-60 hover:opacity-100"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className={labelClass}>Nama Produk *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Oversized Tee Manuscript"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Price */}
            <div>
              <label className={labelClass}>Harga (Rp) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="189000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Kategori *</label>
              <input
                type="text"
                required
                placeholder="Pakaian"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className={labelClass}>URL Gambar *</label>
              <input
                type="text"
                required
                placeholder="https://images.unsplash.com/..."
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className={inputClass}
              />
              {form.image && (
                <div className="mt-3 flex items-center gap-4 p-3 border border-black/10 bg-white">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-16 h-20 object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                      Preview
                    </p>
                    <p className="text-[10px] opacity-60">
                      Kalau gambar tidak muncul, cek URL-nya
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className={labelClass}>Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="4.5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Sold */}
            <div>
              <label className={labelClass}>Jumlah Terjual</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.sold}
                onChange={(e) => setForm({ ...form, sold: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={labelClass}>Deskripsi *</label>
              <textarea
                required
                rows={4}
                placeholder="Jelaskan detail produk: material, ukuran, warna, dll..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-black/10">
            <button
              type="submit"
              className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-3 hover:bg-gray-800 transition"
            >
              {editing ? 'Update Produk' : 'Simpan Produk'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
                setForm(emptyForm)
              }}
              className="text-xs font-bold tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ============================================
          EMPTY STATES
      ============================================ */}
      {products.length === 0 ? (
        <div className="border border-black/10 py-24 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-black/20">
            <svg
              className="w-8 h-8 opacity-30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
          </div>
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            Belum ada produk
          </p>
          <button
            onClick={startAdd}
            className="text-xs font-bold tracking-widest uppercase underline hover:opacity-60"
          >
            + Tambah produk pertama
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-black/10 py-16 text-center">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            Tidak ada produk yang cocok
          </p>
          <button
            onClick={() => setSearch('')}
            className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          {/* ============================================
              DESKTOP: TABLE
          ============================================ */}
          <div className="hidden md:block border border-black/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10 bg-black/5">
                <tr className="text-left">
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Produk
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Kategori
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Harga
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Terjual
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Rating
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-14 object-cover bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/48x56?text=?'
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-[10px] opacity-50 mt-0.5">
                            ID: #{p.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs opacity-70">
                      {p.category}
                    </td>
                    <td className="px-5 py-4 font-black">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-4 text-xs opacity-70">
                      {p.sold}
                    </td>
                    <td className="px-5 py-4 text-xs opacity-70">
                      ⭐ {p.rating}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="text-[10px] font-bold tracking-widest uppercase text-red-600 underline hover:opacity-60"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================
              MOBILE: CARD LIST
          ============================================ */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => (
              <div key={p.id} className="border border-black/10 p-4">
                <div className="flex gap-3 mb-3 pb-3 border-b border-black/10">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-20 object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/64x80?text=?'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-2 mb-1">
                      {p.name}
                    </p>
                    <p className="text-[10px] opacity-60 mb-1">
                      {p.category}
                    </p>
                    <p className="font-black text-sm">
                      Rp {p.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3 text-[10px]">
                  <span className="opacity-60">⭐ {p.rating}</span>
                  <span className="opacity-60">{p.sold} terjual</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="flex-1 text-[10px] font-bold tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="flex-1 text-[10px] font-bold tracking-widest uppercase border border-red-600 text-red-600 px-3 py-2 hover:bg-red-600 hover:text-white transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}