
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ChevronRight, Package, Info, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, totalDiscount, itemCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  // Billing Constants
  const DELIVERY_THRESHOLD = 200;
  const PLATFORM_FEE = 10;
  
  // Standard max fee for estimate before distance calculation
  const EST_DELIVERY_FEE = 40; 
  
  // Calculate raw subtotal (without discounts) for display
  const rawSubtotal = items.reduce((acc, item) => acc + (item.quantity * (item.genericPrice / item.stripSize)), 0);
  
  const isFreeDelivery = cartTotal > DELIVERY_THRESHOLD;
  const finalTotal = cartTotal + (isFreeDelivery ? 0 : EST_DELIVERY_FEE) + PLATFORM_FEE;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-full shadow-lg mb-6 animate-pulse-slow">
            <ShoppingBag size={48} className="text-pastel-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs text-center">Looks like you haven't added any medicines yet.</p>
        <Link 
            to="/" 
            className="bg-pastel-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-pastel-secondary transition-all shadow-lg shadow-teal-500/20"
        >
            Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingBag className="text-pastel-primary" /> Shopping Cart
            <span className="text-sm font-medium text-gray-400 bg-white px-2 py-0.5 rounded-lg border border-gray-100 ml-2">{items.length} items</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Cart Items List */}
            <div className="flex-1 space-y-4">
                {items.map(item => {
                    const pricePerTab = item.genericPrice / item.stripSize;
                    const itemTotal = item.quantity * pricePerTab;
                    // Calculate discount for this item for display
                    let discount = 0;
                    if(item.quantity >= 100) discount = 10;
                    else if(item.quantity >= 50) discount = 5;

                    return (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md group">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500">Generic for {item.brandExample}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {item.stripSize} tabs/strip • ₹{pricePerTab.toFixed(2)}/tab
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-800">₹{(itemTotal * (1 - discount/100)).toFixed(2)}</div>
                                        {discount > 0 && (
                                            <div className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded inline-block">
                                                {discount}% Off
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-2">
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-pastel-primary transition-colors disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-pastel-primary transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bill Summary */}
            <div className="w-full lg:w-96 shrink-0">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Bill Details</h3>
                    
                    <div className="space-y-3 mb-6 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal (MRP)</span>
                            <span>₹{rawSubtotal.toFixed(2)}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span className="flex items-center gap-1"><Percent size={14}/> Bulk Discount</span>
                                <span>- ₹{totalDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery Fee</span>
                            {isFreeDelivery ? <span className="text-green-500">Free</span> : <span>₹{EST_DELIVERY_FEE.toFixed(2)}</span>}
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Platform Fee</span>
                            <span>₹{PLATFORM_FEE.toFixed(2)}</span>
                        </div>
                        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                            <span className="font-bold text-lg text-gray-800">Total Pay</span>
                            <span className="text-2xl font-extrabold text-pastel-primary">₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {!isFreeDelivery && (
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl mb-6 text-xs text-yellow-700 flex gap-2">
                            <Info size={16} className="shrink-0" />
                            Add medicines worth ₹{(DELIVERY_THRESHOLD - cartTotal).toFixed(0)} more for free delivery.
                        </div>
                    )}

                    {isAuthenticated ? (
                        <Link 
                            to="/checkout"
                            className="w-full bg-pastel-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-pastel-secondary transition-all flex items-center justify-center gap-2 group"
                        >
                            Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <button 
                            disabled
                            className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed"
                        >
                            Login to Checkout
                        </button>
                    )}
                    
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Truck size={14} /> Estimated delivery in 45 mins
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
