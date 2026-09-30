import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export default function AdminDashboard({ orders, products, loading, onNavigate }) {
  const { user } = useAuthSafe() // kita pakai useAuth di parent, jadi skip ini

  // ============================================
  // HITUNG STATISTIK
  // ============================================
  const completedOrders = orders.filter((o) => o.status !== 'cancelled')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0
  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  // Chart: 7 hari terakhir
  const chartData = buildChartData(orders)

  // Top products (by sold count, dari semua order items)
  const topProducts = buildTopProducts(orders)

  // Order status breakdown
  const statusCounts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============================================
          WELCOME HEADER
      ============================================ */}
      <div className="border border-black/10 p-6 md:p-8 bg-black text-white">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-3">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
          Welcome back,
          <br />
          {user?.name || 'Admin'} 👋
        </h2>
        <p className="text-sm opacity-60 mt-4 max-w-lg">
          Ini ringkasan performa KERTA® hari ini. Ada{' '}
          <span className="font-bold text-white">{pendingOrders} pesanan</span> yang
          menunggu untuk diproses.
        </p>
      </div>

      {/* ============================================
          STATS GRID
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`Rp ${formatCompact(totalRevenue)}`}
          sub="Dari semua pesanan"
          trend="+12%"
          trendUp
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          sub={`${pendingOrders} pending`}
          trend="+8%"
          trendUp
        />
        <StatCard
          label="Products"
          value={products.length}
          sub="Produk aktif"
        />
        <StatCard
          label="Avg. Order"
          value={`Rp ${formatCompact(avgOrder)}`}
          sub="Per transaksi"
          trend="+3%"
          trendUp
        />
      </div>

      {/* ============================================
          CHART + STATUS BREAKDOWN
      ============================================ */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 border border-black/10 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
                Sales Performance
              </p>
              <p className="text-2xl font-black tracking-tight">
                Rp {formatCompact(chartData.reduce((s, d) => s + d.revenue, 0))}
              </p>
              <p className="text-[10px] opacity-50 mt-1">7 hari terakhir</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60"
            >
              View Orders →
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.06} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeOpacity: 0.1 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v === 0 ? '0' : `${v / 1000}k`)}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: '#000', fillOpacity: 0.04 }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#000"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="border border-black/10 p-6">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
            Order Status
          </p>
          <p className="text-2xl font-black tracking-tight mb-6">
            {orders.length} total
          </p>

          <div className="space-y-3">
            <StatusRow
              label="Pending"
              count={statusCounts.pending}
              total={orders.length}
              color="bg-yellow-500"
            />
            <StatusRow
              label="Shipped"
              count={statusCounts.shipped}
              total={orders.length}
              color="bg-blue-500"
            />
            <StatusRow
              label="Completed"
              count={statusCounts.completed}
              total={orders.length}
              color="bg-green-600"
            />
            <StatusRow
              label="Cancelled"
              count={statusCounts.cancelled}
              total={orders.length}
              color="bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* ============================================
          RECENT ORDERS + TOP PRODUCTS
      ============================================ */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 border border-black/10 p-6">
          <div className="flex justify-between items-end mb-5">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
              Recent Orders
            </p>
            <button
              onClick={() => onNavigate('orders')}
              className="text-[10px] font-bold tracking-widest uppercase underline hover:opacity-60"
            >
              View All →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs opacity-50 py-8 text-center">
              Belum ada pesanan
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.order_code}
                  to={`/order/${order.order_code}`}
                  className="flex items-center gap-4 py-3 border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition px-2 -mx-2"
                >
                  {/* Status Dot */}
                  <div className="flex-shrink-0">
                    <StatusDot status={order.status} />
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold tracking-tight truncate">
                      {order.order_code}
                    </p>
                    <p className="text-[10px] opacity-60 truncate">
                      {order.customer_name} • {order.city}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black">
                      Rp {formatCompact(order.total)}
                    </p>
                    <p className="text-[10px] opacity-60">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="border border-black/10 p-6">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-5">
            Top Products
          </p>

          {topProducts.length === 0 ? (
            <p className="text-xs opacity-50 py-8 text-center">
              Belum ada penjualan
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black opacity-30 w-4">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-12 object-cover bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-[10px] opacity-60">
                      {item.qty} terjual
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ label, value, sub, trend, trendUp }) {
  return (
    <div className="border border-black/10 p-5">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
          {label}
        </p>
        {trend && (
          <span
            className={`text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 ${
              trendUp
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-black tracking-tight mb-1 truncate">
        {value}
      </p>
      {sub && <p className="text-[10px] opacity-50">{sub}</p>}
    </div>
  )
}

function StatusRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${color}`} />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {label}
          </span>
        </div>
        <span className="text-xs font-black">
          {count} <span className="opacity-40">({pct}%)</span>
        </span>
      </div>
      <div className="h-1 bg-black/5">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusDot({ status }) {
  const colors = {
    pending: 'bg-yellow-500',
    shipped: 'bg-blue-500',
    completed: 'bg-green-600',
    cancelled: 'bg-red-500',
  }
  return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-black text-white px-3 py-2 text-[10px]">
      <p className="font-bold tracking-widest uppercase opacity-60 mb-1">
        {data.fullDate}
      </p>
      <p className="font-black text-sm">
        Rp {data.revenue.toLocaleString('id-ID')}
      </p>
      <p className="opacity-60 mt-0.5">{data.orders} pesanan</p>
    </div>
  )
}

// ============================================
// HELPERS
// ============================================
function formatCompact(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`
  return num.toLocaleString('id-ID')
}

function buildChartData(orders) {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const last7Days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    last7Days.push({
      date: date.toISOString().split('T')[0],
      day: days[date.getDay()],
      fullDate: date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      }),
      revenue: 0,
      orders: 0,
    })
  }

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at).toISOString().split('T')[0]
    const day = last7Days.find((d) => d.date === orderDate)
    if (day && order.status !== 'cancelled') {
      day.revenue += order.total
      day.orders += 1
    }
  })

  return last7Days
}

function buildTopProducts(orders) {
  const productMap = {}

  orders.forEach((order) => {
    if (order.status === 'cancelled') return
    order.items?.forEach((item) => {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = {
          name: item.product_name,
          image: item.product_image,
          qty: 0,
        }
      }
      productMap[item.product_name].qty += item.qty
    })
  })

  return Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
}

// Dummy placeholder (gak dipakai)
function useAuthSafe() {
  return { user: null }
}