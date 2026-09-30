import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ============================================
// BOT FLOW DEFINITIONS
// ============================================
const BOT_FLOWS = {
  main: {
    messages: [
      'Halo! 👋 Saya KERTA Bot. Ada yang bisa saya bantu?',
    ],
    options: [
      { label: '📦 Cek Pesanan', action: 'check_order' },
      { label: '🛍️ Info Produk', action: 'product_info' },
      { label: '💳 Metode Pembayaran', action: 'payment_info' },
      { label: '🚚 Info Pengiriman', action: 'shipping_info' },
      { label: '💬 Bicara dengan Admin', action: 'escalate' },
    ],
  },
  product_info: {
    messages: [
      'Kami punya beberapa kategori produk:\n\n• Pakaian (T-Shirt, Hoodie, Jacket)\n• Sepatu\n• Tas\n• Aksesoris\n\nSemua produk bisa dilihat di halaman Shop.',
    ],
    options: [
      { label: '🛍️ Buka Shop', action: 'go_shop' },
      { label: '⬅️ Menu Utama', action: 'main' },
      { label: '💬 Bicara dengan Admin', action: 'escalate' },
    ],
  },
  payment_info: {
    messages: [
      'Kami menerima beberapa metode pembayaran:\n\n• Transfer Bank (BCA, BNI, Mandiri)\n• QRIS (semua e-wallet)\n• COD (Bayar di Tempat)',
    ],
    options: [
      { label: '⬅️ Menu Utama', action: 'main' },
      { label: '💬 Bicara dengan Admin', action: 'escalate' },
    ],
  },
  shipping_info: {
    messages: [
      'Info Pengiriman:\n\n• Ongkir: Rp 15.000 ke seluruh Indonesia\n• FREE ONGKIR untuk pembelian di atas Rp 500.000\n\nEstimasi:\n• Jabodetabek: 1-3 hari kerja\n• Luar Jabodetabek: 3-7 hari kerja',
    ],
    options: [
      { label: '⬅️ Menu Utama', action: 'main' },
      { label: '💬 Bicara dengan Admin', action: 'escalate' },
    ],
  },
  check_order: {
    messages: [
      'Masukkan kode pesanan kamu ya.\n\nFormat: KRT-YYYYMMDD-XXXX\nContoh: KRT-20260921-R27D',
    ],
    options: [
      { label: '⬅️ Menu Utama', action: 'main' },
    ],
    expectInput: 'order_code',
  },
}

