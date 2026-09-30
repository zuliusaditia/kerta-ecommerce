import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Fetch conversation list
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat/conversations')
      const data = await res.json()
      setConversations(data)
    } catch (err) {
      console.error('Fetch conversations error:', err)
    }
  }

  // Fetch messages untuk conversation yang dipilih
  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`)
      const data = await res.json()
      setMessages(data.messages || [])

      // Mark as read
      await fetch(`/api/admin/chat/conversations/${id}/read`, { method: 'PATCH' })
    } catch (err) {
      console.error('Fetch messages error:', err)
    }
  }

  // Polling list conversation tiap 5 detik
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  // Polling messages tiap 3 detik kalau ada yang dipilih
  useEffect(() => {
    if (!selected) return
    fetchMessages(selected.id)
    const interval = setInterval(() => fetchMessages(selected.id), 3000)
    return () => clearInterval(interval)
  }, [selected?.id])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !selected) return

    setSending(true)
    try {
      await fetch(`/api/admin/chat/conversations/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply.trim(),
          admin_name: user?.name || 'Admin KERTA',
        }),
      })
      setReply('')
      fetchMessages(selected.id)
      fetchConversations()
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }

  const handleClose = async () => {
    if (!selected) return
    if (!confirm('Tutup percakapan ini?')) return

    await fetch(`/api/admin/chat/conversations/${selected.id}/close`, { method: 'PATCH' })
    setSelected(null)
    fetchConversations()
  }

  const statusColors = {
    bot: 'bg-gray-100 text-gray-600',
    waiting_admin: 'bg-red-100 text-red-700',
    active: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-400',
  }

  const statusLabels = {
    bot: 'Bot',
    waiting_admin: 'Butuh Admin',
    active: 'Aktif',
    closed: 'Selesai',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] border border-black/10 h-[calc(100vh-16rem)] min-h-[500px]">
      {/* Sidebar: Conversation List */}
      <div className="border-r border-black/10 overflow-y-auto">
        <div className="px-4 py-3 border-b border-black/10 bg-black/5">
          <p className="text-xs font-bold tracking-widest uppercase">
            Conversations ({conversations.length})
          </p>
        </div>

        {conversations.length === 0 ? (
          <p className="p-8 text-center text-xs font-bold tracking-widest uppercase opacity-50">
            Belum ada chat
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full text-left px-4 py-3 border-b border-black/5 hover:bg-black/5 transition ${
                selected?.id === conv.id ? 'bg-black/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-bold truncate">
                  {conv.customer_name || 'Guest'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs opacity-60 truncate mb-2">
                {conv.last_message || 'No messages yet'}
              </p>
              <span
                className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 ${
                  statusColors[conv.status]
                }`}
              >
                {statusLabels[conv.status]}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Main: Chat Panel */}
      {selected ? (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-3 border-b border-black/10 flex items-center justify-between bg-white">
            <div>
              <p className="text-sm font-bold">{selected.customer_name || 'Guest'}</p>
              <p className="text-[10px] opacity-60">{selected.customer_email || 'No email'}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-[10px] font-bold tracking-widest uppercase underline opacity-60 hover:opacity-100"
            >
              Tutup Percakapan
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.sender_type === 'admin'
                      ? 'bg-blue-600 text-white'
                      : msg.sender_type === 'bot'
                      ? 'bg-white border border-black/10'
                      : 'bg-black text-white'
                  }`}
                >
                  <p className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-1">
                    {msg.sender_type === 'customer'
                      ? selected.customer_name || 'Customer'
                      : msg.sender_name || msg.sender_type}
                  </p>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply */}
          <form onSubmit={handleSend} className="border-t border-black/10 flex bg-white">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Ketik balasan..."
              className="flex-1 px-5 py-4 text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!reply.trim() || sending}
              className="px-6 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition disabled:opacity-50"
            >
              {sending ? '...' : 'Kirim'}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-50">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50">
            Pilih percakapan
          </p>
        </div>
      )}
    </div>
  )
}