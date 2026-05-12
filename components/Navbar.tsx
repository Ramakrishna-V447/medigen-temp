
import React, { useState } from 'react';
import { Pill, LogOut, Heart, ShoppingCart, MapPin, Truck, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useCart } from '../context/CartContext';
import { Link, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { bookmarks } = useBookmarks();
  const { itemCount } = useCart();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user is the specific admin for conditional rendering if needed
  const isAdmin = isAuthenticated && user?.role === 'admin' && user?.email === 'admin@medigen.com';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-20 items-center">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer z-20">
             <Link to="/" className="flex items-center gap-3 group">
                <div className="bg-pastel-mint p-2.5 rounded-xl group-hover:bg-pastel-secondary/20 transition-colors">
                    <Pill className="h-6 w-6 text-pastel-primary" />
                </div>
                <div className="select-none">
                   <span className="font-bold text-xl text-pastel-primary tracking-tight block leading-none">Medi<span className="text-pastel-accent">Gen</span></span>
                   <span className="text-[10px] text-pastel-text tracking-widest uppercase font-medium">Smart Healthcare</span>
                </div>
             </Link>
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 z-20">
            
            {/* Standard User Links */}
            <Link 
                to="/stores" 
                className={`hidden lg:flex items-center gap-2 text-sm font-medium transition-all ${
                    location.pathname === '/stores' 
                    ? 'text-pastel-primary bg-pastel-mint/50 px-3 py-1.5 rounded-full' 
                    : 'text-gray-400 hover:text-pastel-primary'
                }`}
            >
                <MapPin size={18} />
                <span>Stores</span>
            </Link>

            <Link 
                to="/track-order" 
                className={`hidden md:flex items-center gap-2 text-sm font-medium transition-all ${
                    location.pathname === '/track-order' 
                    ? 'text-pastel-primary bg-pastel-mint/50 px-3 py-1.5 rounded-full' 
                    : 'text-gray-400 hover:text-pastel-primary'
                }`}
            >
                <Truck size={18} />
                <span className="hidden lg:inline">Track</span>
            </Link>

            <Link 
                to="/saved" 
                className={`relative p-2.5 rounded-full transition-all hover:scale-105 ${
                    location.pathname === '/saved' 
                    ? 'bg-red-50 text-pastel-accent' 
                    : 'text-gray-400 hover:text-pastel-accent hover:bg-red-50/50'
                }`}
                title="Saved Comparisons"
            >
                <Heart size={22} className={location.pathname === '/saved' ? "fill-current" : ""} />
                {bookmarks.length > 0 && (
                    <span className="absolute top-0 right-0 bg-pastel-accent text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {bookmarks.length}
                    </span>
                )}
            </Link>

            <Link 
                to="/cart" 
                className={`relative p-2.5 rounded-full transition-all hover:scale-105 ${
                    location.pathname === '/cart' 
                    ? 'bg-pastel-mint text-pastel-primary' 
                    : 'text-gray-400 hover:text-pastel-primary hover:bg-pastel-mint/50'
                }`}
                title="Shopping Cart"
            >
                <ShoppingCart size={22} className={location.pathname === '/cart' ? "fill-current" : ""} />
                {itemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-pastel-primary text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {itemCount}
                    </span>
                )}
            </Link>

            {/* Admin Block Icon - Swapped to ShieldCheck with Lighter Colors */}
            {(!isAuthenticated || isAdmin) && (
                 <Link 
                    to={isAdmin ? "/admin" : "/admin/login"} 
                    className={`relative p-2.5 rounded-full transition-all hover:scale-105 ${
                        location.pathname.startsWith('/admin')
                        ? 'bg-pastel-secondary text-white shadow-lg shadow-sky-500/20' 
                        : 'text-gray-300 hover:text-pastel-secondary hover:bg-pastel-blue/30'
                    }`}
                    title="Admin Access"
                >
                    <ShieldCheck size={22} />
                </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                 <div className="hidden xl:block text-right">
                    <p className="text-xs text-gray-400 font-medium">Welcome,</p>
                    <p className="text-sm font-bold text-gray-700">{user?.name.split(' ')[0]}</p>
                 </div>
                 
                 <button 
                   onClick={logout}
                   className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-400 rounded-full transition-all"
                   title="Logout"
                 >
                   <LogOut size={18} />
                   <span className="hidden sm:inline">Logout</span>
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-pastel-primary hover:bg-pastel-secondary px-5 py-2.5 rounded-full shadow-lg shadow-teal-500/20 transition-all transform hover:scale-105"
                 >
                    <User size={18} /> Login
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Global Auth Modal for Users */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </nav>
  );
};

export default Navbar;
