
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, LogOut, 
  Plus, Edit2, Trash2, Save, X, Activity, DollarSign, AlertTriangle, FileText,
  Moon, Sun, ShieldCheck, TrendingUp, Users, Clock, BarChart3, ChevronUp, ArrowRight, Calendar,
  Bell, UserPlus, LogIn, Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle2, Eye, XCircle, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/db';
import { Medicine, Order, MedicineCategory, ActivityLog, AdminNotification } from '../../types';
import { useNavigate } from 'react-router-dom';

// --- Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-start justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</h3>
      {subValue && (
        <div className="flex items-center gap-1 text-xs">
           <span className={`${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'} flex items-center font-bold`}>
             {trend === 'up' && <ChevronUp size={12} />}
             {subValue}
           </span>
           <span className="text-gray-400">vs last month</span>
        </div>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-opacity-20`}>
      <Icon size={20} />
    </div>
  </div>
);

const NotificationItem: React.FC<{ notif: AdminNotification }> = ({ notif }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
        <div className={`p-2 rounded-full mt-1 ${notif.type === 'registration' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {notif.type === 'registration' ? <UserPlus size={14} /> : <LogIn size={14} />}
        </div>
        <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{notif.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{notif.user_email} • IP: {notif.ip_address}</p>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">{new Date(notif.created_at).toLocaleString()}</span>
        </div>
    </div>
);

// --- Custom Bar Chart Component ---
const RevenueChart: React.FC<{ orders: Order[] }> = ({ orders }) => {
  // Calculate last 7 days revenue
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const data = last7Days.map(date => {
    const dayTotal = orders
      .filter(o => new Date(o.createdAt).toISOString().split('T')[0] === date)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
    return { date, value: dayTotal };
  });

  const maxVal = Math.max(...data.map(d => d.value), 100); // Avoid div by zero

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <BarChart3 size={18} className="text-pastel-primary"/> Revenue Analytics
        </h3>
        <select className="bg-gray-50 dark:bg-slate-700 border-none text-xs rounded-lg px-2 py-1 outline-none text-gray-500 dark:text-gray-300">
          <option>Last 7 Days</option>
        </select>
      </div>
      
      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((item, idx) => {
           const height = (item.value / maxVal) * 100;
           const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
           return (
             <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex justify-center items-end h-full bg-gray-50 dark:bg-slate-700/50 rounded-t-lg overflow-hidden">
                    <div 
                      className="w-full bg-pastel-primary/80 group-hover:bg-pastel-primary transition-all duration-500 rounded-t-md relative"
                      style={{ height: `${height}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ₹{item.value}
                      </div>
                    </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{dayName}</span>
             </div>
           )
        })}
      </div>
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'medicines' | 'orders' | 'settings'>('overview');
  
  // Data State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);
  
  // Image Upload State
  const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url');
  const [imageFileError, setImageFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Stats
  const [stats, setStats] = useState({
      todayOrders: 0,
      monthOrders: 0,
      totalRevenue: 0,
      pendingDeliveries: 0,
      lowStockCount: 0,
      expiringCount: 0,
      activeUsers: 0,
      topMedicines: [] as {name: string, count: number}[]
  });

  useEffect(() => {
    if (!user) {
        navigate('/admin/login');
        return;
    } 
    if (user.role !== 'admin' || user.email !== 'admin@medigen.com') {
        navigate('/'); 
    }
  }, [user, navigate]);

  const fetchData = async () => {
    // setLoading(true); // Don't block UI on refresh
    const [medsData, ordersData, notifsData] = await Promise.all([
      db.getMedicines(),
      db.getAllOrders(),
      db.getAdminNotifications()
    ]);
    
    setMedicines(medsData);
    setOrders(ordersData);
    setNotifications(notifsData);

    // Calculate Analytics
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const todayOrders = ordersData.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === todayStr).length;
    const monthOrders = ordersData.filter(o => new Date(o.createdAt).getMonth() === currentMonth).length;
    const pending = ordersData.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length;
    const revenue = ordersData.filter(o => o.status !== 'rejected').reduce((acc, o) => acc + o.totalAmount, 0);
    const lowStock = medsData.filter(m => m.stock < 20).length;
    
    // Check expiry
    const expiring = medsData.filter(m => {
        const exp = new Date(m.expiryDate);
        return exp > now && exp < nextMonth;
    }).length;

    const users = new Set(ordersData.map(o => o.customerEmail)).size;

    // Top Medicines Logic
    const salesMap: Record<string, number> = {};
    ordersData.forEach(o => {
        if(o.status !== 'rejected') {
            o.items.forEach(i => {
                salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
            });
        }
    });
    const topMeds = Object.entries(salesMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    setStats({
        todayOrders,
        monthOrders,
        totalRevenue: revenue,
        pendingDeliveries: pending,
        lowStockCount: lowStock,
        expiringCount: expiring,
        activeUsers: users,
        topMedicines: topMeds
    });

    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role === 'admin' && user.email === 'admin@medigen.com') {
        fetchData();
        // Poll for real-time notifications
        const interval = setInterval(fetchData, 5000); 
        return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
      logout();
      navigate('/admin/login');
  };

  const handleDeleteMed = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
      await db.deleteMedicine(id);
      fetchData();
    }
  };

  const handleSaveMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;

    // Simple validation for required fields
    if (!editingMed.imageUrl) {
        alert("Please provide an image for the medicine (URL or File Upload).");
        return;
    }

    const splitStr = (str: any) => typeof str === 'string' ? str.split(',').map((s: string) => s.trim()).filter(Boolean) : (str || []);

    const medToSave: Medicine = {
      id: editingMed.id || `med_${Date.now()}`,
      name: editingMed.name || 'New Medicine',
      brandExample: editingMed.brandExample || '',
      saltComposition: editingMed.saltComposition || '',
      batchNumber: editingMed.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
      stripSize: Number(editingMed.stripSize) || 10,
      category: editingMed.category || MedicineCategory.PAIN,
      commonUse: Array.isArray(editingMed.commonUse) ? editingMed.commonUse : splitStr(editingMed.commonUse),
      description: editingMed.description || '',
      genericPrice: Number(editingMed.genericPrice) || 0,
      brandedPrice: Number(editingMed.brandedPrice) || 0,
      stock: Number(editingMed.stock) || 0,
      expiryDate: editingMed.expiryDate || '2025-12-31',
      marketRates: editingMed.marketRates || [],
      imageUrl: editingMed.imageUrl,
      dosage: {
        normal: editingMed.dosage?.normal || '',
        maxSafe: editingMed.dosage?.maxSafe || '',
        overdoseWarning: editingMed.dosage?.overdoseWarning || ''
      },
      details: {
        mechanism: editingMed.details?.mechanism || '',
        storage: editingMed.details?.storage || '',
        sideEffects: Array.isArray(editingMed.details?.sideEffects) ? editingMed.details.sideEffects : splitStr(editingMed.details?.sideEffects),
        contraindications: Array.isArray(editingMed.details?.contraindications) ? editingMed.details.contraindications : splitStr(editingMed.details?.contraindications)
      }
    };

    await db.saveMedicine(medToSave);
    setShowModal(false);
    setEditingMed(null);
    fetchData();
  };

  const openEditModal = (med?: Medicine) => {
    setImageInputMode('url');
    setImageFileError('');
    if (med) {
        setEditingMed({
            ...med,
            commonUse: med.commonUse.join(', '),
            details: {
                ...med.details,
                sideEffects: med.details.sideEffects.join(', '),
                contraindications: med.details.contraindications.join(', ')
            }
        });
        // Auto-detect if existing is Data URI to set mode appropriately (optional, defaulting to URL is fine)
        if (med.imageUrl.startsWith('data:')) {
            setImageInputMode('file');
        }
    } else {
        setEditingMed({
            name: '',
            brandExample: '',
            saltComposition: '',
            batchNumber: '',
            stripSize: 10,
            category: MedicineCategory.FEVER,
            marketRates: [],
            stock: 100,
            expiryDate: '',
            imageUrl: '', // Start empty
            description: '',
            dosage: { normal: '', maxSafe: '', overdoseWarning: '' },
            details: { mechanism: '', sideEffects: '', contraindications: '', storage: '' },
            commonUse: ''
        });
    }
    setShowModal(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (status === 'rejected') {
        const reason = window.prompt("Please enter a reason for rejecting this order:");
        if (reason) {
            await db.updateOrderStatus(orderId, status, reason);
        } else {
            return; // Cancel rejection if no reason given
        }
    } else {
        await db.updateOrderStatus(orderId, status);
    }
    fetchData();
  };

  const handleViewPrescription = (prescriptionUrl: string) => {
      const win = window.open();
      if(win) {
          win.document.write(`<iframe src="${prescriptionUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        setImageFileError('File size exceeds 5MB limit.');
        return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setImageFileError('Invalid file type. Only JPG, PNG, and WEBP allowed.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setEditingMed({ ...editingMed, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Helper for expiry check
  const getExpiryStatus = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', color: 'text-red-600 bg-red-100', expired: true };
    if (diffDays < 30) return { label: 'Expiring Soon', color: 'text-orange-600 bg-orange-100', expired: false };
    return { label: 'Valid', color: 'text-green-600 bg-green-100', expired: false };
  };

  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
          <div className="animate-spin mb-4"><Package size={32} /></div>
          <p>Initializing Admin Portal...</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 fixed h-full z-20 hidden lg:flex flex-col transition-colors duration-300">
        <div className="h-20 flex items-center px-8 border-b border-gray-100 dark:border-slate-700 gap-2">
           <ShieldCheck size={28} className="text-pastel-primary" />
           <span className="font-bold text-xl text-pastel-primary tracking-tight">MediGen<span className="text-gray-800 dark:text-white">Admin</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
           <button 
             onClick={() => setActiveTab('overview')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'overview' ? 'bg-pastel-primary text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
           >
             <LayoutDashboard size={20} /> Overview
           </button>
           <button 
             onClick={() => setActiveTab('medicines')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'medicines' ? 'bg-pastel-primary text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
           >
             <Package size={20} /> Medicines
           </button>
           <button 
             onClick={() => setActiveTab('orders')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'orders' ? 'bg-pastel-primary text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
           >
             <ShoppingCart size={20} /> Orders
           </button>
           <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
             <button 
               onClick={() => setActiveTab('settings')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-pastel-primary text-white shadow-lg shadow-teal-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
             >
               <Settings size={20} /> Settings
             </button>
           </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                 AD
              </div>
              <div>
                 <p className="text-sm font-bold text-gray-800 dark:text-white">Super Admin</p>
                 <p className="text-xs text-gray-400">admin@medigen.com</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg text-sm font-bold transition-colors">
              <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 p-8">
        
        {/* Top Header Mobile */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
            <span className="font-bold text-xl text-pastel-primary">MediGenAdmin</span>
            <button onClick={handleLogout}><LogOut size={20} className="text-gray-500 dark:text-gray-400"/></button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
           <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, here's what's happening today.</p>
                  </div>
                  <div className="text-right hidden sm:block">
                     <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Time</p>
                     <p className="text-xl font-mono font-bold text-gray-700 dark:text-gray-200">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
              </div>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Total Revenue" 
                    value={`₹${stats.totalRevenue.toLocaleString()}`} 
                    subValue="12%"
                    trend="up"
                    icon={DollarSign} 
                    color="bg-green-500" 
                 />
                 <StatCard 
                    title="Orders Today" 
                    value={stats.todayOrders} 
                    subValue={`${stats.monthOrders} this month`}
                    trend={stats.todayOrders > 0 ? 'up' : 'neutral'}
                    icon={ShoppingCart} 
                    color="bg-blue-500" 
                 />
                 <StatCard 
                    title="Pending Deliveries" 
                    value={stats.pendingDeliveries}
                    subValue="Action needed"
                    trend="neutral"
                    icon={Clock} 
                    color="bg-orange-500" 
                 />
                 <StatCard 
                    title="Active Users" 
                    value={stats.activeUsers} 
                    subValue="Total Customers"
                    trend="up"
                    icon={Users} 
                    color="bg-purple-500" 
                 />
              </div>

              {/* Charts & Lists Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
                 {/* Revenue Chart */}
                 <div className="lg:col-span-2">
                    <RevenueChart orders={orders} />
                 </div>

                 {/* Real-time Notifications */}
                 <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 h-full flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Bell size={18} className="text-pastel-primary" /> Real-time Alerts
                        <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar max-h-[250px]">
                        {notifications.length > 0 ? notifications.map((notif, idx) => (
                            <NotificationItem key={idx} notif={notif} />
                        )) : (
                            <p className="text-center text-gray-400 py-4 text-sm">No new alerts.</p>
                        )}
                    </div>
                 </div>
              </div>

              {/* Bottom Row: Low Stock & Expiry Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Low Stock Alerts */}
                 <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" /> Low Stock
                        </h3>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{stats.lowStockCount} items</span>
                     </div>
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {medicines.filter(m => m.stock < 20).slice(0, 5).map(m => (
                            <div key={m.id} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{m.name}</p>
                                    <p className="text-xs text-gray-400">ID: {m.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-red-500">{m.stock} left</p>
                                    <button onClick={() => { setEditingMed(m); setShowModal(true); }} className="text-[10px] text-blue-500 hover:underline">Restock</button>
                                </div>
                            </div>
                        ))}
                        {stats.lowStockCount === 0 && (
                            <div className="text-center py-8 text-green-500 text-sm font-medium bg-green-50 dark:bg-green-900/10 rounded-xl">
                                All inventory levels healthy!
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Expiry Alerts */}
                 <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Calendar size={18} className="text-orange-500" /> Expiring Soon
                        </h3>
                        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{stats.expiringCount} items</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {medicines
                            .filter(m => {
                                const expiry = new Date(m.expiryDate);
                                const today = new Date();
                                const nextMonth = new Date();
                                nextMonth.setDate(nextMonth.getDate() + 30);
                                return expiry > today && expiry < nextMonth;
                            })
                            .slice(0, 5)
                            .map(m => (
                                <div key={m.id} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{m.name}</p>
                                        <p className="text-xs text-gray-400">Batch: {m.batchNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-orange-500">{m.expiryDate}</p>
                                        <button onClick={() => { setEditingMed(m); setShowModal(true); }} className="text-[10px] text-blue-500 hover:underline">Update</button>
                                    </div>
                                </div>
                        ))}
                        {stats.expiringCount === 0 && (
                            <div className="text-center py-8 text-green-500 text-sm font-medium bg-green-50 dark:bg-green-900/10 rounded-xl">
                                No items expiring this month.
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Top Selling Medicines */}
                 <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 h-full">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-pastel-primary" /> Most Sold
                    </h3>
                    <div className="space-y-4">
                        {stats.topMedicines.length > 0 ? stats.topMedicines.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-pastel-blue text-pastel-primary flex items-center justify-center font-bold text-xs">
                                        #{idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count} sold</span>
                            </div>
                        )) : (
                            <div className="text-center text-gray-400 py-4 text-sm">No sales data yet.</div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
           <div className="animate-slide-up space-y-6">
              <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Medicine Inventory</h1>
                 <button 
                   onClick={() => openEditModal()}
                   className="bg-pastel-primary text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-pastel-secondary transition-colors shadow-lg shadow-teal-500/20"
                 >
                    <Plus size={18} /> Add Medicine
                 </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-medium">
                          <tr>
                             <th className="p-4">Image</th>
                             <th className="p-4">Details</th>
                             <th className="p-4">Batch Info</th>
                             <th className="p-4">Pricing (Per Strip)</th>
                             <th className="p-4">Stock</th>
                             <th className="p-4">Expiry Status</th>
                             <th className="p-4 text-center">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:text-gray-300">
                          {medicines.map(med => {
                             const status = getExpiryStatus(med.expiryDate);
                             return (
                                 <tr key={med.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-white">
                                        <img 
                                            src={med.imageUrl} 
                                            alt={med.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Img'; }}
                                        />
                                    </div>
                                    </td>
                                    <td className="p-4">
                                    <div className="font-bold text-gray-800 dark:text-white">{med.name}</div>
                                    <div className="text-xs text-gray-400">Ex: {med.brandExample}</div>
                                    <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-slate-600 mt-1 inline-block">{med.category}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono text-xs text-gray-600 dark:text-gray-300">{med.batchNumber || 'N/A'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium">₹{med.genericPrice}</div>
                                        <div className="text-xs text-gray-500">for {med.stripSize} tabs</div>
                                    </td>
                                    <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${med.stock < 20 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {med.stock} Units
                                    </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{med.expiryDate}</span>
                                            <span className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded w-fit ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                    <button 
                                        onClick={() => openEditModal(med)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteMed(med.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                    </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
           <div className="animate-slide-up space-y-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order Management</h1>
              
              <div className="space-y-4">
                 {orders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4 transition-colors">
                       <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Order #{order.id}</h3>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                                        order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                        order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer: <span className="font-medium text-gray-700 dark:text-gray-200">{order.customerEmail}</span></p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-bold text-pastel-primary">₹{order.totalAmount}</span> • {order.items.length} Items</p>
                                {order.status === 'rejected' && order.rejectionReason && (
                                    <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                        <strong>Rejection Reason:</strong> {order.rejectionReason}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {order.status === 'pending_approval' ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                                            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> Approve
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        value={order.status}
                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                                        className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-pastel-primary outline-none cursor-pointer"
                                        disabled={order.status === 'rejected'}
                                    >
                                        <option value="pending_approval" disabled>Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="packed">Packed</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="rejected" disabled>Rejected</option>
                                    </select>
                                )}
                            </div>
                       </div>
                       
                       {/* Prescription Review Section */}
                       {order.prescriptionUrl && (
                           <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-2">
                               <div className="flex items-center gap-2 mb-2">
                                   <FileText size={16} className="text-gray-400"/>
                                   <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Prescription Attached</span>
                               </div>
                               <button 
                                   onClick={() => handleViewPrescription(order.prescriptionUrl!)}
                                   className="text-sm text-pastel-primary hover:underline flex items-center gap-1 font-medium bg-pastel-blue/10 px-3 py-2 rounded-lg w-fit"
                               >
                                   <Eye size={14} /> View Prescription Image
                               </button>
                           </div>
                       )}
                    </div>
                 ))}
                 {orders.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
                       <ShoppingCart className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                       <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
            <div className="animate-slide-up space-y-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Settings</h1>
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Moon size={20} className="text-pastel-primary" /> Appearance
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-white">Theme Preference</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode for the admin panel.</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                            <button 
                                onClick={toggleTheme}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-primary focus:ring-offset-2 ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-sm flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}>
                                    {theme === 'dark' ? <Moon size={12} className="text-slate-700" /> : <Sun size={12} className="text-amber-500" />}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-500" /> Account Security
                    </h3>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-500">Super Admin Access</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-600 mt-1">You are logged in as the Super Admin (admin@medigen.com). Ensure you logout when finished to maintain security.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up transition-colors">
             <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    {editingMed?.id ? <Edit2 size={24}/> : <Plus size={24}/>}
                    {editingMed?.id ? 'Edit Medicine' : 'Add New Medicine'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleSaveMed} className="p-6 space-y-8">
                {/* 1. Basic Info Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-pastel-primary uppercase tracking-wide border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                        <Package size={16} /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Generic Name</label>
                            <input 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.name || ''}
                                onChange={e => setEditingMed({...editingMed, name: e.target.value})}
                                required
                                placeholder="e.g. Paracetamol 650mg"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Brand Example</label>
                            <input 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.brandExample || ''}
                                onChange={e => setEditingMed({...editingMed, brandExample: e.target.value})}
                                required
                                placeholder="e.g. Dolo 650"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Salt Composition</label>
                            <input 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.saltComposition || ''}
                                onChange={e => setEditingMed({...editingMed, saltComposition: e.target.value})}
                                placeholder="e.g. Paracetamol IP 650mg"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
                            <select 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors cursor-pointer"
                                value={editingMed?.category || MedicineCategory.FEVER}
                                onChange={e => setEditingMed({...editingMed, category: e.target.value})}
                            >
                                {Object.values(MedicineCategory).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Image Upload Section */}
                        <div className="md:col-span-2 group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Medicine Image</label>
                            
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                {/* Toggle Tabs */}
                                <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1 mb-4 w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('url')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${imageInputMode === 'url' ? 'bg-white dark:bg-slate-600 text-pastel-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <LinkIcon size={14} /> Image URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('file')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${imageInputMode === 'file' ? 'bg-white dark:bg-slate-600 text-pastel-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <Upload size={14} /> Upload File
                                    </button>
                                </div>

                                {/* URL Input */}
                                {imageInputMode === 'url' && (
                                    <div className="relative">
                                        <input 
                                            className="w-full p-3 pl-10 bg-white dark:bg-slate-600 dark:text-white rounded-xl border border-gray-200 dark:border-slate-500 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                            value={editingMed?.imageUrl && !editingMed.imageUrl.startsWith('data:') ? editingMed.imageUrl : ''}
                                            onChange={e => setEditingMed({...editingMed, imageUrl: e.target.value})}
                                            placeholder="https://example.com/medicine-image.jpg"
                                        />
                                        <ImageIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                )}

                                {/* File Upload Input */}
                                {imageInputMode === 'file' && (
                                    <div>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl p-6 text-center cursor-pointer hover:border-pastel-primary hover:bg-pastel-blue/5 dark:hover:bg-slate-600 transition-all group"
                                        >
                                            <div className="bg-gray-100 dark:bg-slate-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="text-gray-500 dark:text-gray-300 group-hover:text-pastel-primary" size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (Max 5MB)</p>
                                        </div>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        {imageFileError && (
                                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                <AlertTriangle size={12} /> {imageFileError}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Preview */}
                                {editingMed?.imageUrl && (
                                    <div className="mt-4 flex items-start gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0 bg-gray-50">
                                            <img src={editingMed.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Image Preview</p>
                                            <p className="text-[10px] text-gray-400 truncate">{imageInputMode === 'file' && editingMed.imageUrl.startsWith('data:') ? 'Local File Selected' : editingMed.imageUrl}</p>
                                            <button 
                                                type="button"
                                                onClick={() => setEditingMed({...editingMed, imageUrl: ''})}
                                                className="text-[10px] text-red-500 hover:underline mt-1"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                        <CheckCircle2 className="text-green-500" size={20} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2 group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
                            <textarea 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors min-h-[80px]"
                                value={editingMed?.description || ''}
                                onChange={e => setEditingMed({...editingMed, description: e.target.value})}
                                placeholder="Brief description of the medicine..."
                            />
                        </div>
                        <div className="md:col-span-2 group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Common Uses (Comma Separated)</label>
                            <input 
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.commonUse || ''}
                                onChange={e => setEditingMed({...editingMed, commonUse: e.target.value})}
                                placeholder="Fever, Pain, Headache"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Pricing & Stock */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-pastel-primary uppercase tracking-wide border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                        <DollarSign size={16} /> Pricing & Inventory
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Generic Price (₹)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.genericPrice || ''}
                                onChange={e => setEditingMed({...editingMed, genericPrice: e.target.value})}
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Branded Price (₹)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.brandedPrice || ''}
                                onChange={e => setEditingMed({...editingMed, brandedPrice: e.target.value})}
                                required
                            />
                        </div>
                         <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tablets per Strip</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.stripSize || ''}
                                onChange={e => setEditingMed({...editingMed, stripSize: e.target.value})}
                                required
                                placeholder="10"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Stock Units</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.stock || ''}
                                onChange={e => setEditingMed({...editingMed, stock: e.target.value})}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Batch Number</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.batchNumber || ''}
                                onChange={e => setEditingMed({...editingMed, batchNumber: e.target.value})}
                                placeholder="e.g. BTC-001"
                            />
                        </div>
                         <div className="group">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Expiry Date</label>
                            <input 
                                type="date"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-xl border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-pastel-primary outline-none transition-colors"
                                value={editingMed?.expiryDate || ''}
                                onChange={e => setEditingMed({...editingMed, expiryDate: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Medical Details & Save Button */}
                <div className="pt-6 flex gap-3 border-t border-gray-100 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 z-10">
                   <button 
                     type="button" 
                     onClick={() => setShowModal(false)}
                     className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 bg-pastel-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-pastel-secondary transition-all flex justify-center items-center gap-2"
                   >
                     <Save size={18} /> Save Medicine
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
