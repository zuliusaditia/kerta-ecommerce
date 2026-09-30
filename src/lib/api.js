const API_URL = '/api'

// Ambil token customer dari localStorage
function getCustomerToken() {
  const saved = localStorage.getItem('kerta_customer')
  if (!saved) return null
  try {
    return JSON.parse(saved).token
  } catch {
    return null
  }
}

async function request(endpoint, options = {}) {
  const token = getCustomerToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || err.message || 'Request failed')
  }
  return res.json()
}

export const api = {
  // ============================================
  // PRODUCTS
  // ============================================
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) =>
    request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  // ============================================
  // ADMIN AUTH
  // ============================================
  adminLogin: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // ============================================
  // CUSTOMER AUTH (OTP)
  // ============================================
  sendOtp: (email) =>
    request('/customer/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyOtp: (email, code) =>
    request('/customer/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  getMe: () => request('/customer/me'),
  updateMe: (data) =>
    request('/customer/me', { method: 'PATCH', body: JSON.stringify(data) }),
  logoutCustomer: () => request('/customer/logout', { method: 'POST' }),
  getMyOrders: () => request('/customer/orders'),

  // ============================================
  // ORDERS
  // ============================================
  getOrders: () => request('/orders'),
  getOrder: (code) => request(`/orders/${code}`),
  createOrder: (data) =>
    request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (code, status) =>
    request(`/orders/${code}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ============================================
  // ANALYTICS (Admin)
  // ============================================
  getAnalyticsSummary: (days = 7) =>
    request(`/admin/analytics/summary?days=${days}`),
  getProductAnalytics: (days = 30) =>
    request(`/admin/analytics/products?days=${days}`),
}