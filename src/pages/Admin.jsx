import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import AdminDashboard from './AdminDashboard'
import AdminAnalytics from './AdminAnalytics'
import AdminOrders from './AdminOrders'
import AdminProducts from './AdminProducts'
import AdminChat from './AdminChat'
import AdminShipping from './AdminShipping'

const MENU_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'analytics', label: 'Analytics', icon: 'chart' },
  { key: 'orders', label: 'Orders', icon: 'package' },
  { key: 'products', label: 'Products', icon: 'tag' },
  { key: 'shipping', label: 'Shipping', icon: 'truck' },
  { key: 'messages', label: 'Messages', icon: 'chat' },
]

const ICONS = {
  grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  package: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  tag: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  ),
  truck: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
}

export default function Admin() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ordersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
      ])
      setOrders(ordersData)
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to fetch:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* SIDEBAR Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-black/10 flex-shrink-0 sticky top-0 h-screen">
        <div className="h-20 flex items-center px-6 border-b border-black/10">
          <Link to="/" className="text-2xl font-black tracking-tight">
            KERTA<sup className="text-[10px] align-super">®</sup>
          </Link>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          <p className="px-6 text-[10px] font-bold tracking-widest uppercase opacity-40 mb-3">
            Menu
          </p>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-bold tracking-tight transition border-l-2 ${
                active === item.key
                  ? 'bg-black text-white border-black'
                  : 'text-black border-transparent hover:bg-black/5'
              }`}
            >
              {ICONS[item.icon]}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-black/10">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-2">
            Signed in as
          </p>
          <p className="text-xs font-bold truncate mb-1">{user?.name || 'Admin'}</p>
          <p className="text-[10px] opacity-60 truncate mb-4">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full text-[10px] font-bold tracking-widest uppercase border border-black/20 px-3 py-2 hover:bg-black hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setSidebarOpen(false)}
            className="flex-1 bg-black/40"
          />
          <aside className="w-64 bg-white h-full flex flex-col">
            <div className="h-20 flex items-center justify-between px-6 border-b border-black/10">
              <Link to="/" className="text-2xl font-black tracking-tight">
                KERTA<sup className="text-[10px] align-super">®</sup>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-xs font-bold tracking-widest uppercase opacity-60"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 py-6">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActive(item.key)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-bold tracking-tight transition border-l-2 ${
                    active === item.key
                      ? 'bg-black text-white border-black'
                      : 'text-black border-transparent hover:bg-black/5'
                  }`}
                >
                  {ICONS[item.icon]}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-black/10">
              <p className="text-[10px] opacity-60 truncate mb-3">{user?.email}</p>
              <button
                onClick={handleSignOut}
                className="w-full text-[10px] font-bold tracking-widest uppercase border border-black/20 px-3 py-2 hover:bg-black hover:text-white transition"
              >
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0">
        <header className="h-20 border-b border-black/10 flex items-center justify-between px-4 md:px-8 sticky top-0 bg-white z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden hover:opacity-60 transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                Admin
              </p>
              <h1 className="text-xl font-black tracking-tight capitalize">
                {active}
              </h1>
            </div>
          </div>

          <Link
            to="/"
            className="hidden md:block text-xs font-bold tracking-widest uppercase underline hover:opacity-60"
          >
            ← View Store
          </Link>
        </header>

        <main className="p-4 md:p-8">
          {active === 'overview' && (
            <AdminDashboard
              user={user}
              orders={orders}
              products={products}
              loading={loading}
              onNavigate={setActive}
            />
          )}

          {active === 'analytics' && <AdminAnalytics />}

          {active === 'orders' && (
            <AdminOrders
              orders={orders}
              loading={loading}
              onUpdate={fetchAll}
            />
          )}

          {active === 'products' && (
            <AdminProducts
              products={products}
              loading={loading}
              onUpdate={fetchAll}
            />
          )}

          {active === 'shipping' && <AdminShipping />}

          {active === 'messages' && <AdminChat />}
        </main>
      </div>
    </div>
  )
}