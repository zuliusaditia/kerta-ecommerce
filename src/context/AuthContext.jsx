import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const adminSaved = localStorage.getItem('kerta_admin')
    const customerSaved = localStorage.getItem('kerta_customer')

    if (adminSaved) {
      try {
        setUser({ ...JSON.parse(adminSaved), type: 'admin' })
      } catch {}
    } else if (customerSaved) {
      try {
        const parsed = JSON.parse(customerSaved)
        setUser({ ...parsed.user, type: 'customer', token: parsed.token })
      } catch {}
    }
    setLoading(false)
  }, [])

  // ============ ADMIN ============
  const adminLogin = async (email, password) => {
    try {
      const { user } = await api.adminLogin(email, password)
      const adminUser = { ...user, type: 'admin' }
      setUser(adminUser)
      localStorage.setItem('kerta_admin', JSON.stringify(adminUser))
      return { data: adminUser, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const adminSignOut = () => {
    setUser(null)
    localStorage.removeItem('kerta_admin')
  }

  // ============ CUSTOMER ============
  const sendOtp = async (email) => {
    try {
      const data = await api.sendOtp(email)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const verifyOtp = async (email, code) => {
    try {
      const { user, token } = await api.verifyOtp(email, code)
      const customerUser = { ...user, type: 'customer', token }
      setUser(customerUser)
      localStorage.setItem('kerta_customer', JSON.stringify({ user, token }))
      return { data: customerUser, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  // Update profile customer — sinkronin ke state + localStorage
  const updateCustomer = async (data) => {
    try {
      const updated = await api.updateMe(data)
      const customerUser = { ...updated, type: 'customer', token: user?.token }

      setUser(customerUser)

      // Update localStorage juga
      const saved = localStorage.getItem('kerta_customer')
      if (saved) {
        const parsed = JSON.parse(saved)
        localStorage.setItem(
          'kerta_customer',
          JSON.stringify({ ...parsed, user: updated })
        )
      }

      return { data: customerUser, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const customerSignOut = async () => {
    try {
      await api.logoutCustomer()
    } catch {}
    setUser(null)
    localStorage.removeItem('kerta_customer')
  }

  // ============ SHARED ============
  const signOut = () => {
    if (user?.type === 'admin') adminSignOut()
    else if (user?.type === 'customer') customerSignOut()
  }

  const isAdmin = user?.type === 'admin'
  const isCustomer = user?.type === 'customer'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isCustomer,
        adminLogin,
        sendOtp,
        verifyOtp,
        updateCustomer,
        signOut,
        adminSignOut,
        customerSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)