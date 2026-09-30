import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Semua')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const data = await api.getProducts()
        setProducts(data)
      } catch (err) {
        console.error('Error:', err)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const categories = ['Semua', ...new Set(products.map((p) => p.category))]

  const filtered =
    category === 'Semua'
      ? products
      : products.filter((p) => p.category === category)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-3">Shop All</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">SEMUA PRODUK</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-10 border-b border-black/10 pb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition border ${
              category === c
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black/20 hover:border-black'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs font-bold tracking-widest uppercase opacity-50">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}