// ============================================
// KERTA® ANALYTICS
// Anonymous tracking — no personal data
// ============================================

const VISITOR_KEY = 'kerta_visitor_id'
const SESSION_KEY = 'kerta_session_id'
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 menit

// Generate random ID
function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

// Get/create persistent visitor ID
function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = 'v_' + generateId()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

// Get/create session ID (expires after 30 min inactive)
function getSessionId() {
  const stored = sessionStorage.getItem(SESSION_KEY)
  const lastActivity = sessionStorage.getItem(SESSION_KEY + '_last')
  const now = Date.now()

  if (stored && lastActivity && now - parseInt(lastActivity) < SESSION_TIMEOUT) {
    sessionStorage.setItem(SESSION_KEY + '_last', String(now))
    return stored
  }

  const newId = 's_' + generateId()
  sessionStorage.setItem(SESSION_KEY, newId)
  sessionStorage.setItem(SESSION_KEY + '_last', String(now))
  return newId
}

// Fire event ke backend (fire-and-forget)
async function fire(payload) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    // Silent fail — analytics gak boleh ganggu UX
    console.debug('Analytics error:', err.message)
  }
}

// ============================================
// PUBLIC API
// ============================================

export const analytics = {
  // Track page view
  pageView(path) {
    fire({
      path,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      referrer: document.referrer || null,
    })
  },

  // Track product view
  productView(productId) {
    fire({
      event_type: 'view',
      product_id: productId,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      referrer: document.referrer || null,
    })
  },

  // Track add to cart
  addToCart(productId) {
    fire({
      event_type: 'add_to_cart',
      product_id: productId,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
    })
  },

  // Track purchase (dipanggil saat checkout berhasil)
  purchase(productIds) {
    productIds.forEach((productId) => {
      fire({
        event_type: 'purchase',
        product_id: productId,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
      })
    })
  },
}