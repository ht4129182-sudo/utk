import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Wallet, Trophy, Clock, TrendingUp, LogOut, Menu, X, Home, History, CreditCard, Users, HelpCircle, User } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

export default function UserDashboard() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [matches, setMatches] = useState([])
  const [myBets, setMyBets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [betAmount, setBetAmount] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchMatches()
    fetchMyBets()
    fetchTransactions()
  }, [])

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/matches/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMatches(response.data)
    } catch (error) {
      console.error('Failed to fetch matches')
    }
  }

  const fetchMyBets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bets/my-bets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyBets(response.data)
    } catch (error) {
      console.error('Failed to fetch bets')
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/transactions/my-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTransactions(response.data)
    } catch (error) {
      console.error('Failed to fetch transactions')
    }
  }

  const handlePlaceBet = async () => {
    if (!selectedMatch || !selectedTeam || !betAmount) return

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/bets`,
        { match_id: selectedMatch.id, team_selected: selectedTeam, amount: parseFloat(betAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Refresh user data
      const userResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      updateUser(userResponse.data)
      
      setBetAmount('')
      setSelectedTeam('')
      setSelectedMatch(null)
      fetchMyBets()
      fetchTransactions()
      alert('Bet placed successfully!')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place bet')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({ icon: Icon, label, tab }) => (
    <button
      onClick={() => { setActiveTab(tab); setSidebarOpen(false) }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
        activeTab === tab ? 'bg-gradient-to-r from-red to-bright-red text-white shadow-xl shadow-red/50' : 'text-gray-300 hover:bg-white/10'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-primary">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-secondary border-b border-white/10">
        <h1 className="text-xl font-black text-red">UTKARSH</h1>
        <span className="text-gold font-bold">TOSS BOOK</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-white/10 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border-2 border-red shadow-lg shadow-red/50" />
              <div>
                <h1 className="text-xl font-black text-red">UTKARSH</h1>
                <h2 className="text-sm font-semibold text-gold">TOSS BOOK</h2>
              </div>
            </div>
            
            <nav className="space-y-2">
              <NavItem icon={Home} label="Dashboard" tab="dashboard" />
              <NavItem icon={Trophy} label="My Bets" tab="bets" />
              <NavItem icon={Wallet} label="Wallet" tab="wallet" />
              <NavItem icon={History} label="Transactions" tab="transactions" />
              <NavItem icon={Users} label="Top Winners" tab="winners" />
              <NavItem icon={HelpCircle} label="Support" tab="support" />
              <NavItem icon={User} label="Profile" tab="profile" />
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 mt-6 text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name}</h2>
              <p className="text-gray-400">Place your bets on upcoming tosses</p>
            </div>
            <div className="flex items-center gap-4 bg-secondary/50 px-6 py-3 rounded-xl border border-white/10">
              <Wallet className="text-gold" />
              <div>
                <p className="text-sm text-gray-400">Available Balance</p>
                <p className="text-xl font-black text-gold">₹ {user?.balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* Banner */}
              <div className="bg-gradient-to-r from-red via-bright-red to-crimson rounded-2xl p-8 mb-8 text-white shadow-2xl shadow-red/40 animate-float border-2 border-gold/30">
                <h3 className="text-3xl font-black mb-2">REAL MATCH TOSS BETTING</h3>
                <p className="text-xl font-bold text-gold">BET SMART, WIN BIG</p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-secondary/80 p-6 rounded-xl border-2 border-white/20 hover:border-gold transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg">
                  <TrendingUp className="text-gold mb-2" />
                  <h4 className="text-lg font-bold">Win 1.95x</h4>
                  <p className="text-gray-300 text-sm">Get 1.95x of your bet amount on winning</p>
                </div>
                <div className="bg-secondary/80 p-6 rounded-xl border-2 border-white/20 hover:border-gold transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg">
                  <Clock className="text-gold mb-2" />
                  <h4 className="text-lg font-bold">Instant Payout</h4>
                  <p className="text-gray-300 text-sm">Winnings credited immediately after result</p>
                </div>
                <div className="bg-secondary/80 p-6 rounded-xl border-2 border-white/20 hover:border-gold transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg">
                  <Trophy className="text-gold mb-2" />
                  <h4 className="text-lg font-bold">Worldwide Matches</h4>
                  <p className="text-gray-300 text-sm">Cricket & Football matches from around the world</p>
                </div>
              </div>

              {/* Upcoming Matches */}
              <h3 className="text-xl font-bold mb-4">Upcoming Toss Matches</h3>
              {selectedMatch ? (
                <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
                  <button onClick={() => setSelectedMatch(null)} className="text-gray-400 mb-4 hover:text-white">
                    ← Back to matches
                  </button>
                  
                  <div className="mb-6">
                    <span className="text-red text-sm font-bold">{selectedMatch.sport.toUpperCase()}</span>
                    <h4 className="text-2xl font-bold mt-1">{selectedMatch.team_a} vs {selectedMatch.team_b}</h4>
                    <p className="text-gray-400">{selectedMatch.series || 'Match'} • {selectedMatch.venue || 'TBD'}</p>
                    <p className="text-gray-400">{selectedMatch.match_date} at {selectedMatch.match_time}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-400">Toss closes in</p>
                    <p className="text-2xl font-black text-red animate-pulse">01:18:45</p>
                  </div>

                  <h4 className="text-lg font-semibold mb-4">Who will win the toss?</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setSelectedTeam(selectedMatch.team_a)}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedTeam === selectedMatch.team_a
                          ? 'border-red bg-red/20 shadow-xl shadow-red/50'
                          : 'border-white/20 bg-white/10 hover:border-red'
                      }`}
                    >
                      <p className="font-bold text-lg">{selectedMatch.team_a}</p>
                      <p className="text-gold font-black">1.95x</p>
                    </button>
                    <button
                      onClick={() => setSelectedTeam(selectedMatch.team_b)}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedTeam === selectedMatch.team_b
                          ? 'border-red bg-red/20 shadow-xl shadow-red/50'
                          : 'border-white/20 bg-white/10 hover:border-red'
                      }`}
                    >
                      <p className="font-bold text-lg">{selectedMatch.team_b}</p>
                      <p className="text-gold font-black">1.95x</p>
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enter Bet Amount</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      placeholder="Enter amount"
                    />
                    <div className="flex gap-2 mt-2">
                      {[100, 500, 1000, 2000, 5000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount.toString())}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-red hover:text-white transition-all duration-300 transform hover:scale-105 font-semibold"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {betAmount && (
                    <div className="bg-gold/20 border-2 border-gold rounded-xl p-4 mb-6 animate-pulse shadow-lg shadow-gold/30">
                      <p className="text-gold font-bold">You will win ₹ {(parseFloat(betAmount) * 1.95).toFixed(2)}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceBet}
                    disabled={!selectedTeam || !betAmount}
                    className="w-full py-4 bg-gradient-to-r from-red via-bright-red to-red text-white font-black text-lg rounded-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-red/50 animate-glow disabled:opacity-50 disabled:transform-none disabled:animate-none"
                  >
                    Place Bet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-secondary/80 rounded-xl p-6 border-2 border-white/20 hover:border-red transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg" onClick={() => setSelectedMatch(match)}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-red text-sm font-bold">{match.sport.toUpperCase()}</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Upcoming</span>
                      </div>
                      <h4 className="text-lg font-bold mb-1">{match.team_a} vs {match.team_b}</h4>
                      <p className="text-gray-400 text-sm mb-4">{match.match_date} • {match.match_time}</p>
                      <button className="w-full py-2 bg-gradient-to-r from-red to-bright-red text-white font-black rounded-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-red/30">
                        Place Bet
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Results */}
              <h3 className="text-xl font-bold mt-8 mb-4">Recent Toss Results</h3>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                {myBets.slice(0, 5).map((bet) => (
                  <div key={bet.id} className="p-4 border-b border-white/10 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{bet.team_a} vs {bet.team_b}</p>
                      <p className="text-sm text-gray-400">Bet on: {bet.team_selected}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                        bet.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {bet.result.toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-400 mt-1">{bet.result === 'won' ? `+₹${bet.potential_win.toFixed(2)}` : `-₹${bet.amount.toFixed(2)}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'bets' && (
            <div>
              <h3 className="text-xl font-bold mb-4">My Bets</h3>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                {myBets.map((bet) => (
                  <div key={bet.id} className="p-4 border-b border-white/10 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold text-sm">{bet.sport.toUpperCase()}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                        bet.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {bet.result.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-bold">{bet.team_a} vs {bet.team_b}</h4>
                    <p className="text-gray-400 text-sm">Bet on: {bet.team_selected}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-400">Amount: ₹{bet.amount.toFixed(2)}</span>
                      <span className="text-gold font-bold">Potential: ₹{bet.potential_win.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Wallet</h3>
              <div className="text-center py-8">
                <Wallet className="text-red mx-auto mb-4" size={48} />
                <p className="text-3xl font-bold text-red mb-2">₹ {user?.balance?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-400 mb-6">Available Balance</p>
                <p className="text-gray-400 text-sm">Contact admin to add funds to your account</p>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Transaction History</h3>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                {transactions.map((txn) => (
                  <div key={txn.id} className="p-4 border-b border-white/10 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{txn.description}</p>
                      <p className="text-sm text-gray-400">{new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`font-bold ${txn.type === 'credit' || txn.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.type === 'credit' || txn.type === 'win' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <p className="text-white">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <p className="text-white">{user?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                  <p className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Support</h3>
              <p className="text-gray-400 mb-4">Need help? Contact our support team:</p>
              <div className="space-y-2">
                <p className="text-white">Email: support@utkarshtossbook.com</p>
                <p className="text-white">Phone: +91 9876543210</p>
              </div>
            </div>
          )}

          {activeTab === 'winners' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Top Winners</h3>
              <p className="text-gray-400">Leaderboard coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
