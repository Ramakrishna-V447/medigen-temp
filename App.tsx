
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import HomePage from './pages/HomePage';
import MedicineDetailPage from './pages/MedicineDetailPage';
import SavedPage from './pages/SavedPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import StoresPage from './pages/StoresPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import { AuthProvider } from './context/AuthContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { Bell } from 'lucide-react';

// Simple Toast Component
const ToastContainer = () => {
    const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);

    useEffect(() => {
        const handleToast = (e: CustomEvent) => {
            setToast({ message: e.detail.message, show: true });
            setTimeout(() => setToast(null), 4000);
        };

        window.addEventListener('medigen-toast' as any, handleToast);
        return () => window.removeEventListener('medigen-toast' as any, handleToast);
    }, []);

    if (!toast) return null;

    return (
        <div className={`fixed top-24 right-4 z-[60] bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm animate-fade-in transition-all ${toast.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
            <div className="bg-pastel-primary/20 p-2 rounded-full shrink-0">
                <Bell size={18} className="text-pastel-secondary" />
            </div>
            <div>
                <h4 className="font-bold text-sm text-pastel-secondary mb-0.5">Notification Sent</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
        </div>
    );
};

// Layout wrapper for User Panel (Navbar + Footer + ChatBot)
const UserLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <>
    <Navbar />
    <main>
      {children}
    </main>
    <ChatBot />
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-8 mt-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} MediGen India. All rights reserved.</p>
        <p className="mt-2 text-xs">
          Disclaimer: This website provides information for educational purposes only. 
          It is not a substitute for professional medical advice, diagnosis, or treatment. 
          Always seek the advice of your physician.
        </p>
      </div>
    </footer>
  </>
);

const AppRoutes = () => {
    return (
        <Routes>
            {/* User Panel Routes */}
            <Route path="/" element={<UserLayout><HomePage /></UserLayout>} />
            <Route path="/saved" element={<UserLayout><SavedPage /></UserLayout>} />
            <Route path="/cart" element={<UserLayout><CartPage /></UserLayout>} />
            <Route path="/checkout" element={<UserLayout><CheckoutPage /></UserLayout>} />
            <Route path="/track-order" element={<UserLayout><OrderTrackingPage /></UserLayout>} />
            <Route path="/stores" element={<UserLayout><StoresPage /></UserLayout>} />
            <Route path="/medicine/:id" element={<UserLayout><MedicineDetailPage /></UserLayout>} />
            
            {/* Admin Panel Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookmarkProvider>
          <CartProvider>
            <HashRouter>
              <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
                 <AppRoutes />
                 <ToastContainer />
              </div>
            </HashRouter>
          </CartProvider>
        </BookmarkProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
