import { Link } from 'react-router-dom'
// IMPORT KOMPONEN BINTANG
import StarRating from './StarRating'

export default function ProductCard({ product }) {
  const isOutOfStock = product.stock !== null && product.stock <= 0

  return (
    <Link to={`/product/${product.id}`} className="group block relative">
      {isOutOfStock && (
        <div className="absolute top-3 left-3 z-10 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
          Habis
        </div>
      )}

      <div className={`aspect-[4/5] overflow-hidden bg-gray-100 mb-3 relative ${isOutOfStock ? 'opacity-50' : ''}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <h3 className="text-sm font-bold tracking-tight mb-1 line-clamp-2 leading-snug">
        {product.name}
      </h3>
      
      {/* Harga dibikin lebih tegas */}
      <p className="text-sm font-black mb-2 opacity-90">
        Rp {product.price.toLocaleString('id-ID')}
      </p>

      {/* BARIS RATING & TERJUAL */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating || 0} size="w-3 h-3" />
          <span className="text-[10px] font-bold opacity-60 mt-0.5">
            {product.rating || 0}
          </span>
        </div>
        <p className="text-[10px] opacity-50 font-bold">
          {product.sold || 0} terjual
        </p>
      </div>
    </Link>
  )
}