import { useState } from 'react'
import { api } from '../lib/api'
import StarRating from '../components/StarRating' // Import StarRating untuk tabel

export default function AdminProducts({ products, loading, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  // DAFTAR KATEGORI TETAP
  const CATEGORIES = ['Pakaian', 'Sepatu', 'Tas', 'Headwear', 'Aksesoris']

  const emptyForm = {
    name: '',
    price: '',
    image: '',
    category: 'Pakaian', 
    rating: 4.5,
    sold: 0,
    description: '',
    stock: 100, 
  }

  const [form, setForm] = useState(emptyForm)

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim()
    return !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
  })

  const startEdit = (product) => {
    setForm({ 
      ...product, 
      price: String(product.price), 
      stock: String(product.stock || 0),
      rating: String(product.rating || 4.5),
      sold: String(product.sold || 0)
    })
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
      stock: Number(form.stock), 
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

  const inputClass = 'w-full px-3 py-2.5 border border-black/20 focus:border-black focus:outline-none text-sm bg-white'
  const labelClass = 'block text-[10px] font-bold tracking-widest uppercase opacity-50 mb-2'

  if (loading) {
    return <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-black/10">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">Products</p>
          <p className="text-2xl font-black tracking-tight">{filteredProducts.length} <span className="opacity-40 text-lg">/ {products.length}</span></p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-3 pr-3 py-2.5 text-xs border border-black/20 focus:border-black focus:outline-none"
            />
          </div>
          <button onClick={startAdd} className="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-5 py-3 hover:bg-gray-800 transition whitespace-nowrap">
            + Tambah
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-black p-6 md:p-8 bg-black/[0.02]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/10">
            <p className="text-xl font-black tracking-tight">{editing ? 'Edit Produk' : 'Produk Baru'}</p>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm) }} className="text-xs font-bold tracking-widest uppercase opacity-60 hover:opacity-100">✕ Close</button>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Nama Produk *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Harga (Rp) *</label>
              <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
            </div>
            
            {/* UBAH KATEGORI JADI DROPDOWN */}
            <div>
              <label className={labelClass}>Kategori *</label>
              <select 
                required 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                className={inputClass}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>URL Gambar *</label>
              <input type="text" required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Stok *</label>
              <input type="number" required min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Jumlah Terjual</label>
              <input type="number" min="0" value={form.sold} onChange={(e) => setForm({ ...form, sold: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rating (0-5)</label>
              <input type="number" step="0.1" min="0" max="5" placeholder="4.5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Deskripsi *</label>
              <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-black/10">
            <button type="submit" className="text-xs font-bold tracking-widest uppercase bg-black text-white px-6 py-3 hover:bg-gray-800 transition">
              {editing ? 'Update Produk' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      )}

      {filteredProducts.length === 0 ? (
         <div className="border border-black/10 py-16 text-center text-xs opacity-50">Tidak ada produk.</div>
      ) : (
        <>
          <div className="hidden md:block border border-black/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10 bg-black/5">
                <tr className="text-left">
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Produk</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Harga</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-center">Rating</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-center">Stok</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-center">Terjual</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="px-5 py-4 flex items-center gap-3">
                      <img src={p.image} className="w-10 h-12 object-cover bg-gray-100" />
                      <span className="font-bold">{p.name}</span>
                    </td>
                    <td className="px-5 py-4 font-black">Rp {p.price.toLocaleString('id-ID')}</td>
                    
                    {/* GUNAKAN KOMPONEN STARRATING */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StarRating rating={p.rating || 0} />
                        <span className="text-[10px] font-bold opacity-60">{p.rating || 0}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        (p.stock || 0) <= 0 ? 'bg-red-100 text-red-800' : (p.stock || 0) <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {p.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold opacity-70">{p.sold || 0}</td>
                    
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => startEdit(p)} className="text-[10px] font-bold uppercase underline">Edit</button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="text-[10px] font-bold uppercase text-red-600 underline">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => (
              <div key={p.id} className="border border-black/10 p-4">
                <div className="flex gap-3 mb-3 pb-3 border-b border-black/10">
                  <img src={p.image} alt={p.name} className="w-16 h-20 object-cover bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-[10px] opacity-60 mb-1">{p.category}</p>
                    <p className="font-black text-sm">Rp {p.price.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-[10px] text-center bg-black/5 p-2">
                  <div className="flex flex-col items-center">
                    <span className="opacity-50 uppercase font-bold tracking-widest mb-1">Rating</span>
                    <StarRating rating={p.rating || 0} size="w-3 h-3" />
                  </div>
                  <div className="flex flex-col border-l border-black/10">
                    <span className="opacity-50 uppercase font-bold tracking-widest mb-1">Stok</span>
                    <span className={`font-bold ${
                        (p.stock || 0) <= 0 ? 'text-red-600' : (p.stock || 0) <= 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                      {p.stock ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-black/10">
                    <span className="opacity-50 uppercase font-bold tracking-widest mb-1">Terjual</span>
                    <span className="font-bold">{p.sold || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="flex-1 text-[10px] font-bold tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition">Edit</button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="flex-1 text-[10px] font-bold tracking-widest uppercase border border-red-600 text-red-600 px-3 py-2 hover:bg-red-600 hover:text-white transition">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}