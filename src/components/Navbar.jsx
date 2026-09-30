import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { totalItems, openCart } = useCart()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-black/10">
        <div className="grid grid-cols-3 items-center px-4 md:px-8 h-16">
          {/* KIRI: Hamburger + Menu Desktop */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMenuOpen(true)}
              className="hover:opacity-60 transition"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>

            <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest uppercase">
              <NavLink to="/shop" className="hover:opacity-60 transition">Shop</NavLink>
              <NavLink to="/about" className="hover:opacity-60 transition">About</NavLink>
              <NavLink to="/contact" className="hover:opacity-60 transition">Contact</NavLink>
            </div>
          </div>

          {/* TENGAH: Logo */}
          <div className="flex justify-center">
            <Link to="/" className="text-2xl md:text-3xl font-black tracking-tight">
              KERTA<sup className="text-xs align-super">®</sup>
            </Link>
          </div>

          {/* KANAN: Icons */}
          <div className="flex items-center justify-end gap-4">
            <button className="hidden md:block hover:opacity-60 transition" aria-label="Search">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {/* User Icon — 3-state */}
            {user ? (
              <Link
                to={user.type === 'admin' ? '/admin' : '/account'}
                className="text-xs font-bold tracking-widest uppercase hover:opacity-60 transition"
              >
                {user.type === 'admin' ? 'Admin' : 'Account'}
              </Link>
            ) : (
              <Link to="/login" className="hover:opacity-60 transition" aria-label="Login">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative hover:opacity-60 transition"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* SIDEBAR MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setMenuOpen(false)}
            className="flex-1 bg-black/40"
          />

          <div className="w-full max-w-md bg-white h-full p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-12">
              <span className="text-xs font-bold tracking-widest uppercase">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-xs font-bold tracking-widest uppercase hover:opacity-60"
              >
                Close ✕
              </button>
            </div>

            <nav className="space-y-1">
              {[
                { label: 'Sale 30%', to: '/shop', accent: true },
                { label: 'T-Shirt', to: '/shop' },
                { label: 'Hoodie & Jacket', to: '/shop' },
                { label: 'Footwear', to: '/shop' },
                { label: 'Headwear', to: '/shop' },
                { label: 'Accessories', to: '/shop' },
                { label: 'Collaboration', to: '/shop' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-3xl font-black tracking-tight py-2 hover:opacity-60 transition ${
                    item.accent ? 'text-red-600' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-12 pt-8 border-t border-black/10">
              <p className="text-xs font-bold tracking-widest uppercase mb-4 opacity-50">More</p>
              <nav className="space-y-1">
                <Link
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className="block text-2xl font-bold py-1 hover:opacity-60"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="block text-2xl font-bold py-1 hover:opacity-60"
                >
                  Contact
                </Link>
                {user ? (
                  <Link
                    to={user.type === 'admin' ? '/admin' : '/account'}
                    onClick={() => setMenuOpen(false)}
                    className="block text-2xl font-bold py-1 hover:opacity-60"
                  >
                    {user.type === 'admin' ? 'Admin Panel' : 'My Account'}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block text-2xl font-bold py-1 hover:opacity-60"
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}