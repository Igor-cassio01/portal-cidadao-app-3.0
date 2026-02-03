import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Configurar axios com URL absoluta
const api = axios.create({
  baseURL: window.location.origin + '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Não redirecionar automaticamente, deixar o contexto gerenciar
    }
    
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          
          // Verificar se o token ainda é válido
          try {
            await api.get('/auth/profile')
          } catch (error) {
            console.error('Token validation failed:', error)
            // Token inválido, limpar dados
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', email)
      
      const response = await api.post('/auth/login', {
        email,
        password
      })

      console.log('Login response:', response.data)

      const { access_token, user: userData } = response.data

      if (access_token && userData) {
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return { success: true, user: userData }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || error.message || 'Erro no login'
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      const { access_token, user: newUser } = response.data

      if (access_token && newUser) {
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(newUser))
        setUser(newUser)
        return { success: true, user: newUser }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Register error:', error)
      const message = error.response?.data?.error || error.message || 'Erro no cadastro'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    api,
    isAuthenticated: !!user,
    isAdmin: user?.user_type === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
