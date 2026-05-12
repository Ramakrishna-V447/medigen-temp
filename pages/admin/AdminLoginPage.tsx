
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, Key } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
      if (isAuthenticated && user?.role === 'admin' && user?.email === 'admin@medigen.com') {
          navigate('/admin');
      }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await login(email, password);
        if (res.success) {
            // Check if email matches admin
            if (email === 'admin@medigen.com') {
                navigate('/admin');
            } else {
                setError('Access Denied. Not an admin account.');
            }
        } else {
            setError(res.error || 'Invalid credentials');
        }
    } catch (err) {
        setError('Login failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const fillCredentials = () => {
      setEmail('admin@medigen.com');
      setPassword('admin');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pastel-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
            <div className="bg-slate-700/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600">
                <ShieldCheck size={32} className="text-pastel-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-slate-400 text-sm">Secure access for MediGen staff only</p>
        </div>

        {/* Demo Credentials Block - Added for convenience */}
        <div 
            onClick={fillCredentials}
            className="mb-6 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer border border-slate-600/50 hover:border-pastel-primary/30 p-3 rounded-xl flex items-center gap-3 transition-all group"
        >
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-pastel-primary/20 transition-colors">
                <Key size={16} className="text-slate-400 group-hover:text-pastel-primary" />
            </div>
            <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Demo Credentials (Click to fill)</p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">admin@medigen.com <span className="text-slate-600">|</span> admin</p>
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-pastel-primary transition-colors" />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-pastel-primary focus:border-transparent outline-none transition-all font-medium text-slate-200 placeholder-slate-600"
                        placeholder="admin@medigen.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-pastel-primary transition-colors" />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-pastel-primary focus:border-transparent outline-none transition-all font-medium text-slate-200 placeholder-slate-600"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-pastel-primary hover:bg-pastel-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                        Access Dashboard <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <button 
                onClick={() => navigate('/')} 
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
            >
                Back to User Site
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
