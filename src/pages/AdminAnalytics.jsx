import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { api } from '../lib/api'

export default function AdminAnalytics() {
  const [range, setRange] = useState(7) // days
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [summaryData, productsData] = await Promise.all([
          api.getAnalyticsSummary(range),
          api.getProductAnalytics(range),
        ])
        setSummary(summaryData)
        setProducts(productsData)
      } catch (err) {
        console.error('Analytics fetch error:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [range])

  const RANGES = [
    { value: 1, label: 'Today' },
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
  ]

  if (loading && !summary) {
    return (
      <div className="py-32 text-center text-xs font-bold tracking-widest uppercase opacity-50">
        Loading analytics...
      </div>
    )
  }

  const chartData = (summary?.dailyTrend || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    }),
    views: d.views,
    visitors: d.visitors,
  }))

  // Conversion rate calculations
  const conversionRate =
    summary?.productViews > 0
      ? ((summary.addToCarts / summary.productViews) * 100).toFixed(1)
      : '0.0'

  const purchaseRate =
    summary?.addToCarts > 0
      ? ((summary.purchases / summary.addToCarts) * 100).toFixed(1)
      : '0.0'

  const STATS = [
    {
      label: 'Page Views',
      value: summary?.pageViews || 0,
      sub: 'Total kunjungan',
    },
    {
      label: 'Unique Visitors',
      value: summary?.uniqueVisitors || 0,
      sub: 'Pengunjung unik',
    },
    {
      label: 'Product Views',
      value: summary?.productViews || 0,
      sub: 'Lihat produk',
    },
    {
      label: 'Add to Cart',
      value: summary?.addToCarts || 0,
      sub: `${conversionRate}% dari product views`,
      highlight: true,
    },
    {
      label: 'Purchases',
      value: summary?.purchases || 0,
      sub: `${purchaseRate}% dari add to cart`,
      highlight: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ============================================
          HEADER + RANGE SELECTOR
      ============================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
            Analytics
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            Traffic & Conversion
          </h2>
        </div>

        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`text-[10px] font-bold tracking-widest uppercase px-4 py-2 border transition ${
                range === r.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================
          STATS GRID
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`border p-5 ${
              stat.highlight ? 'border-black' : 'border-black/10'
            }`}
          >
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-3">
              {stat.label}
            </p>
            <p className="text-3xl md:text-4xl font-black tracking-tight mb-1">
              {stat.value.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] opacity-50">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ============================================
          TRAFFIC CHART
      ============================================ */}
      <div className="border border-black/10 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-1">
              Traffic Trend
            </p>
            <p className="text-2xl font-black tracking-tight">
              {summary?.pageViews || 0}{' '}
              <span className="text-sm opacity-40">views</span>
            </p>
          </div>
          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-black" />
              <span className="font-bold tracking-widest uppercase opacity-60">
                Views
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400" />
              <span className="font-bold tracking-widest uppercase opacity-60">
                Visitors
              </span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-16 text-center text-xs opacity-50">
            Belum ada data traffic
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#000"
                  strokeOpacity={0.06}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeOpacity: 0.1 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#000' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ fill: '#000', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#999"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#999', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ============================================
          TOP PAGES + TOP REFERRERS
      ============================================ */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Pages */}
        <div className="border border-black/10 p-6">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-5">
            Top Pages
          </p>

          {!summary?.topPages || summary.topPages.length === 0 ? (
            <p className="text-xs opacity-50 py-8 text-center">
              Belum ada data
            </p>
          ) : (
            <div className="space-y-3">
              {summary.topPages.map((page, idx) => {
                const maxViews = summary.topPages[0]?.views || 1
                const pct = (page.views / maxViews) * 100
                return (
                  <div key={page.path}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold truncate">
                        <span className="opacity-30 mr-2">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {page.path}
                      </span>
                      <span className="text-xs font-black ml-2">
                        {page.views}
                      </span>
                    </div>
                    <div className="h-1 bg-black/5">
                      <div
                        className="h-full bg-black"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="border border-black/10 p-6">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50 mb-5">
            Traffic Sources
          </p>

          {!summary?.topReferrers || summary.topReferrers.length === 0 ? (
            <p className="text-xs opacity-50 py-8 text-center">
              Belum ada data
            </p>
          ) : (
            <div className="space-y-3">
              {summary.topReferrers.map((ref, idx) => {
                const maxCount = summary.topReferrers[0]?.count || 1
                const pct = (ref.count / maxCount) * 100
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold truncate">
                        {ref.source}
                      </span>
                      <span className="text-xs font-black ml-2">
                        {ref.count}
                      </span>
                    </div>
                    <div className="h-1 bg-black/5">
                      <div
                        className="h-full bg-black"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          PRODUCT PERFORMANCE TABLE
      ============================================ */}
      <div className="border border-black/10">
        <div className="px-6 py-5 border-b border-black/10 flex justify-between items-center">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-50">
            Product Performance ({range} hari)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 bg-black/5">
              <tr className="text-left">
                <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase">
                  Produk
                </th>
                <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-right">
                  Views
                </th>
                <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-right">
                  Add to Cart
                </th>
                <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-right">
                  Purchases
                </th>
                <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-right">
                  Conv. Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const convRate =
                  p.views > 0
                    ? ((p.add_to_carts / p.views) * 100).toFixed(1)
                    : '0.0'
                return (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-12 object-cover bg-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-[10px] opacity-50">
                            {p.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {p.views}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {p.add_to_carts}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {p.purchases}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-1 ${
                          convRate > 10
                            ? 'bg-green-100 text-green-800'
                            : convRate > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {convRate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CUSTOM TOOLTIP
// ============================================
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-black text-white px-3 py-2 text-[10px]">
      <p className="font-bold tracking-widest uppercase opacity-60 mb-1">
        {label}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} className="font-black">
          {entry.dataKey === 'views' ? 'Views' : 'Visitors'}:{' '}
          {entry.value}
        </p>
      ))}
    </div>
  )
}