import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LayoutDashboard, Trophy, Users, Wallet, History, Settings, LogOut, Menu, X, Plus, Search, ChevronDown } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://ut-0hem.onrender.com/api'

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Dashboard stats
  const [stats, setStats] = useState({ total_users: 0, total_balance: 0, total_bets_today: 0, total_profit: 0 })
  
  // Matches
  const [matches, setMatches] = useState([])
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [newMatch, setNewMatch] = useState({ team_a: '', team_b: '', sport: 'cricket', match_date: '', match_time: '', venue: '', series: '', toss_cutoff: '' })
  
  // Users
  const [users, setUsers] = useState([])
  const [searchUser, setSearchUser] = useState('')
  const [showAddBalance, setShowAddBalance] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceAction, setBalanceAction] = useState('add')
  
  // Admin Management
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' })
  
  // Bets
  const [allBets, setAllBets] = useState([])
  
  // Transactions
  const [allTransactions, setAllTransactions] = useState([])

  useEffect(() => {
    fetchStats()
    fetchMatches()
    fetchUsers()
    fetchAllBets()
    fetchAllTransactions()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
      // Admin always has unlimited coins
      updateUser({ ...user, balance: 999999999 })
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMatches(response.data)
    } catch (error) {
      console.error('Failed to fetch matches')
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
      // Admin always has unlimited coins
      updateUser({ ...user, balance: 999999999 })
    } catch (error) {
      console.error('Failed to fetch users')
    }
  }

  const fetchAllBets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bets/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAllBets(response.data)
    } catch (error) {
      console.error('Failed to fetch bets')
    }
  }

  const fetchAllTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/transactions/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAllTransactions(response.data)
    } catch (error) {
      console.error('Failed to fetch transactions')
    }
  }

  const handleAddMatch = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/matches`, newMatch, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowAddMatch(false)
      setNewMatch({ team_a: '', team_b: '', sport: 'cricket', match_date: '', match_time: '', venue: '', series: '', toss_cutoff: '' })
      fetchMatches()
      alert('Match added successfully!')
    } catch (error) {
      alert('Failed to add match')
    }
  }

  const handleSetResult = async (matchId, tossWinner) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/admin/set-result`, { match_id: matchId, toss_winner: tossWinner }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchMatches()
      fetchAllBets()
      fetchStats()
      alert('Result set and payouts processed!')
    } catch (error) {
      alert('Failed to set result')
    }
  }

  const handleBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('token')
      if (balanceAction === 'add') {
        await axios.post(`${API_URL}/users/add-balance`, { user_id: selectedUser.id, amount: parseFloat(balanceAmount) }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/users/subtract-balance`, { user_id: selectedUser.id, amount: parseFloat(balanceAmount) }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowAddBalance(false)
      setBalanceAmount('')
      setSelectedUser(null)
      fetchUsers()
      fetchStats()
      alert('Balance updated successfully!')
    } catch (error) {
      alert('Failed to update balance')
    }
  }

  const handlePromoteAdmin = async (userId) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/users/promote-admin`, { user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      alert('User promoted to admin successfully!')
    } catch (error) {
      alert('Failed to promote user')
    }
  }

  const handleDemoteAdmin = async (userId) => {
    if (!confirm('Are you sure you want to demote this admin to user?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/users/demote-admin`, { user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      alert('Admin demoted to user successfully!')
    } catch (error) {
      alert('Failed to demote admin: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const handleCreateAdmin = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/users/create-admin`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowCreateAdmin(false)
      setNewAdmin({ name: '', email: '', password: '' })
      fetchUsers()
      alert('Admin created successfully!')
    } catch (error) {
      alert('Failed to create admin: ' + (error.response?.data?.error || 'Unknown error'))
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-primary">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-secondary border-b border-white/10">
        <h1 className="text-xl font-black text-red">Admin Panel</h1>
        <span className="text-gold font-bold">UTKARSH</span>
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
                <h2 className="text-sm font-semibold text-gold">ADMIN PANEL</h2>
              </div>
            </div>
            
            <nav className="space-y-2">
              <NavItem icon={LayoutDashboard} label="Dashboard" tab="dashboard" />
              <NavItem icon={Trophy} label="Matches" tab="matches" />
              <NavItem icon={Users} label="Users" tab="users" />
              <NavItem icon={Wallet} label="Add Balance" tab="add-balance" />
              <NavItem icon={History} label="Transactions" tab="transactions" />
              <NavItem icon={Trophy} label="Bets" tab="bets" />
              <NavItem icon={History} label="Result History" tab="results" />
              <NavItem icon={Settings} label="Admin Management" tab="admin-mgmt" />
              <NavItem icon={Settings} label="Settings" tab="settings" />
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 mt-6 text-red-几百 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {activeTab === 'dashboard' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
                  <Users className="text-red mb-2" />
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.total_users}</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
                  <Wallet className="text-red mb-2" />
                  <p className="text-gray-400 text-sm">Total Balance in System</p>
                  <p className="text-3xl font-bold text-white">₹ {stats.total_balance?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
                  <Trophy className="text-red mb-2" />
                  <p className="text-gray-400 text-sm">Total Bets Today</p>
                  <p className="text-3xl font-bold text-white">{stats.total_bets_today}</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
                  <Trophy className="text-red mb-2" />
                  <p className="text-gray-400 text-sm">Total Profit (House Edge)</p>
                  <p className="text-3xl font-black text-gold">₹ {stats.total_profit?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">Recent Bets</h3>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Match</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Bet On</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBets.slice(0, 10).map((bet) => (
                      <tr key={bet.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">{bet.user_name}</td>
                        <td className="px-4 py-3 text-white">{bet.team_a} vs {bet.team_b}</td>
                        <td className="px-4 py-3 text-white">{bet.team_selected}</td>
                        <td className="px-4 py-3 text-white">₹ {bet.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                            bet.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bet.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'matches' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Matches</h2>
                <button
                  onClick={() => setShowAddMatch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red to-bright-red text-white font-black rounded-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-red/50 animate-glow"
                >
                  <Plus size={20} />
                  Add New Match
                </button>
              </div>

              {showAddMatch && (
                <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10 mb-6">
                  <h3 className="text-xl font-bold mb-4">Add New Match</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                      <select
                        value={newMatch.sport}
                        onChange={(e) => setNewMatch({...newMatch, sport: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      >
                        <option value="cricket">Cricket</option>
                        <option value="football">Football</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Team A</label>
                      <input
                        type="text"
                        value={newMatch.team_a}
                        onChange={(e) => setNewMatch({...newMatch, team_a: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Team B</label>
                      <input
                        type="text"
                        value={newMatch.team_b}
                        onChange={(e) => setNewMatch({...newMatch, team_b: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Match Date</label>
                      <input
                        type="date"
                        value={newMatch.match_date}
                        onChange={(e) => setNewMatch({...newMatch, match_date: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Match Time</label>
                      <input
                        type="time"
                        value={newMatch.match_time}
                        onChange={(e) => setNewMatch({...newMatch, match_time: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                      <input
                        type="text"
                        value={newMatch.venue}
                        onChange={(e) => setNewMatch({...newMatch, venue: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Series/League</label>
                      <input
                        type="text"
                        value={newMatch.series}
                        onChange={(e) => setNewMatch({...newMatch, series: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Toss Cut-off Time</label>
                      <input
                        type="datetime-local"
                        value={newMatch.toss_cutoff}
                        onChange={(e) => setNewMatch({...newMatch, toss_cutoff: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-red focus:ring-4 focus:ring-red/30 text-white transition-all hover:border-red/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowAddMatch(false)}
                      className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMatch}
                      className="px-6 py-2 bg-gradient-to-r from-red to-bright-red text-white font-black rounded-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-red/50 animate-glow"
                    >
                      Add Match
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Match</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Match Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Toss Winner</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">{match.team_a} vs {match.team_b}</td>
                        <td className="px-4 py-3 text-white capitalize">{match.sport}</td>
                        <td className="px-4 py-3 text-white">{match.match_date} {match.match_time}</td>
                        <td className="px-4 py-3 text-white">{match.toss_winner || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            match.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            match.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {match.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {match.status === 'upcoming' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSetResult(match.id, match.team_a)}
                                className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                              >
                                {match.team_a}
                              </button>
                              <button
                                onClick={() => handleSetResult(match.id, match.team_b)}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                              >
                                {match.team_b}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                  />
                </div>
              </div>

              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">U{String(u.id).padStart(4, '0')}</td>
                        <td className="px-4 py-3 text-white">{u.name}</td>
                        <td className="px-4 py-3 text-white">{u.phone || '-'}</td>
                        <td className="px-4 py-3 text-gold font-black">₹ {u.balance.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedUser(u); setShowAddBalance(true); setBalanceAction('add') }}
                            className="px-3 py-1 bg-gold/20 text-gold rounded text-xs hover:bg-gold/30 transition-all duration-300 transform hover:scale-105 font-semibold"
                          >
                            Add Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'add-balance' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Add Balance to User</h2>
              
              <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select User</label>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => setSelectedUser(users.find(u => u.id === parseInt(e.target.value)))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                  >
                    <option value="">Select a user</option>
                    {users.filter(u => u.role !== 'admin').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (U{String(u.id).padStart(4, '0')}) - Current Balance: ₹ {u.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setBalanceAction('add')}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${balanceAction === 'add' ? 'bg-gradient-to-r from-red to-bright-red text-white shadow-xl shadow-red/50' : 'bg-white/10 text-white'}`}
                    >
                      Add Balance
                    </button>
                    <button
                      onClick={() => setBalanceAction('subtract')}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${balanceAction === 'subtract' ? 'bg-red-dark text-white' : 'bg-white/10 text-white'}`}
                    >
                      Subtract Balance
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red text-white"
                    placeholder="Enter amount"
                  />
                </div>

                {selectedUser && balanceAmount && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <p className="text-gray-400">New Balance:</p>
                    <p className="text-2xl font-black text-gold">
                      ₹ {(balanceAction === 'add' ? selectedUser.balance + parseFloat(balanceAmount) : selectedUser.balance - parseFloat(balanceAmount)).toFixed(2)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleBalanceUpdate}
                  disabled={!selectedUser || !balanceAmount}
                  className="w-full py-3 bg-gradient-to-r from-red to-bright-red text-white font-black rounded-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-red/50 animate-glow disabled:opacity-50 disabled:transform-none disabled:animate-none"
                >
                  {balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">All Transactions</h2>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">{txn.user_name}</td>
                        <td className="px-4 py-3 text-white capitalize">{txn.type}</td>
                        <td className={`px-4 py-3 font-semibold ${txn.type === 'credit' || txn.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                          {txn.type === 'credit' || txn.type === 'win' ? '+' : '-'}₹ {txn.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-white">{txn.description}</td>
                        <td className="px-4 py-3 text-white">{new Date(txn.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'bets' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">All Bets</h2>
              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Match</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Bet On</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Potential Win</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBets.map((bet) => (
                      <tr key={bet.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">{bet.user_name}</td>
                        <td className="px-4 py-3 text-white">{bet.team_a} vs {bet.team_b}</td>
                        <td className="px-4 py-3 text-white">{bet.team_selected}</td>
                        <td className="px-4 py-3 text-white">₹ {bet.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gold font-black">₹ {bet.potential_win.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                            bet.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {bet.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'results' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Result History</h2>
              <p className="text-gray-400">Completed matches and their toss results will appear here.</p>
            </div>
          )}

          {activeTab === 'admin-mgmt' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Admin Management</h2>
              
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red to-bright-red text-white rounded-lg hover:scale-105 transition-all duration-300 transform shadow-xl shadow-red/50 font-semibold"
                >
                  <Plus size={20} className="inline mr-2" />
                  Create New Admin
                </button>
              </div>

              <div className="bg-secondary/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">User ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/10">
                        <td className="px-4 py-3 text-white">U{String(u.id).padStart(4, '0')}</td>
                        <td className="px-4 py-3 text-white">{u.name}</td>
                        <td className="px-4 py-3 text-white">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            u.role === 'admin' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-gray-300'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gold font-black">₹ {u.balance.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {u.role === 'user' ? (
                            <button
                              onClick={() => handlePromoteAdmin(u.id)}
                              className="px-3 py-1 bg-gold/20 text-gold rounded text-xs hover:bg-gold/30 transition-all duration-300 transform hover:scale-105 font-semibold"
                            >
                              Promote to Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDemoteAdmin(u.id)}
                              className="px-3 py-1 bg-red/20 text-red rounded text-xs hover:bg-red/30 transition-all duration-300 transform hover:scale-105 font-semibold"
                            >
                              Demote to User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {showCreateAdmin && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-secondary rounded-2xl p-6 w-full max-w-md border-2 border-red/30 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Create New Admin</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                    placeholder="Enter name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                    placeholder="Enter email"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-gold text-white"
                    placeholder="Enter password"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCreateAdmin}
                    className="flex-1 py-3 bg-gradient-to-r from-red to-bright-red text-white font-black rounded-lg hover:scale-105 transition-all duration-300 transform shadow-xl shadow-red/50"
                  >
                    Create Admin
                  </button>
                  <button
                    onClick={() => setShowCreateAdmin(false)}
                    className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-secondary/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
              <p className="text-gray-400">Admin settings coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
