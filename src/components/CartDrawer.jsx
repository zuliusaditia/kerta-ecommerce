import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQty,
    totalPrice,
  } = useCart()

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-black/10">
          <h2 className="text-xs font-bold tracking-widest uppercase">
            Your Bag ({cart.reduce((s, i) => s + i.qty, 0)})
          </h2>
          <button
            onClick={closeCart}
            className="text-xs font-bold tracking-widest uppercase hover:opacity-60 transition"
          >
            Close
          </button>
        </div>

        {/* Items */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-6">
              Your bag is empty
            </p>
            <button
              onClick={closeCart}
              className="text-sm font-bold underline hover:opacity-60"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold tracking-tight leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] font-bold tracking-widest uppercase text-red-600 hover:opacity-60 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs opacity-60 mb-3">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>

                    {/* Qty Control */}
                    <div className="inline-flex items-center border border-black/20">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm hover:bg-black hover:text-white transition"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-xs font-bold">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm hover:bg-black hover:text-white transition"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-black/10 px-6 py-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold tracking-widest uppercase">
                  Subtotal
                </span>
                <span className="text-lg font-black">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <p className="text-[10px] tracking-widest uppercase opacity-50 mb-4 text-center">
                Shipping & taxes calculated at checkout
              </p>

              <Link
                to="/checkout"
                onClick={closeCart}
                className="block text-center w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}