// ============================================
// KERTA® API SERVER
// Express + Neon PostgreSQL + Gmail SMTP + Mengantar
// ============================================

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'
import nodemailer from 'nodemailer'

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ============================================
// DATABASE
// ============================================
const sql = neon(process.env.NEON_DATABASE_URL)

// ============================================
// MAILER (Gmail SMTP)
// ============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

transporter.verify((error) => {
  if (error) {
    console.error('❌ Gmail SMTP error:', error.message)
  } else {
    console.log('✅ Gmail SMTP ready to send emails')
  }
})

// ============================================
// SHIPPING CONFIG (Mengantar)
// ============================================
const MENGANTAR_KEY = process.env.MENGANTAR_API_KEY
const MENGANTAR_BASE =
  process.env.MENGANTAR_BASE_URL || 'https://sandbox.mengantar.com'
const MENGANTAR_ORIGIN_ID = process.env.MENGANTAR_ORIGIN_ID
const MENGANTAR_PICKUP_ADDRESS_ID = process.env.MENGANTAR_PICKUP_ADDRESS_ID

const COURIER_CONFIG = {
  jne: { mengantarKey: 'JNE', name: 'JNE', service: 'Reguler' },
  sicepat: { mengantarKey: 'SiCepat', name: 'SiCepat', service: 'Reguler' },
  sap: { mengantarKey: 'SAP', name: 'SAP Express', service: 'Reguler' },
  ide: { mengantarKey: 'iDexpress', name: 'iDexpress', service: 'Reguler' },
  jnt: { mengantarKey: 'JT', name: 'J&T Express', service: 'Reguler' },
  lion: { mengantarKey: 'lion', name: 'Lion Parcel', service: 'Reguler' },
  anteraja: { mengantarKey: 'anteraja', name: 'AnterAja', service: 'Reguler' },
  spx: { mengantarKey: 'spx', name: 'Shopee Express', service: 'Reguler' },
  pos: { mengantarKey: 'pos', name: 'POS Indonesia', service: 'Reguler' },
}

const ALL_COURIERS = Object.entries(COURIER_CONFIG).map(([code, cfg]) => ({
  code,
  name: cfg.name,
}))

// ============================================
// IN-MEMORY CACHE
// ============================================
const cache = new Map()

const CACHE_TTL = {
  areas: 24 * 60 * 60 * 1000,
  rates: 15 * 60 * 1000,
}

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value, ttl) {
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

function cacheClear(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key)
  }
}

// ============================================
// MENGANTAR HELPER (DENGAN TIMEOUT)
// ============================================
async function mengantarRequest(path, options = {}) {
  const url = `${MENGANTAR_BASE}${path}`
  
  // REM DARURAT: Batalkan request kalau lebih dari 10 detik
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    clearTimeout(timeoutId) // Kalau sukses cepet, matikan timer
    const data = await res.json()

    if (!res.ok || data.success === false) {
      console.error('🔴 Mengantar error response:')
      console.error(JSON.stringify(data, null, 2))

      const details = [
        data.message,
        ...(data.errors || []),
        ...(data.errorsFront || []),
      ]
        .filter(Boolean)
        .join(' | ')

      throw new Error(details || 'Mengantar request failed')
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Koneksi ke Mengantar timeout. Server mereka sedang lambat.')
    }
    throw err
  }
}

function normalizeRates(mengantarData, activeCouriers) {
  const rates = []

  for (const [code, cfg] of Object.entries(COURIER_CONFIG)) {
    if (activeCouriers && !activeCouriers.includes(code)) continue

    const raw = mengantarData[cfg.mengantarKey]
    if (!raw) continue
    if (raw.unsupported === true) continue

    const finalPrice =
      raw.estimatedSpecialPrice ?? raw.estimatedPrice ?? raw.price ?? 0
    const originalPrice = raw.price ?? finalPrice
    const discount = raw.discount ?? 0
    const discountPercent = raw.discountPercent ?? 0

    rates.push({
      code,
      name: cfg.name,
      service: cfg.service,
      price: finalPrice,
      originalPrice,
      discount,
      discountPercent,
      estimatedDate: raw.estimatedDate || raw.estimate_delivery || '-',
      supportsCOD: raw.unsupported_cod !== true,
    })
  }

  return rates.sort((a, b) => a.price - b.price)
}

