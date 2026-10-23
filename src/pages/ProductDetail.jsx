import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { analytics } from '../lib/analytics'
import { useCart } from '../context/CartContext'
import StarRating from '../components/StarRating'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // STATE BUAT NAMPILIN REVIEW
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const data = await api.getProduct(id)
        setProduct(data)
        analytics.productView(id)
        
        // Ambil data review
        const reviewData = await api.getReviews(id)
        setReviews(reviewData)
      } catch (err) {
        console.error('Error:', err)
        setProduct(null)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [id])

  if (loading) return <div className="py-32 text-center text-xs font-bold uppercase opacity-50">Loading...</div>
  if (!product) return <div className="py-32 text-center">Produk tidak ditemukan. <Link to="/shop" className="underline">Kembali</Link></div>

  const isOutOfStock = product.stock !== null && product.stock <= 0

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Link to="/shop" className="text-xs font-bold tracking-widest uppercase opacity-60 hover:opacity-100 mb-8 inline-block">← Back</Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16 mb-16">
        <div className={`aspect-[4/5] overflow-hidden bg-gray-100 ${isOutOfStock ? 'opacity-60' : ''}`}>
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">{product.category}</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">{product.name}</h1>

          <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase opacity-60 mb-8 pb-8 border-b border-black/10">
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating || 0} size="w-4 h-4" />
              <span className="mt-0.5">{product.rating}</span>
            </div>
            <span>•</span>
            <span>{reviews.length} Ulasan</span>
            <span>•</span>
            <span>{product.sold} terjual</span>
          </div>

          <p className="text-2xl md:text-3xl font-black mb-4">Rp {product.price.toLocaleString('id-ID')}</p>

          {product.stock !== null && (
            <p className={`text-xs font-bold tracking-widest uppercase mb-8 ${product.stock <= 0 ? 'text-red-600' : product.stock <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {product.stock <= 0 ? 'Stok Habis' : product.stock <= 10 ? `Tersisa ${product.stock} pcs` : `Stok: ${product.stock} pcs`}
            </p>
          )}

          <p className="text-sm md:text-base leading-relaxed opacity-70 mb-10">{product.description}</p>

          {isOutOfStock ? (
            <button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-xs font-bold uppercase cursor-not-allowed">Stok Habis</button>
          ) : (
            <button onClick={() => addToCart(product)} className="w-full bg-black text-white py-4 text-xs font-bold uppercase hover:bg-gray-800 transition">Add to Cart</button>
          )}
        </div>
      </div>

      {/* SECTION DAFTAR REVIEW */}
      <div className="border-t border-black/10 pt-10">
        <h2 className="text-xl font-black mb-6">Ulasan Pembeli ({reviews.length})</h2>
        
        {reviews.length === 0 ? (
          <p className="text-sm opacity-50 italic">Belum ada ulasan untuk produk ini.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="border border-black/10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm">{rev.customer_name}</p>
                  <StarRating rating={rev.rating} size="w-3 h-3" />
                </div>
                <p className="text-[10px] opacity-40 mb-3">{new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-sm opacity-80 leading-relaxed">{rev.review_text || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}