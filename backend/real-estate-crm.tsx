import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, Users, Target, Building, DollarSign, CheckSquare, 
  MessageSquare, Search, Bell, Settings, LogOut, Menu, X,
  Plus, Edit, Trash2, Eye, Filter, Calendar, TrendingUp,
  Phone, Mail, MapPin, Clock, User
} from 'lucide-react';

// Auth Context
const AuthContext = createContext();

// API Service
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth methods
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(data.data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Leads
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leads?${queryString}`);
  }

  async createLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  // Contacts
  async getContacts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/contacts?${queryString}`);
  }

  // Properties
  async getProperties(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/properties?${queryString}`);
  }

  // Transactions
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transactions?${queryString}`);
  }

  // Tasks
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tasks?${queryString}`);
  }

  // Dashboard stats
  async getDashboardStats() {
    // This would combine multiple API calls for dashboard metrics
    const [leads, contacts, properties, transactions] = await Promise.all([
      this.getLeads({ limit: 1 }),
      this.getContacts({ limit: 1 }),
      this.getProperties({ limit: 1 }),
      this.getTransactions({ limit: 1 }),
    ]);

    return {
      totalLeads: leads.data?.total || 0,
      totalContacts: contacts.data?.total || 0,
      totalProperties: properties.data?.total || 0,
      totalTransactions: transactions.data?.total || 0,
    };
  }

  // Search
  async search(query) {
    return this.request(`/search?query=${encodeURIComponent(query)}`);
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }
}

const api = new ApiService();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then(data => setUser(data.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    setUser(data.data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Login Component
const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Building className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Real Estate CRM</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ onMenuClick, searchQuery, setSearchQuery }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Load notifications
    api.getNotifications()
      .then(data => setNotifications(data.data?.notifications || []))
      .catch(console.error);
  }, []);

  const handleSearch = () => {
    // Implement search functionality
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Real Estate CRM</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search contacts, leads, properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Bell className="h-6 w-6" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</span>
            </div>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:hidden">
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">CRM</span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 mb-1
                  ${activeTab === item.id 
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Leads', value: stats?.totalLeads || 0, icon: Target, color: 'bg-blue-500' },
    { label: 'Total Contacts', value: stats?.totalContacts || 0, icon: Users, color: 'bg-green-500' },
    { label: 'Properties', value: stats?.totalProperties || 0, icon: Building, color: 'bg-purple-500' },
    { label: 'Transactions', value: stats?.totalTransactions || 0, icon: DollarSign, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">New lead added</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Transaction closed</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Task completed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Lead</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Contact</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Property</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic List Component
const GenericList = ({ title, data, loading, columns, onAdd, onEdit, onDelete, onView }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add {title.slice(0, -1)}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.accessor(item)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onView && onView(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                    No {title.toLowerCase()} found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Contacts Component
const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContacts()
      .then(data => setContacts(data.data?.contacts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Name', accessor: (contact) => `${contact.first_name} ${contact.last_name}` },
    { header: 'Email', accessor: (contact) => contact.email },
    { header: 'Phone', accessor: (contact) => contact.phone_primary },
    { header: 'Type', accessor: (contact) => contact.contact_type || 'General' },
    { header: 'City', accessor: (contact) => contact.address_city || 'N/A' },
    { header: 'Created', accessor: (contact) => new Date(contact.created_at).toLocaleDateString() },
  ];

  return (
    <GenericList
      title="Contacts"
      data={contacts}
      loading={loading}
      columns={columns}
      onAdd={() => console.log('Add contact')}
      onEdit={(contact) => console.log('Edit contact:', contact)}
      onDelete={(contact) => console.log('Delete contact:', contact)}
      onView={(contact) => console.log('View contact:', contact)}
    />
  );
};

// Properties Component
const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProperties()
      .then(data => setProperties(data.data?.properties || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Address', accessor: (property) => `${property.address_street}, ${property.address_city}` },
    { header: 'Type', accessor: (property) => property.property_type },
    { header: 'Price', accessor: (property) => property.list_price ? `${property.list_price.toLocaleString()}` : 'N/A' },
    { header: 'Bedrooms', accessor: (property) => property.bedrooms || 'N/A' },
    { header: 'Bathrooms', accessor: (property) => property.bathrooms || 'N/A' },
    { header: 'Status', accessor: (property) => property.listing_status || 'Available' },
  ];

  return (
    <GenericList
      title="Properties"
      data={properties}
      loading={loading}
      columns={columns}
      onAdd={() => console.log('Add property')}
      onEdit={(property) => console.log('Edit property:', property)}
      onDelete={(property) => console.log('Delete property:', property)}
      onView={(property) => console.log('View property:', property)}
    />
  );
};

// Transactions Component
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions()
      .then(data => setTransactions(data.data?.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Property', accessor: (transaction) => transaction.property_address || 'N/A' },
    { header: 'Type', accessor: (transaction) => transaction.transaction_type },
    { header: 'Status', accessor: (transaction) => transaction.status_name || 'Active' },
    { header: 'Price', accessor: (transaction) => transaction.sale_price ? `${transaction.sale_price.toLocaleString()}` : 'N/A' },
    { header: 'Agent', accessor: (transaction) => transaction.agent_name || 'N/A' },
    { header: 'Created', accessor: (transaction) => new Date(transaction.created_at).toLocaleDateString() },
  ];

  return (
    <GenericList
      title="Transactions"
      data={transactions}
      loading={loading}
      columns={columns}
      onAdd={() => console.log('Add transaction')}
      onEdit={(transaction) => console.log('Edit transaction:', transaction)}
      onDelete={(transaction) => console.log('Delete transaction:', transaction)}
      onView={(transaction) => console.log('View transaction:', transaction)}
    />
  );
};

// Tasks Component
const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTasks()
      .then(data => setTasks(data.data?.tasks || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Title', accessor: (task) => task.task_title },
    { header: 'Priority', accessor: (task) => task.priority || 'Medium' },
    { header: 'Status', accessor: (task) => task.status || 'Pending' },
    { header: 'Due Date', accessor: (task) => task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A' },
    { header: 'Assigned To', accessor: (task) => task.assigned_user_name || 'Unassigned' },
    { header: 'Created', accessor: (task) => new Date(task.created_at).toLocaleDateString() },
  ];

  return (
    <GenericList
      title="Tasks"
      data={tasks}
      loading={loading}
      columns={columns}
      onAdd={() => console.log('Add task')}
      onEdit={(task) => console.log('Edit task:', task)}
      onDelete={(task) => console.log('Delete task:', task)}
      onView={(task) => console.log('View task:', task)}
    />
  );
};

// Communications Component
const Communications = () => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now since we don't have the communications endpoint implemented
    setTimeout(() => {
      setCommunications([
        {
          id: 1,
          communication_type: 'Email',
          direction: 'Outbound',
          subject: 'Property Showing Follow-up',
          contact_name: 'John Smith',
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          communication_type: 'Phone',
          direction: 'Inbound',
          subject: 'Inquiry about listing',
          contact_name: 'Jane Doe',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const columns = [
    { header: 'Type', accessor: (comm) => comm.communication_type },
    { header: 'Direction', accessor: (comm) => comm.direction },
    { header: 'Subject', accessor: (comm) => comm.subject },
    { header: 'Contact', accessor: (comm) => comm.contact_name },
    { header: 'Date', accessor: (comm) => new Date(comm.timestamp).toLocaleDateString() },
    { header: 'Time', accessor: (comm) => new Date(comm.timestamp).toLocaleTimeString() },
  ];

  return (
    <GenericList
      title="Communications"
      data={communications}
      loading={loading}
      columns={columns}
      onAdd={() => console.log('Add communication')}
      onEdit={(comm) => console.log('Edit communication:', comm)}
      onDelete={(comm) => console.log('Delete communication:', comm)}
      onView={(comm) => console.log('View communication:', comm)}
    />
  );
};
const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeads()
      .then(data => setLeads(data.data?.leads || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Name', accessor: (lead) => `${lead.first_name} ${lead.last_name}` },
    { header: 'Email', accessor: (lead) => lead.email },
    { header: 'Phone', accessor: (lead) => lead.phone_number },
    { header: 'Source', accessor: (lead) => lead.source_name || 'Unknown' },
    { header: 'Status', accessor: (lead) => lead.status_name || 'New' },
    { header: 'Created', accessor: (lead) => new Date(lead.created_at).toLocaleDateString() },
  ];

  const handleAdd = () => {
    console.log('Add lead');
  };

  const handleEdit = (lead) => {
    console.log('Edit lead:', lead);
  };

  const handleDelete = (lead) => {
    console.log('Delete lead:', lead);
  };

  const handleView = (lead) => {
    console.log('View lead:', lead);
  };

  return (
    <GenericList
      title="Leads"
      data={leads}
      loading={loading}
      columns={columns}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
    />
  );
};

// Main CRM Component
const CRMApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <Leads />;
      case 'contacts':
        return <div>Contacts Component</div>;
      case 'properties':
        return <div>Properties Component</div>;
      case 'transactions':
        return <div>Transactions Component</div>;
      case 'tasks':
        return <div>Tasks Component</div>;
      case 'communications':
        return <div>Communications Component</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <CRMApp /> : <LoginPage />;
};

// Root Component
export default function RealEstateCRM() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}