function mapMengantarStatus(status) {
  if (!status) return 'shipped'
  const s = String(status).toLowerCase()
  if (s.includes('dijemput')) return 'shipped'
  if (s.includes('dikirim') || s.includes('transit')) return 'shipped'
  if (s.includes('selesai') || s.includes('diterima')) return 'completed'
  if (s.includes('batal') || s.includes('gagal')) return 'cancelled'
  return 'shipped'
}

// ============================================
// HELPERS
// ============================================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function getCustomer(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)

  const [session] = await sql`
    SELECT cs.customer_id, c.email, c.name, c.phone
    FROM customer_sessions cs
    JOIN customers c ON c.id = cs.customer_id
    WHERE cs.token = ${token} AND cs.expires_at > NOW()
  `
  return session || null
}

function buildOtpEmail(code) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
      <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 8px; color: #000;">KERTA®</h1>
      <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888; margin: 0 0 40px;">Premium Streetwear</p>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #000;">Kode Login Kamu</h2>
      <p style="font-size: 14px; color: #666; margin: 0 0 32px; line-height: 1.6;">
        Masukkan kode di bawah ini untuk login ke akun KERTA kamu.
      </p>
      <div style="background: #000; color: #fff; padding: 24px; text-align: center; margin: 0 0 32px;">
        <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; color: #fff;">${code}</p>
      </div>
      <p style="font-size: 12px; color: #999; line-height: 1.6; margin: 0 0 8px;">
        Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan ke siapapun.
      </p>
      <p style="font-size: 12px; color: #999; line-height: 1.6; margin: 0;">
        Kalau kamu tidak meminta kode ini, abaikan saja email ini.
      </p>
    </div>
  `
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    await sql`SELECT 1`
    res.json({ status: 'ok', database: 'connected', shipping: 'mengantar' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// ============================================
// PRODUCTS
// ============================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id ASC`
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [product] = await sql`SELECT * FROM products WHERE id = ${id}`
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, image, category, rating, sold, description } = req.body
    const [product] = await sql`
      INSERT INTO products (name, price, image, category, rating, sold, description)
      VALUES (${name}, ${price}, ${image}, ${category}, ${rating || 4.5}, ${sold || 0}, ${description})
      RETURNING *
    `
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, image, category, rating, sold, description } = req.body
    const [product] = await sql`
      UPDATE products SET
        name = ${name}, price = ${price}, image = ${image},
        category = ${category}, rating = ${rating}, sold = ${sold},
        description = ${description}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    await sql`DELETE FROM products WHERE id = ${id}`
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// ADMIN AUTH
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await sql`SELECT * FROM verify_admin(${email}, ${password})`
    if (result.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    res.json({ user: { ...result[0], type: 'admin' } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// CUSTOMER AUTH (OTP)
// ============================================
app.post('/api/customer/send-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email tidak valid' })
    }

    await sql`DELETE FROM otp_codes WHERE email = ${email}`

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await sql`
      INSERT INTO otp_codes (email, code, expires_at)
      VALUES (${email}, ${code}, ${expiresAt.toISOString()})
    `

    await transporter.sendMail({
      from: `"KERTA" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Kode Login KERTA® — ${code}`,
      html: buildOtpEmail(code),
    })

    console.log(`✅ OTP sent to ${email}`)
    res.json({ success: true, message: 'Kode OTP sudah dikirim ke email kamu.' })
  } catch (err) {
    console.error('send-otp error:', err)
    res.status(500).json({ error: 'Gagal mengirim email: ' + err.message })
  }
})

app.post('/api/customer/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ error: 'Email dan kode wajib diisi' })
    }

    const [otp] = await sql`
      SELECT * FROM otp_codes
      WHERE email = ${email} AND code = ${code}
        AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `

    if (!otp) {
      return res.status(401).json({ error: 'Kode tidak valid atau kadaluarsa' })
    }

    await sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otp.id}`

    let [customer] = await sql`SELECT * FROM customers WHERE email = ${email}`
    if (!customer) {
      [customer] = await sql`INSERT INTO customers (email) VALUES (${email}) RETURNING *`
    }

    const token = generateToken()
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO customer_sessions (token, customer_id, expires_at)
      VALUES (${token}, ${customer.id}, ${sessionExpiry.toISOString()})
    `

    await sql`DELETE FROM otp_codes WHERE email = ${email}`

    res.json({
      user: {
        id: customer.id, email: customer.email,
        name: customer.name, phone: customer.phone,
        type: 'customer',
      },
      token,
    })
  } catch (err) {
    console.error('verify-otp error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/customer/me', async (req, res) => {
  try {
    const customer = await getCustomer(req)
    if (!customer) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ ...customer, type: 'customer' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/customer/me', async (req, res) => {
  try {
    const customer = await getCustomer(req)
    if (!customer) return res.status(401).json({ error: 'Unauthorized' })

    const { name, phone } = req.body
    const [updated] = await sql`
      UPDATE customers SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone)
      WHERE id = ${customer.customer_id}
      RETURNING *
    `
    res.json({ ...updated, type: 'customer' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/customer/logout', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7)
      await sql`DELETE FROM customer_sessions WHERE token = ${token}`
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/customer/orders', async (req, res) => {
  try {
    const customer = await getCustomer(req)
    if (!customer) return res.status(401).json({ error: 'Unauthorized' })

    const orders = await sql`
      SELECT * FROM orders
      WHERE customer_email = ${customer.email}
      ORDER BY created_at DESC
    `

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // UPDATE QUERY: Cek apakah produk udah di-review di order ini
        const items = await sql`
          SELECT oi.*, 
            (SELECT COUNT(*) FROM reviews r WHERE r.order_id = oi.order_id AND r.product_id = oi.product_id) > 0 AS is_reviewed
          FROM order_items oi
          WHERE oi.order_id = ${order.id}
        `
        return { ...order, items }
      })
    )

    res.json(ordersWithItems)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// ORDERS
// ============================================
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/orders/:code', async (req, res) => {
  try {
    const { code } = req.params
    const [order] = await sql`SELECT * FROM orders WHERE order_code = ${code}`
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' })

    const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`
    res.json({ ...order, items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const {
      order_code, customer_name, customer_phone, customer_email,
      address, city, postal_code, payment_method,
      subtotal, shipping_cost, total, items,
      courier_code, courier_service, courier_name,
      notes,
      destination_area_id,
    } = req.body

    // ============================================
    // TAMBAHAN: VALIDASI STOK
    // ============================================
    for (const item of items) {
      const [product] = await sql`
        SELECT id, name, stock FROM products WHERE id = ${item.product_id}
      `
      if (!product) {
        return res.status(400).json({ 
          error: `Produk tidak ditemukan: ${item.product_name}` 
        })
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ 
          error: `Stok "${product.name}" tidak cukup. Tersisa ${product.stock}.` 
        })
      }
    }

    const customer = await getCustomer(req)
    const customerId =
      customer?.email === customer_email ? customer.customer_id : null

    const [order] = await sql`
      INSERT INTO orders (
        order_code, customer_name, customer_phone, customer_email,
        address, city, postal_code, payment_method,
        subtotal, shipping_cost, total, status, customer_id,
        courier_code, courier_service, courier_name, notes,
        destination_area_id
      )
      VALUES (
        ${order_code}, ${customer_name}, ${customer_phone}, ${customer_email || null},
        ${address}, ${city}, ${postal_code || ''}, ${payment_method},
        ${subtotal}, ${shipping_cost}, ${total}, 'pending', ${customerId},
        ${courier_code || null}, ${courier_service || null}, ${courier_name || null},
        ${notes || null},
        ${destination_area_id || null}
      )
      RETURNING *
    `

    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, price, qty)
        VALUES (${order.id}, ${item.product_id}, ${item.product_name}, ${item.product_image}, ${item.price}, ${item.qty})
      `
    }

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
//CODE STATUS UPDATE
// ===========================================

app.patch('/api/orders/:code/status', async (req, res) => {
  try {
    const { code } = req.params
    const { status } = req.body

    // 1. Ambil order lama
    const [oldOrder] = await sql`SELECT * FROM orders WHERE order_code = ${code}`
    if (!oldOrder) return res.status(404).json({ error: 'Order tidak ditemukan' })

    // 2. Ambil items buat update stok
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${oldOrder.id}`

    let stockReduced = oldOrder.stock_reduced

    // ============================================
    // LOGIKA STOK & TERJUAL
    // ============================================
    
    // A. Kalau baru di-shipped dan stok BELUM dikurangi -> Kurangi Stok & Tambah Terjual
    if (status === 'shipped' && !stockReduced) {
      for (const item of items) {
        if (item.product_id) {
          await sql`
            UPDATE products 
            SET stock = GREATEST(0, stock - ${item.qty}),
                sold = sold + ${item.qty}
            WHERE id = ${item.product_id}
          `
        }
      }
      stockReduced = true
      console.log(`📦 Stock & Sold updated for order ${code}`)
    }

    // B. Kalau di-cancelled dan stok UDAH dikurangi -> Balikin Stok & Kurangi Terjual
    if (status === 'cancelled' && stockReduced) {
      for (const item of items) {
        if (item.product_id) {
          await sql`
            UPDATE products 
            SET stock = stock + ${item.qty},
                sold = GREATEST(0, sold - ${item.qty})
            WHERE id = ${item.product_id}
          `
        }
      }
      stockReduced = false
      console.log(`↩️ Stock & Sold returned for order ${code}`)
    }

    // 3. Update status order
    const [order] = await sql`
      UPDATE orders SET 
        status = ${status}, 
        stock_reduced = ${stockReduced},
        updated_at = NOW()
      WHERE order_code = ${code}
      RETURNING *
    `

    res.json(order)
  } catch (err) {
    console.error('Update status error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// ADMIN: AUTO-CREATE ORDER KE MENGANTAR
// ============================================
app.post('/api/admin/orders/:code/ship', async (req, res) => {
  try {
    const { code } = req.params
    // Tangkap inputan dari frontend
    const { pickup_date, pickup_time } = req.body 

    const [order] = await sql`SELECT * FROM orders WHERE order_code = ${code}`
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' })

    if (order.tracking_number) {
      return res.status(400).json({ error: 'Order sudah punya resi' })
    }

    if (!order.courier_code || !order.destination_area_id) {
      return res.status(400).json({
        error: 'Order tidak punya info kurir atau area tujuan',
      })
    }

    const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`

    const cfg = COURIER_CONFIG[order.courier_code]
    if (!cfg) {
      return res.status(400).json({ error: 'Kurir tidak dikenali' })
    }

    const totalQty = items.reduce((sum, i) => sum + i.qty, 0)
    const totalWeight = totalQty 

    // ============================================
    // LOGIKA PICKUP (SPX & AnterAja)
    // ============================================
    const needsPickup = ['spx', 'anteraja'].includes(order.courier_code)
    let pickupData = {}

    if (needsPickup) {
      // Fallback kalau admin gak milih tanggal/jam
      let finalDate = pickup_date
      let finalTime = pickup_time || '14:00'

      if (!finalDate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
        const dd = String(tomorrow.getDate()).padStart(2, '0')
        const yyyy = tomorrow.getFullYear()
        finalDate = `${mm}-${dd}-${yyyy}`
      }

      console.log(`⏳ Requesting time_id for date: ${finalDate} at ${finalTime}...`)

      const timeResponse = await mengantarRequest(`/api/public/${MENGANTAR_KEY}/time`, {
        method: 'POST',
        body: JSON.stringify({
          address_id: MENGANTAR_PICKUP_ADDRESS_ID,
          date: finalDate, // <--- Pakai dari admin
          time: finalTime  // <--- Pakai dari admin
        })
      })

      console.log('✅ Time ID Response:', JSON.stringify(timeResponse))

      const validTimeId = timeResponse.data?._id || timeResponse.data?.id
      if (!validTimeId) throw new Error('Gagal mendapatkan time_id dari Mengantar')

      pickupData = {
        type: 'scheduledPickup',
        volume: 'volumeMotor',
        address_id: MENGANTAR_PICKUP_ADDRESS_ID,
        time_id: validTimeId,
      }
    } else {
      pickupData = {
        type: 'dropOff',
        volume: 'volumeMotor',
        address_id: MENGANTAR_PICKUP_ADDRESS_ID,
      }
    }

    const payload = {
      courier: cfg.mengantarKey,
      pickup: pickupData, 
      orders: [
        {
          assignee: '',
          goodsValue: order.total,
          customerAddress: order.address,
          customerName: order.customer_name,
          customerAddressDataId: order.destination_area_id,
          customerPhone: order.customer_phone,
          parcelContent: items.map((i) => i.product_name).join(', '),
          destinationMark: '',
          deliveryInstruction: order.notes || '',
          dontIncludeSubdistrict: false,
          weight: totalWeight,
          quantity: totalQty,
          customProducts: items.map((i) => ({
            name: i.product_name,
            variant: '-',
            qty: i.qty,
            weight: 1,
            price: i.price,
          })),
        },
      ],
    }

    console.log('📤 Sending to Mengantar (Create Order):')
    console.log(JSON.stringify(payload, null, 2))

    const data = await mengantarRequest(`/api/public/${MENGANTAR_KEY}/order`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const firstOrder = data.data?.[0]
    if (!firstOrder) {
      return res.status(500).json({ error: 'Mengantar tidak return order data' })
    }

    const trackingNumber = firstOrder.cnote_no
    const mengantarOrderId = firstOrder.ORDER_ID
    const mengantarBatchId = firstOrder.batch_id || firstOrder.batch

    const [updated] = await sql`
      UPDATE orders SET
        tracking_number = ${trackingNumber},
        mengantar_order_id = ${mengantarOrderId},
        mengantar_batch_id = ${mengantarBatchId},
        status = 'shipped',
        updated_at = NOW()
      WHERE order_code = ${code}
      RETURNING *
    `

    console.log(`📦 Mengantar order created: ${code} → ${trackingNumber}`)
    res.json({ success: true, order: updated })
  } catch (err) {
    console.error('Ship order error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Manual update resi
app.patch('/api/orders/:code/tracking', async (req, res) => {
  try {
    const { code } = req.params
    const { tracking_number, courier_code } = req.body

    if (!tracking_number || !courier_code) {
      return res
        .status(400)
        .json({ error: 'tracking_number dan courier_code wajib' })
    }

    const [order] = await sql`
      UPDATE orders SET
        tracking_number = ${tracking_number},
        courier_code = ${courier_code.toLowerCase()},
        status = 'shipped',
        updated_at = NOW()
      WHERE order_code = ${code}
      RETURNING *
    `

    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// CHAT WIDGET
// ============================================
app.post('/api/chat/conversations', async (req, res) => {
  try {
    const { customer_name, customer_email } = req.body
    const customer = await getCustomer(req)
    const customerId = customer?.customer_id || null

    const [conv] = await sql`
      INSERT INTO chat_conversations (customer_id, customer_name, customer_email, status)
      VALUES (${customerId}, ${customer_name || null}, ${customer_email || null}, 'bot')
      RETURNING *
    `
    res.status(201).json(conv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/chat/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [conv] = await sql`SELECT * FROM chat_conversations WHERE id = ${id}`
    if (!conv) return res.status(404).json({ error: 'Percakapan tidak ditemukan' })

    const messages = await sql`
      SELECT * FROM chat_messages WHERE conversation_id = ${id} ORDER BY created_at ASC
    `
    res.json({ ...conv, messages })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/chat/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    const { sender_type, sender_name, message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' })
    }

    const [msg] = await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message)
      VALUES (${id}, ${sender_type || 'customer'}, ${sender_name || null}, ${message.trim()})
      RETURNING *
    `

    await sql`UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ${id}`
    res.status(201).json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/chat/conversations/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params
    const [conv] = await sql`
      UPDATE chat_conversations SET status = 'waiting_admin', last_message_at = NOW()
      WHERE id = ${id} RETURNING *
    `
    if (!conv) return res.status(404).json({ error: 'Percakapan tidak ditemukan' })

    await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message)
      VALUES (${id}, 'bot', 'KERTA Bot', 'Baik, saya sambungkan ke admin kami. Mohon tunggu 1-2 menit ya 🙏')
    `
    res.json(conv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/chat/conversations', async (req, res) => {
  try {
    const conversations = await sql`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND sender_type = 'customer' AND is_read = FALSE) AS unread_count,
        (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM chat_conversations c
      ORDER BY 
        CASE c.status WHEN 'waiting_admin' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
        c.last_message_at DESC
    `
    res.json(conversations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/chat/conversations/:id/reply', async (req, res) => {
  try {
    const { id } = req.params
    const { message, admin_name } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' })
    }

    const [msg] = await sql`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message)
      VALUES (${id}, 'admin', ${admin_name || 'Admin KERTA'}, ${message.trim()})
      RETURNING *
    `

    await sql`
      UPDATE chat_conversations SET status = 'active', last_message_at = NOW()
      WHERE id = ${id}
    `
    res.status(201).json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/chat/conversations/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    await sql`
      UPDATE chat_messages SET is_read = TRUE
      WHERE conversation_id = ${id} AND sender_type = 'customer'
    `
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/chat/conversations/:id/close', async (req, res) => {
  try {
    const { id } = req.params
    const [conv] = await sql`
      UPDATE chat_conversations SET status = 'closed'
      WHERE id = ${id} RETURNING *
    `
    res.json(conv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// ANALYTICS
// ============================================
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { event_type, product_id, path, visitor_id, session_id, referrer } = req.body
    const userAgent = req.headers['user-agent'] || null

    if (event_type && ['view', 'add_to_cart', 'purchase'].includes(event_type)) {
      await sql`
        INSERT INTO product_events (product_id, event_type, visitor_id, session_id, referrer, user_agent)
        VALUES (${product_id}, ${event_type}, ${visitor_id}, ${session_id}, ${referrer}, ${userAgent})
      `
      return res.json({ success: true })
    }

    if (path) {
      await sql`
        INSERT INTO page_views (path, visitor_id, session_id, referrer, user_agent)
        VALUES (${path}, ${visitor_id}, ${session_id}, ${referrer}, ${userAgent})
      `
      return res.json({ success: true })
    }

    res.status(400).json({ error: 'Invalid track payload' })
  } catch (err) {
    console.error('Track error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/analytics/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [viewsCount] = await sql`
      SELECT COUNT(*)::int AS count FROM page_views WHERE created_at >= ${since}
    `
    const [uniqueVisitors] = await sql`
      SELECT COUNT(DISTINCT visitor_id)::int AS count FROM page_views WHERE created_at >= ${since}
    `
    const [productViews] = await sql`
      SELECT COUNT(*)::int AS count FROM product_events WHERE event_type = 'view' AND created_at >= ${since}
    `
    const [addToCarts] = await sql`
      SELECT COUNT(*)::int AS count FROM product_events WHERE event_type = 'add_to_cart' AND created_at >= ${since}
    `
    const [purchases] = await sql`
      SELECT COUNT(*)::int AS count FROM product_events WHERE event_type = 'purchase' AND created_at >= ${since}
    `

    const dailyTrend = await sql`
      SELECT DATE(created_at) AS date,
        COUNT(*)::int AS views,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views WHERE created_at >= ${since}
      GROUP BY DATE(created_at) ORDER BY date ASC
    `

    const topPages = await sql`
      SELECT path, COUNT(*)::int AS views FROM page_views
      WHERE created_at >= ${since} GROUP BY path ORDER BY views DESC LIMIT 10
    `

    const topReferrers = await sql`
      SELECT CASE WHEN referrer IS NULL OR referrer = '' THEN 'Direct' ELSE referrer END AS source,
        COUNT(*)::int AS count
      FROM page_views WHERE created_at >= ${since}
      GROUP BY source ORDER BY count DESC LIMIT 5
    `

    res.json({
      pageViews: viewsCount.count,
      uniqueVisitors: uniqueVisitors.count,
      productViews: productViews.count,
      addToCarts: addToCarts.count,
      purchases: purchases.count,
      dailyTrend, topPages, topReferrers,
    })
  } catch (err) {
    console.error('Analytics summary error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/analytics/products', async (req, res) => {
  try {
    const { days = 30 } = req.query
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const products = await sql`
      SELECT p.id, p.name, p.image, p.category, p.price,
        COALESCE(views.count, 0)::int AS views,
        COALESCE(carts.count, 0)::int AS add_to_carts,
        COALESCE(purchases.count, 0)::int AS purchases
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int AS count FROM product_events
        WHERE event_type = 'view' AND created_at >= ${since} GROUP BY product_id
      ) views ON views.product_id = p.id
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int AS count FROM product_events
        WHERE event_type = 'add_to_cart' AND created_at >= ${since} GROUP BY product_id
      ) carts ON carts.product_id = p.id
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int AS count FROM product_events
        WHERE event_type = 'purchase' AND created_at >= ${since} GROUP BY product_id
      ) purchases ON purchases.product_id = p.id
      ORDER BY views DESC NULLS LAST
    `
    res.json(products)
  } catch (err) {
    console.error('Analytics products error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// SHIPPING SETTINGS
// ============================================
app.get('/api/settings/shipping', async (req, res) => {
  try {
    const [settings] = await sql`SELECT * FROM shipping_settings WHERE id = 1`

    const activeCouriers = settings?.active_couriers
      ? settings.active_couriers.split(',').filter(Boolean)
      : ['jne', 'sicepat', 'jnt', 'anteraja', 'spx', 'pos']

    res.json({
      active_couriers: activeCouriers,
      free_shipping_min: settings?.free_shipping_min || 0,
      all_couriers: ALL_COURIERS,
    })
  } catch (err) {
    console.error('Get shipping settings error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/admin/settings/shipping', async (req, res) => {
  try {
    const { active_couriers, free_shipping_min } = req.body

    if (!Array.isArray(active_couriers) || active_couriers.length === 0) {
      return res.status(400).json({ error: 'Minimal pilih 1 kurir' })
    }

    const validCouriers = active_couriers.filter(
      (c) => COURIER_CONFIG[c] !== undefined
    )
    if (validCouriers.length === 0) {
      return res.status(400).json({ error: 'Kurir tidak valid' })
    }

    const courierString = validCouriers.join(',')

    const [updated] = await sql`
      UPDATE shipping_settings SET
        active_couriers = ${courierString},
        free_shipping_min = ${free_shipping_min || 0},
        updated_at = NOW()
      WHERE id = 1 RETURNING *
    `

    cacheClear('rates:')

    res.json({
      active_couriers: updated.active_couriers.split(','),
      free_shipping_min: updated.free_shipping_min,
    })
  } catch (err) {
    console.error('Update shipping settings error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// SHIPPING ENDPOINTS (Mengantar)
// ============================================
app.get('/api/shipping/areas', async (req, res) => {
  try {
    const { input } = req.query
    if (!input || input.length < 3) return res.json([])

    const cacheKey = `areas:${input.toLowerCase()}`
    const cached = cacheGet(cacheKey)
    if (cached) return res.json(cached)

    const data = await mengantarRequest(
      `/api/public/${MENGANTAR_KEY}/address/search?keyword=${encodeURIComponent(input)}`
    )

    const areas = (data.data || []).map((a) => ({
      id: a._id,
      name: a.SUBDISTRICT_NAME,
      district: a.DISTRICT_NAME,
      city: a.CITY_NAME,
      province: a.PROVINCE_NAME,
      zip: a.ZIP_CODE,
      full_address: a.fullAddress,
      full_address_short: `${a.SUBDISTRICT_NAME}, ${a.DISTRICT_NAME}, ${a.CITY_NAME}`,
    }))

    cacheSet(cacheKey, areas, CACHE_TTL.areas)
    res.json(areas)
  } catch (err) {
    console.error('Areas error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/shipping/rates', async (req, res) => {
  try {
    const { destination_id, weight } = req.body
    if (!destination_id) {
      return res.status(400).json({ error: 'destination_id wajib' })
    }

    const weightKg = Math.max(1, Math.ceil(Number(weight) || 1))

    const [settings] = await sql`
      SELECT active_couriers FROM shipping_settings WHERE id = 1
    `
    const activeCouriers = settings?.active_couriers
      ? settings.active_couriers.split(',').filter(Boolean)
      : ['jne', 'sicepat', 'jnt', 'anteraja', 'spx', 'pos']

    const cacheKey = `rates:${destination_id}:${weightKg}:${activeCouriers.join(',')}`
    const cached = cacheGet(cacheKey)
    if (cached) {
      res.set('X-Cache', 'HIT')
      return res.json(cached)
    }

    const data = await mengantarRequest(
      `/api/order/allEstimatePublic?origin_id=${MENGANTAR_ORIGIN_ID}&destination_id=${destination_id}&weight=${weightKg}`
    )

    const rates = normalizeRates(data.data, activeCouriers)
    cacheSet(cacheKey, rates, CACHE_TTL.rates)
    res.set('X-Cache', 'MISS')
    res.json(rates)
  } catch (err) {
    console.error('Rates error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// WEBHOOK MENGANTAR
// ============================================
app.post('/api/webhooks/mengantar', async (req, res) => {
  try {
    const payload = req.body
    console.log('🔔 Mengantar webhook:', payload)

    const status = payload.status_category || payload.status || null

    if (payload.cnote_no || payload.order_id) {
      const [order] = await sql`
        SELECT * FROM orders
        WHERE tracking_number = ${payload.cnote_no || null}
           OR mengantar_order_id = ${payload.order_id || null}
        LIMIT 1
      `

      if (order) {
        const internalStatus = mapMengantarStatus(status)
        await sql`
          UPDATE orders SET
            status = ${internalStatus},
            updated_at = NOW()
          WHERE id = ${order.id}
        `
        console.log(`✅ Order ${order.order_code} → ${internalStatus}`)
      }
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// REVIEWS (RATING & ULASAN CUSTOMER)
// ============================================

// GET: Ambil semua ulasan untuk 1 produk
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params
    const reviews = await sql`
      SELECT * FROM reviews 
      WHERE product_id = ${id} 
      ORDER BY created_at DESC
    `
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST: Customer ngasih ulasan (Wajib order status 'completed')
app.post('/api/reviews', async (req, res) => {
  try {
    const { product_id, order_id, rating, review_text } = req.body

    // 1. Validasi: Pastikan order ini beneran ada dan statusnya 'completed'
    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${order_id} AND status = 'completed'
    `
    if (!order) {
      return res.status(400).json({ error: 'Order belum selesai atau tidak valid.' })
    }

    // 2. Cek apakah produk ini memang ada di dalam order tersebut
    const [item] = await sql`
      SELECT * FROM order_items WHERE order_id = ${order_id} AND product_id = ${product_id}
    `
    if (!item) {
      return res.status(400).json({ error: 'Produk tidak ada di dalam order ini.' })
    }

    // 3. Cek biar gak double review
    const [existing] = await sql`
      SELECT id FROM reviews WHERE order_id = ${order_id} AND product_id = ${product_id}
    `
    if (existing) {
      return res.status(400).json({ error: 'Kamu sudah memberikan ulasan untuk produk ini.' })
    }

    // 4. Simpan ulasan baru
    const [newReview] = await sql`
      INSERT INTO reviews (product_id, order_id, customer_name, rating, review_text)
      VALUES (${product_id}, ${order_id}, ${order.customer_name}, ${rating}, ${review_text})
      RETURNING *
    `

    // 5. HITUNG RATA-RATA RATING BARU UNTUK PRODUK INI
    const [avgData] = await sql`
      SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ${product_id}
    `
    const newAvgRating = Number(avgData.avg_rating).toFixed(1) // Misal 4.5

    // 6. Update rating di tabel products
    await sql`
      UPDATE products SET rating = ${newAvgRating} WHERE id = ${product_id}
    `

    res.status(201).json({ success: true, review: newReview, new_rating: newAvgRating })
  } catch (err) {
    console.error('Review error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 KERTA API running at http://localhost:${PORT}`)
  console.log(`📦 Shipping provider: Mengantar (${MENGANTAR_BASE})`)
  if (!MENGANTAR_KEY || !MENGANTAR_ORIGIN_ID || !MENGANTAR_PICKUP_ADDRESS_ID) {
    console.warn('⚠️  MENGANTAR env variables belum lengkap di .env.local')
  }
})