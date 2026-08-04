import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'https://ut-0hem.onrender.com/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login failed')
      
      await login(email, password)
      if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 sm:p-8" style={{ backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-secondary/70 to-primary/70" />
      <div className="relative bg-secondary/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 w-full max-w-md border-2 border-red/30 shadow-2xl shadow-red/20">
        <div className="text-center mb-6 sm:mb-8">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full border-4 border-red shadow-xl shadow-red/50 animate-float" />
          <h1 className="text-4xl sm:text-5xl font-black text-red mb-1 sm:mb-2 drop-shadow-lg">UTKARSH</h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gold tracking-wider">TOSS BOOK</h2>
          <p className="text-gray-300 mt-2 font-medium text-sm sm:text-base">Cricket & Football Toss Betting</p>
        </div>

        {error && (
          <div className="bg-red/20 border-2 border-red text-red px-4 py-3 rounded-lg mb-4 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 sm:py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50 text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 sm:py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50 text-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 sm:py-4 bg-gradient-to-r from-red via-bright-red to-red text-white font-black text-lg rounded-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-red/50 animate-glow"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-gold font-bold hover:text-amber hover:underline transition-all">
            Register
          </button>
        </p>
      </div>
    </div>
  )
}
