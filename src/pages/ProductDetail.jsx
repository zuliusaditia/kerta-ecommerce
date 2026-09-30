import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { analytics } from '../lib/analytics'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const data = await api.getProduct(id)
        setProduct(data)
        analytics.productView(id) // ← track product view
      } catch (err) {
        console.error('Error:', err)
        setProduct(null)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
          Produk tidak ditemukan
        </p>
        <Link to="/shop" className="text-sm font-bold underline">
          ← Kembali ke Shop
        </Link>
      </div>
    )
  }

  const handleAdd = () => {
    addToCart(product)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Link
        to="/shop"
        className="text-xs font-bold tracking-widest uppercase opacity-60 hover:opacity-100 mb-8 inline-block"
      >
        ← Back
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <div className="aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
            {product.category}
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase opacity-60 mb-8 pb-8 border-b border-black/10">
            <span>⭐ {product.rating}</span>
            <span>•</span>
            <span>{product.sold} terjual</span>
          </div>

          <p className="text-2xl md:text-3xl font-black mb-8">
            Rp {product.price.toLocaleString('id-ID')}
          </p>

          <p className="text-sm md:text-base leading-relaxed opacity-70 mb-10">
            {product.description}
          </p>

          <button
            onClick={handleAdd}
            className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition"
          >
            Add to Cart
          </button>

          <div className="mt-8 pt-8 border-t border-black/10 text-xs font-bold tracking-widest uppercase opacity-50 space-y-2">
            <p>✓ Free Shipping di atas Rp 500.000</p>
            <p>✓ 100% Original Product</p>
            <p>✓ Made in Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  )
}