
import React, { useState, useEffect } from 'react';
import { Check, Package, Truck, Phone, Home, Clock, User, Box, Loader2, AlertCircle, Search, Bell, MessageCircle, Smartphone, ShoppingBag, Store, ChevronRight, Calendar, History, FileText, XCircle } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

// Extracted OrderCard to resolve TypeScript 'key' prop issue and avoid re-creation on render
const OrderCard: React.FC<{ o: Order }> = ({ o }) => {
    const navigate = useNavigate();
    
    let statusColor = 'bg-blue-100 text-blue-700';
    if (o.status === 'delivered') statusColor = 'bg-green-100 text-green-700';
    if (o.status === 'rejected') statusColor = 'bg-red-100 text-red-700';
    if (o.status === 'pending_approval') statusColor = 'bg-yellow-100 text-yellow-700';

    return (
        <div 
            onClick={() => navigate(`/track-order?orderId=${o.id}`)} 
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-pastel-primary transition-all hover:shadow-md group"
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${o.status !== 'delivered' ? 'bg-pastel-blue/20 text-pastel-primary' : 'bg-gray-50 text-gray-400'}`}>
                    {o.status === 'rejected' ? <XCircle size={20} className="text-red-500" /> : (o.status !== 'delivered' ? <Truck size={20} /> : <Package size={20} />)}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">#{o.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                            {o.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(o.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-gray-700">₹{o.totalAmount}</span>
                    </div>
                </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-pastel-primary" />
        </div>
    );
};

const OrderTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlOrderId = searchParams.get('orderId');
  const { user, isAuthenticated } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputId, setInputId] = useState('');
  
  // User's order history state
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      if (urlOrderId) {
          const foundOrder = await db.getOrder(urlOrderId);
          setOrder(foundOrder);
      } else {
          setOrder(null);
      }
      setLoading(false);
    };

    fetchOrderData();
  }, [urlOrderId]);

  // Fetch user's orders when on the landing page (no specific ID)
  useEffect(() => {
    const fetchMyOrders = async () => {
        if (isAuthenticated && user?.email && !urlOrderId) {
            try {
                const orders = await db.getOrdersByEmail(user.email);
                setMyOrders(orders);
            } catch (e) {
                console.error("Error fetching orders:", e);
            }
        }
    };
    fetchMyOrders();
  }, [isAuthenticated, user, urlOrderId]);

  // Determine current timeline step based on status
  useEffect(() => {
    if (!order) return;
    
    let step = 0;
    switch(order.status) {
        case 'pending_approval': step = 0; break;
        case 'rejected': step = 0; break; // Stays at 0 but marked failed
        case 'approved': 
        case 'placed': // Fallback for old orders
            step = 1; break;
        case 'packed': step = 2; break;
        case 'out_for_delivery': step = 3; break;
        case 'delivered': step = 4; break;
        default: step = 0;
    }
    setCurrentStep(step);
  }, [order]);

  const handleManualTrack = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputId.trim()) return;
      navigate(`/track-order?orderId=${inputId.trim()}`);
  };

  const steps = [
    { id: 0, title: 'Pending Approval', sub: 'Verifying Prescription', time: order ? new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', icon: FileText, completed: currentStep >= 0 },
    { id: 1, title: 'Order Approved', sub: 'Prescription Verified', time: 'Completed', icon: Check, completed: currentStep >= 1 },
    { id: 2, title: 'Packed', sub: 'Processed by shop', time: 'In Progress', icon: Package, completed: currentStep >= 2 },
    { id: 3, title: 'Dispatched', sub: 'Partner is on the way', time: 'Estimated 15 mins', icon: Truck, completed: currentStep >= 3 },
    { id: 4, title: 'Delivered', sub: `Expected in ${order?.deliveryTime || 'soon'}`, time: '--:--', icon: Home, completed: currentStep >= 4 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-pastel-primary mb-2" size={32} />
        <p className="text-gray-500 font-medium">Retrieving status...</p>
      </div>
    );
  }

  // --- CASE: NO ORDER ID (SEARCH VIEW + ACTIVE ORDERS) ---
  if (!order) {
    const liveOrders = myOrders.filter(o => o.status !== 'delivered');
    const pastOrders = myOrders.filter(o => o.status === 'delivered');

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 pt-10 sm:pt-20">
        <div className="w-full max-w-6xl space-y-8 animate-slide-up">
            
            {/* Search Box - Centered and limited width */}
            <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-pastel-primary/5 border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="bg-pastel-blue/30 p-4 rounded-full">
                        <Truck className="text-pastel-primary w-10 h-10" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Track Delivery</h1>
                <p className="text-gray-500 text-center mb-8 text-sm">Enter your Order ID to see real-time status.</p>

                <form onSubmit={handleManualTrack} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            placeholder="Order ID (e.g. ORD-4521)"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pastel-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!inputId}
                        className="w-full bg-pastel-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/20 hover:bg-pastel-secondary transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Truck size={18} /> Track Status
                    </button>
                </form>
            </div>

            {/* Split Order History Blocks - Side by Side Grid */}
            {isAuthenticated && (myOrders.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in">
                    
                    {/* Live Orders Block */}
                    {liveOrders.length > 0 && (
                        <div className="bg-white/50 p-6 rounded-3xl border border-gray-100/50">
                             <h3 className="text-lg font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pastel-secondary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pastel-secondary"></span>
                                </span>
                                Live Orders
                             </h3>
                             <div className="space-y-3">
                                {liveOrders.map(o => <OrderCard key={o.id} o={o} />)}
                             </div>
                        </div>
                    )}

                    {/* Previous Orders Block */}
                    {pastOrders.length > 0 && (
                        <div className={`bg-white/50 p-6 rounded-3xl border border-gray-100/50 ${liveOrders.length === 0 ? 'md:col-span-2 max-w-md mx-auto w-full' : ''}`}>
                             <h3 className="text-lg font-bold text-gray-500 mb-4 px-2 flex items-center gap-2">
                                <History size={18} /> Previous Orders
                             </h3>
                             <div className="space-y-3 opacity-90 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                {pastOrders.map(o => <OrderCard key={o.id} o={o} />)}
                             </div>
                        </div>
                    )}

                </div>
            )}
            
            {isAuthenticated && myOrders.length === 0 && (
                 <div className="text-center mt-6 p-4 bg-gray-100 rounded-2xl max-w-md mx-auto">
                    <p className="text-sm text-gray-500">You haven't placed any orders yet.</p>
                 </div>
            )}

            {!isAuthenticated && (
                <div className="text-center mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 max-w-md mx-auto">
                    <p className="text-sm text-gray-600 mb-2">Login to see your recent orders here.</p>
                    <Link to="/" className="text-sm font-bold text-pastel-primary hover:underline">Go to Home</Link>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center max-w-md mx-auto">
                <p className="text-xs text-gray-400">
                    Need help? <Link to="/" className="text-pastel-primary hover:underline">Contact Support</Link>
                </p>
            </div>
        </div>
      </div>
    );
  }

  // --- CASE: DASHBOARD VIEW (Order Found) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="text-pastel-primary" /> Order #{order.id}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700 animate-pulse'
            }`}>
                {order.status === 'delivered' ? <Check size={12}/> : 
                 order.status === 'rejected' ? <XCircle size={12}/> :
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>} 
                {order.status.replace('_', ' ')}
            </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        
        {/* Rejected Alert */}
        {order.status === 'rejected' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-4 items-start">
                <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
                <div>
                    <h3 className="font-bold text-red-800 text-lg">Order Rejected</h3>
                    <p className="text-sm text-red-700 mt-1 mb-2">Your order could not be processed due to issues with the prescription or details provided.</p>
                    {order.rejectionReason && (
                        <div className="bg-white/50 p-3 rounded-xl text-sm font-medium text-red-900 border border-red-100">
                            <strong>Reason:</strong> {order.rejectionReason}
                        </div>
                    )}
                    <p className="text-xs text-red-500 mt-4">Please try placing a new order with a valid prescription or contact support.</p>
                </div>
            </div>
        )}

        {/* Map & Driver Card (Only show if approved and active) */}
        {order.status !== 'rejected' && order.status !== 'pending_approval' && order.status !== 'approved' && order.status !== 'placed' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                {/* Simulated Live Map */}
                <div className="h-64 w-full bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Bangalore.jpg')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    
                    {/* Route Path Animation - Only if not delivered */}
                    {order.status !== 'delivered' && (
                         <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                            <path d="M 40% 40% Q 50% 60% 60% 50%" stroke="#009688" strokeWidth="4" fill="none" strokeDasharray="8 4" className="animate-[dash_20s_linear_infinite]" />
                        </svg>
                    )}

                    {/* Driver Marker */}
                    {order.status !== 'delivered' && (
                        <div className="absolute top-[40%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-1000" style={{ transform: `translate(${(currentStep - 2) * 10}px, ${(currentStep - 2) * 5}px)` }}>
                            <div className="bg-white p-1.5 rounded-full shadow-md">
                                <div className="bg-pastel-primary w-4 h-4 rounded-full animate-ping absolute opacity-75"></div>
                                <div className="bg-pastel-primary w-4 h-4 rounded-full relative border-2 border-white"></div>
                            </div>
                            <span className="bg-white text-[10px] px-2 py-0.5 rounded shadow mt-1 font-bold text-gray-700">Driver</span>
                        </div>
                    )}

                    {/* Destination Marker */}
                    <div className="absolute top-[50%] left-[60%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                        <div className="bg-gray-800 p-2 rounded-full shadow-lg text-white">
                            <Home size={16} />
                        </div>
                    </div>
                </div>

                {/* Driver Info Bar */}
                {order.status !== 'delivered' && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                                <User size={24} className="text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Ramesh Kumar</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    GenericPlus Logistics • 4.8★
                                </p>
                            </div>
                        </div>
                        <button className="p-2.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors shadow-sm">
                            <Phone size={18} />
                        </button>
                    </div>
                )}
                {order.status === 'delivered' && (
                    <div className="absolute bottom-4 left-4 right-4 bg-green-50/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-green-100 flex items-center gap-3">
                         <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <Check size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-green-800">Delivered Successfully</h3>
                            <p className="text-xs text-green-600">Package handed over to security.</p>
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* Timeline Tracking Block */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={18} className="text-pastel-primary" /> Delivery Timeline
                </h2>
                {order.status !== 'rejected' && (
                    <span className="text-xs text-gray-400 font-medium">Est. Delivery: {order.deliveryTime}</span>
                )}
            </div>
            
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                {steps.map((step, idx) => {
                    // Logic to determine completion styling
                    const isPassed = step.completed;
                    const isCurrent = idx === currentStep;
                    const isRejected = order.status === 'rejected';

                    if (isRejected && idx > 0) return null; // Hide subsequent steps if rejected

                    return (
                        <div key={idx} className={`relative pl-8 transition-all duration-500 ${isPassed || isCurrent ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[23px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-colors duration-500 z-10 ${
                                isRejected && idx === 0 ? 'bg-red-500' :
                                isPassed 
                                ? 'bg-pastel-primary' 
                                : (isCurrent ? 'bg-orange-400 animate-pulse' : 'bg-gray-200')
                            }`}>
                                {isRejected && idx === 0 ? <XCircle size={12} className="text-white"/> : 
                                 isPassed ? <Check size={12} className="text-white" /> : null}
                            </div>

                            <div>
                                <h3 className={`font-bold text-sm ${isRejected && idx === 0 ? 'text-red-600' : (isPassed || isCurrent ? 'text-gray-900' : 'text-gray-700')}`}>
                                    {isRejected && idx === 0 ? 'Verification Failed' : step.title}
                                </h3>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500">{isRejected && idx === 0 ? 'Order Rejected by Admin' : step.sub}</p>
                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded">{step.time}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Package Contents Accordion (Simplified) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Box size={18} className="text-pastel-primary" /> Package Details
            </h2>

             <div className="mb-4 bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><Store size={12}/> Shop Type</span>
                <span className="text-sm font-bold text-pastel-primary bg-pastel-blue/30 px-3 py-1 rounded-full">Generic Medical Store</span>
            </div>

            <div className="space-y-4">
                {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                         <span className="font-bold text-gray-700 text-sm">₹{item.genericPrice}</span>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center font-bold text-gray-800">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
        </div>

        <Link to="/track-order" onClick={() => setOrder(null)} className="block w-full text-center py-4 text-gray-400 hover:text-pastel-primary font-medium text-sm transition-colors">
            Track Another Order
        </Link>

      </div>
    </div>
  );
};

export default OrderTrackingPage;
