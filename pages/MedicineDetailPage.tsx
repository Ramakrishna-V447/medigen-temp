
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MEDICINES } from '../constants';
import { ArrowLeft, Heart, ShoppingCart, Zap, CheckCircle2, AlertTriangle, ShieldOff, Calculator, Percent, Lock } from 'lucide-react';
import { PriceComparisonBlock, UsageBlock, DosageBlock, DetailsBlock } from '../components/blocks/MedicineDetailBlocks';
import { useBookmarks } from '../context/BookmarkContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const MedicineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const medicine = MEDICINES.find(m => m.id === id);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Calculator State
  const [sheetCount, setSheetCount] = useState(1);
  const [tabletCount, setTabletCount] = useState(0);
  const [added, setAdded] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Scroll Sync State & Refs
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [hoveredPanel, setHoveredPanel] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Medicine Not Found</h2>
        <Link to="/" className="text-pastel-primary hover:underline">Go back home</Link>
      </div>
    );
  }

  // --- Pricing Logic ---
  const pricePerStrip = medicine.genericPrice;
  const stripSize = medicine.stripSize;
  const pricePerTablet = pricePerStrip / stripSize;
  
  const totalTabletsOrdered = (sheetCount * stripSize) + tabletCount;
  
  // Bulk Discount Logic
  let discountPercent = 0;
  if (totalTabletsOrdered >= 100) discountPercent = 10;
  else if (totalTabletsOrdered >= 50) discountPercent = 5;

  const rawSubtotal = totalTabletsOrdered * pricePerTablet;
  const discountAmount = rawSubtotal * (discountPercent / 100);
  const finalPrice = rawSubtotal - discountAmount;

  // Check Expiry Logic
  const checkExpiringSoon = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Expiring in 30 days
  };

  const isExpiringSoon = checkExpiringSoon(medicine.expiryDate);

  const saved = isBookmarked(medicine.id);
  const toggleBookmark = () => {
    if (saved) {
      removeBookmark(medicine.id);
    } else {
      addBookmark(medicine.id);
    }
  };

  const handleAddToCart = () => {
    if (isExpiringSoon || totalTabletsOrdered <= 0) return;
    addToCart(medicine, totalTabletsOrdered);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isExpiringSoon || totalTabletsOrdered <= 0) return;
    addToCart(medicine, totalTabletsOrdered);
    navigate('/cart');
  };

  // Input Handlers
  const handleSheetChange = (val: number) => {
      setSheetCount(val < 0 ? 0 : val);
  };
  const handleTabletChange = (val: number) => {
      setTabletCount(val < 0 ? 0 : val);
  };

  // --- Scroll Sync Handlers ---
  const handleScroll = (e: React.UIEvent<HTMLDivElement>, source: 'left' | 'right') => {
      // Only sync on desktop (lg breakpoint is 1024px)
      if (window.innerWidth < 1024) return;

      // Only sync if the user is actively hovering/interacting with the source panel
      // This prevents infinite loop of scroll events triggering each other
      if (hoveredPanel === source) {
          const scrollTop = e.currentTarget.scrollTop;
          
          if (source === 'left' && rightPanelRef.current) {
              rightPanelRef.current.scrollTop = scrollTop;
          } else if (source === 'right' && leftPanelRef.current) {
              leftPanelRef.current.scrollTop = scrollTop;
          }
      }
  };

  return (
    <div className="min-h-screen bg-pastel-background pb-32 animate-fade-in">
      {/* Header / Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-pastel-dark line-clamp-1 flex items-center gap-2">
                    {medicine.name}
                    {isExpiringSoon && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">Expiring Soon</span>}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Generic for <span className="font-medium text-gray-600">{medicine.brandExample}</span></p>
            </div>
          </div>

          <button
             onClick={toggleBookmark}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all ${
               saved 
                ? 'bg-red-50 border-red-100 text-red-400' 
                : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
             }`}
           >
             <Heart size={18} className={saved ? 'fill-current' : ''} />
             <span className="text-sm font-semibold hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* Medicine Image Banner */}
        <div className="w-full h-56 sm:h-72 lg:h-80 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative group animate-slide-up">
             <img 
                src={medicine.imageUrl} 
                alt={medicine.name}
                className="w-full h-full object-cover img-soft group-hover:scale-105 transition-transform duration-700"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             
             {/* Optional Overlay Text on Image Hover */}
             <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                    {medicine.category}
                </span>
             </div>
        </div>

        {/* Pricing & Order Section (Unified Lock + Sync Scroll) */}
        <div className="relative">
            {/* 
                Container Logic:
                - Mobile: Standard flex-col, auto height.
                - Desktop (lg): Fixed height (650px), grid layout, hidden scrollbars for synchronized feel.
            */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[650px] ${!isAuthenticated ? 'filter blur-sm pointer-events-none select-none opacity-60' : ''} transition-all duration-500`}>
                
                {/* Block 1: Price Comparison (Left Panel) */}
                <div 
                    ref={leftPanelRef}
                    onMouseEnter={() => setHoveredPanel('left')}
                    onScroll={(e) => handleScroll(e, 'left')}
                    className="lg:col-span-2 h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 animate-slide-up" 
                    style={{ animationDelay: '100ms' }}
                >
                    <PriceComparisonBlock medicine={medicine} />
                    
                    {/* Spacer for desktop scroll alignment if needed */}
                    <div className="hidden lg:block h-8"></div>
                </div>
                
                {/* Block 2: Configure Order / Buy Box (Right Panel) */}
                <div 
                    ref={rightPanelRef}
                    onMouseEnter={() => setHoveredPanel('right')}
                    onScroll={(e) => handleScroll(e, 'right')}
                    className="w-full h-full lg:overflow-y-auto custom-scrollbar lg:pl-1 animate-slide-up" 
                    style={{ animationDelay: '150ms' }}
                >
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden min-h-full">
                        
                        <div className="flex items-center gap-2 mb-6">
                                <div className="bg-pastel-blue p-2 rounded-lg text-pastel-primary"><Calculator size={20}/></div>
                                <h3 className="text-lg font-bold text-gray-800">Configure Order</h3>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Unit Price</span>
                                    <span className="text-sm font-medium text-gray-700">1 Sheet = {medicine.stripSize} Tabs</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-800">₹{pricePerStrip.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">Per Sheet</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-600">₹{pricePerTablet.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">Per Tablet</div>
                                    </div>
                                </div>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Sheets</label>
                                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                                        <button onClick={() => handleSheetChange(sheetCount - 1)} className="p-3 text-gray-400 hover:text-pastel-primary transition-colors hover:bg-white rounded-l-xl border-r border-gray-100">-</button>
                                        <input 
                                        type="number" 
                                        min="0"
                                        value={sheetCount}
                                        onChange={(e) => handleSheetChange(parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-gray-800 outline-none"
                                        />
                                        <button onClick={() => handleSheetChange(sheetCount + 1)} className="p-3 text-gray-400 hover:text-pastel-primary transition-colors hover:bg-white rounded-r-xl border-l border-gray-100">+</button>
                                    </div>
                            </div>
                            <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Tablets</label>
                                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                                        <button onClick={() => handleTabletChange(tabletCount - 1)} className="p-3 text-gray-400 hover:text-pastel-primary transition-colors hover:bg-white rounded-l-xl border-r border-gray-100">-</button>
                                        <input 
                                        type="number" 
                                        min="0"
                                        value={tabletCount}
                                        onChange={(e) => handleTabletChange(parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-gray-800 outline-none"
                                        />
                                        <button onClick={() => handleTabletChange(tabletCount + 1)} className="p-3 text-gray-400 hover:text-pastel-primary transition-colors hover:bg-white rounded-r-xl border-l border-gray-100">+</button>
                                    </div>
                            </div>
                        </div>

                        {/* Calculation Summary */}
                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between text-gray-500">
                                    <span>Total Quantity</span>
                                    <span className="font-medium">{totalTabletsOrdered} Tablets</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                    <span>Base Price</span>
                                    <span>₹{rawSubtotal.toFixed(2)}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span className="flex items-center gap-1"><Percent size={12}/> Bulk Discount ({discountPercent}%)</span>
                                    <span>- ₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Final Total</span>
                                    <span className="text-2xl font-extrabold text-pastel-primary">₹{finalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Bulk Offer Badges */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${discountPercent === 5 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    50+ Tabs: 5% Off
                                </div>
                                <div className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${discountPercent === 10 ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                    100+ Tabs: 10% Off
                                </div>
                        </div>

                        <div className="space-y-3">
                                {isExpiringSoon ? (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center text-sm">
                                    <p className="text-orange-700 font-bold flex items-center justify-center gap-2"><ShieldOff size={16}/> Unavailable</p>
                                    <p className="text-orange-600 text-xs mt-1">Short expiry batch restricted.</p>
                                </div>
                                ) : (
                                <>
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={totalTabletsOrdered === 0}
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
                                            added ? 'bg-pastel-secondary text-white' : 'bg-pastel-blue text-pastel-primary hover:bg-pastel-mint'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {added ? <CheckCircle2 size={18}/> : <ShoppingCart size={18} />}
                                        {added ? 'Added to Cart' : 'Add to Cart'}
                                    </button>
                                    <button 
                                        onClick={handleBuyNow}
                                        disabled={totalTabletsOrdered === 0}
                                        className="w-full flex items-center justify-center gap-2 bg-pastel-primary text-white py-3.5 rounded-xl font-bold hover:bg-pastel-secondary transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Zap size={18} /> Buy Now
                                    </button>
                                </>
                                )}
                        </div>

                        {/* Extra spacer to ensure scrolling is possible if content is short but container is tall */}
                        <div className="hidden lg:block h-10"></div>
                    </div>
                </div>
            </div>

            {/* Unified Auth Overlay */}
            {!isAuthenticated && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-3xl">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center max-w-[320px] animate-slide-up">
                        <div className="bg-pastel-blue w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Lock className="text-pastel-primary" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">Login to View Prices & Order</h3>
                        <p className="text-sm text-gray-500 mb-4">Unlock savings, view generic price comparisons, and place your order.</p>
                        <button 
                            onClick={() => setShowAuthModal(true)}
                            className="bg-pastel-primary hover:bg-pastel-secondary text-white font-bold py-2.5 px-8 rounded-full transition-colors w-full shadow-lg shadow-teal-500/20"
                        >
                            Login / Signup
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Block 2: Usage */}
          <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <UsageBlock medicine={medicine} />
          </section>

          {/* Block 3: Dosage */}
          <section className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <DosageBlock medicine={medicine} />
          </section>
        </div>

        {/* Block 4: Details (Full Width) */}
        <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <DetailsBlock medicine={medicine} />
        </section>

      </div>
      
      {/* Mobile Sticky Bottom Bar */}
      {isAuthenticated && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 flex items-center gap-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
            <div className="flex-1 pl-2">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total ({totalTabletsOrdered} tabs)</div>
                <div className="text-2xl font-bold text-pastel-primary">₹{finalPrice.toFixed(2)}</div>
            </div>
            {isExpiringSoon ? (
                <button disabled className="flex-1 bg-gray-300 text-white py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <ShieldOff size={18} /> Restricted
                </button>
            ) : (
                <button 
                    onClick={handleBuyNow}
                    disabled={totalTabletsOrdered === 0}
                    className="flex-1 bg-pastel-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Zap size={18} /> Buy Now
                </button>
            )}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default MedicineDetailPage;
