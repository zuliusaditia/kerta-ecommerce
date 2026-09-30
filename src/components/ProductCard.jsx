import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <h3 className="text-sm font-bold tracking-tight mb-1 line-clamp-2 leading-snug">
        {product.name}
      </h3>
      <p className="text-xs tracking-wide opacity-60">
        Rp {product.price.toLocaleString('id-ID')}
      </p>
    </Link>
  )
}