export default function ChatWidget() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [options, setOptions] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [expectInput, setExpectInput] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [status, setStatus] = useState('bot') // bot | waiting_admin | active
  const [typing, setTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)

  // ============================================
  // INIT: Welcome message
  // ============================================
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { sender_type: 'bot', message: BOT_FLOWS.main.messages[0], created_at: new Date().toISOString() },
      ])
      setOptions(BOT_FLOWS.main.options)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // ============================================
  // POLLING — cek pesan baru dari admin
  // ============================================
  useEffect(() => {
    if (!conversationId) return
    if (status === 'bot') return
    if (!isOpen) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}`)
        const data = await res.json()

        if (data.messages) {
          setMessages(data.messages)
          setStatus(data.status)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }

    pollRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollRef.current)
  }, [conversationId, status, isOpen])

  // ============================================
  // HELPERS
  // ============================================
  const pushMessage = (sender_type, message) => {
    setMessages((prev) => [
      ...prev,
      { sender_type, message, created_at: new Date().toISOString() },
    ])
  }

  const botRespond = (flowKey) => {
    const flow = BOT_FLOWS[flowKey]
    if (!flow) return

    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      flow.messages.forEach((msg) => pushMessage('bot', msg))
      setOptions(flow.options || [])
      setExpectInput(flow.expectInput || null)
    }, 600)
  }

  // ============================================
  // START CONVERSATION (buat di DB)
  // ============================================
  const ensureConversation = async () => {
    if (conversationId) return conversationId

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: user?.name || 'Guest',
          customer_email: user?.email || null,
        }),
      })
      const data = await res.json()
      setConversationId(data.id)
      return data.id
    } catch (err) {
      console.error('Failed to create conversation:', err)
      return null
    }
  }

  // ============================================
  // SEND MESSAGE
  // ============================================
  const sendMessage = async (text) => {
    if (!text.trim()) return

    // Tampilkan pesan user
    pushMessage('customer', text)
    setInputValue('')
    setOptions([])
    setExpectInput(null)

    // Pastikan conversation udah ada di DB
    const convId = await ensureConversation()

    // Simpan ke DB
    if (convId) {
      try {
        await fetch(`/api/chat/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_type: 'customer',
            sender_name: user?.name || 'Guest',
            message: text,
          }),
        })
      } catch (err) {
        console.error('Failed to save message:', err)
      }
    }

    // Cek kalau user lagi ketik order code
    if (expectInput === 'order_code') {
      await handleOrderCode(text)
      return
    }

    // Default: balik ke menu utama
    botRespond('main')
  }

  // ============================================
  // HANDLE ORDER CODE LOOKUP
  // ============================================
  const handleOrderCode = async (code) => {
    setTyping(true)
    try {
      const res = await fetch(`/api/orders/${code.trim()}`)
      if (!res.ok) throw new Error('not found')
      const order = await res.json()

      setTyping(false)
      pushMessage(
        'bot',
        `Pesanan ditemukan! ✅\n\nKode: ${order.order_code}\nStatus: ${order.status.toUpperCase()}\nTotal: Rp ${order.total.toLocaleString('id-ID')}\nDikirim ke: ${order.customer_name}, ${order.city}\n\nUntuk info lebih lanjut, silakan bicara dengan admin kami.`
      )
      setOptions([
        { label: '💬 Bicara dengan Admin', action: 'escalate' },
        { label: '⬅️ Menu Utama', action: 'main' },
      ])
    } catch {
      setTyping(false)
      pushMessage(
        'bot',
        `Maaf, kode pesanan "${code}" tidak ditemukan. 😔\n\nPastikan formatnya benar (contoh: KRT-20260921-R27D) atau bicara dengan admin kami.`
      )
      setOptions([
        { label: '🔁 Coba Lagi', action: 'check_order' },
        { label: '💬 Bicara dengan Admin', action: 'escalate' },
      ])
    }
  }

  // ============================================
  // HANDLE OPTION CLICK
  // ============================================
  const handleOption = async (option) => {
    // Tampilin pilihan user sebagai bubble chat
    pushMessage('customer', option.label)
    setOptions([])

    if (option.action === 'escalate') {
      await handleEscalate()
      return
    }

    if (option.action === 'go_shop') {
      navigate('/shop')
      setIsOpen(false)
      return
    }

    // Bot flow
    botRespond(option.action)
  }

  // ============================================
  // ESCALATE TO ADMIN
  // ============================================
  const handleEscalate = async () => {
    setTyping(true)

    const convId = await ensureConversation()

    try {
      await fetch(`/api/chat/conversations/${convId}/escalate`, { method: 'POST' })
      const res = await fetch(`/api/chat/conversations/${convId}`)
      const data = await res.json()
      setMessages(data.messages)
      setStatus(data.status)
      setTyping(false)
      setOptions([])
    } catch (err) {
      console.error('Escalate error:', err)
      setTyping(false)
    }
  }

  // ============================================
  // INPUT SUBMIT
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  // ============================================
  // UNREAD BADGE — cek pesan baru waktu widget ketutup
  // ============================================
  useEffect(() => {
    if (!conversationId) return

    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}`)
        const data = await res.json()
        if (!isOpen && data.messages) {
          const customerMsgCount = messages.filter((m) => m.sender_type === 'customer').length
          const newCustomerMsgs = data.messages.filter((m) => m.sender_type === 'customer').length
          const newAdminMsgs = data.messages.filter((m) => m.sender_type === 'admin').length
          if (newAdminMsgs > 0) setUnreadCount(newAdminMsgs)
        }
      } catch {}
    }

    const interval = setInterval(checkUnread, 10000)
    return () => clearInterval(interval)
  }, [conversationId, isOpen, messages])

  // Reset unread saat widget dibuka
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  return (
    <>
      {/* ============================================
          FLOATING BUTTON
      ============================================ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-black text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-gray-800 transition shadow-lg"
        aria-label="Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        )}

        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ============================================
          CHAT PANEL
      ============================================ */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white border border-black/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase">KERTA Support</p>
              <p className="text-[10px] opacity-60 mt-0.5">
                {status === 'bot' && '🤖 Bot aktif'}
                {status === 'waiting_admin' && '⏳ Menunggu admin...'}
                {status === 'active' && '💬 Admin sedang online'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))}

            {typing && (
              <div className="flex gap-1 items-center px-4 py-3 bg-white border border-black/10 w-fit">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Options */}
          {options.length > 0 && !typing && (
            <div className="px-5 py-3 bg-white border-t border-black/10 flex flex-wrap gap-2">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOption(opt)}
                  className="text-xs font-bold tracking-wider uppercase border border-black/20 px-3 py-2 hover:bg-black hover:text-white transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-black/10 flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={expectInput === 'order_code' ? 'Ketik kode pesanan...' : 'Ketik pesan...'}
              className="flex-1 px-5 py-4 text-sm focus:outline-none"
              disabled={status === 'waiting_admin' && !inputValue}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-5 text-black disabled:opacity-30 hover:opacity-60 transition"
              aria-label="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

// ============================================
// MESSAGE BUBBLE
// ============================================
function MessageBubble({ msg }) {
  const isCustomer = msg.sender_type === 'customer'

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
          isCustomer
            ? 'bg-black text-white'
            : msg.sender_type === 'admin'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-black border border-black/10'
        }`}
      >
        {msg.sender_type === 'admin' && (
          <p className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-1">
            {msg.sender_name || 'Admin'}
          </p>
        )}
        {msg.message}
      </div>
    </div>
  )
}