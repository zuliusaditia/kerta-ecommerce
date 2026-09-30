import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts()
        setProducts(data.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch products:', err)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative h-[85vh] min-h-[600px] bg-black text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-16 md:pb-24">
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase mb-4 opacity-90">
            New Collection — 2026
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight max-w-3xl mb-8">
            SETIAP<br />JAHITAN<br />PUNYA CERITA.
          </h1>
          <Link
            to="/shop"
            className="inline-block self-start bg-white text-black px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white border border-white transition"
          >
            Enter the Drop →
          </Link>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-black text-white py-4 overflow-hidden border-y border-white/10">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12">
              <span className="text-xs font-bold tracking-widest uppercase">Free Shipping di atas Rp 500.000</span>
              <span className="text-xs font-bold tracking-widest uppercase">•</span>
              <span className="text-xs font-bold tracking-widest uppercase">Made in Indonesia</span>
              <span className="text-xs font-bold tracking-widest uppercase">•</span>
              <span className="text-xs font-bold tracking-widest uppercase">Premium Quality</span>
              <span className="text-xs font-bold tracking-widest uppercase">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">LATEST DROP</h2>
          <Link to="/shop" className="text-xs font-bold tracking-widest uppercase border-b-2 border-black pb-1 hover:opacity-60">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-4">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="text-sm font-bold tracking-tight mb-1 line-clamp-1">{p.name}</h3>
              <p className="text-xs tracking-wide opacity-60">Rp {p.price.toLocaleString('id-ID')}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-6 opacity-60">Our Philosophy</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-8">
            KERTA BUKAN SEKADAR NAMA.<br />INI ADALAH KARYA.
          </h2>
          <p className="text-base md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed mb-10">
            Setiap potong dibuat dengan teliti, dirancang untuk mereka yang berani tampil beda.
          </p>
          <Link to="/about" className="inline-block border border-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition">
            Our Story
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-10">SHOP BY CATEGORY</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Pakaian', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
            { name: 'Sepatu', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80' },
            { name: 'Headwear', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80' },
            { name: 'Aksesoris', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
          ].map((cat) => (
            <Link key={cat.name} to="/shop" className="relative aspect-[3/4] overflow-hidden group">
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-black tracking-tight uppercase">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}