
import React, { useState } from 'react';
import { Medicine } from '../types';
import { 
  ArrowRight, Activity, Thermometer, ShieldAlert, Heart, ShoppingCart, Check,
  Flame, Wind, Pill, Droplets, HeartPulse, Sun, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarkContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface MedicineCardProps {
  medicine: Medicine;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine }) => {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdded, setIsAdded] = useState(false);
  
  const saved = isBookmarked(medicine.id);

  // Check Expiry Logic
  const checkExpiringSoon = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Expiring in 30 days
  };

  const isExpiringSoon = checkExpiringSoon(medicine.expiryDate);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      removeBookmark(medicine.id);
    } else {
      addBookmark(medicine.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExpiringSoon) return;
    
    // Add 1 strip (e.g., 10 or 15 tablets)
    addToCart(medicine, medicine.stripSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Determine icon based on category for visual flair - using softer tailwind colors
  const getIcon = () => {
    const iconSize = 16;
    switch(medicine.category) {
        case 'Fever': return <Thermometer className="text-orange-400" size={iconSize} />;
        case 'Cold & Flu': return <Thermometer className="text-blue-400" size={iconSize} />;
        case 'Pain Relief': return <Activity className="text-red-400" size={iconSize} />;
        case 'Acidity & Gas': return <Flame className="text-yellow-400" size={iconSize} />;
        case 'Allergy': return <Wind className="text-slate-400" size={iconSize} />;
        case 'Antibiotic': return <Pill className="text-indigo-400" size={iconSize} />;
        case 'Diabetes': return <Droplets className="text-violet-400" size={iconSize} />;
        case 'Heart Health': return <HeartPulse className="text-rose-400" size={iconSize} />;
        case 'Vitamins & Supplements': return <Sun className="text-amber-400" size={iconSize} />;
        default: return <ShieldAlert className="text-teal-400" size={iconSize} />;
    }
  };

  return (
    <Link to={`/medicine/${medicine.id}`} className="block h-full group">
      <div className={`bg-white rounded-3xl border ${isExpiringSoon ? 'border-orange-200' : 'border-gray-100'} shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-500 transform hover:-translate-y-1 h-full flex flex-col overflow-hidden relative`}>
        
        {/* Image Section */}
        <div className="h-60 overflow-hidden relative bg-gray-50">
           <img 
             src={medicine.imageUrl} 
             alt={`${medicine.name} - Generic equivalent for ${medicine.brandExample}`}
             className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out img-soft ${isExpiringSoon ? 'opacity-70 grayscale-[0.5]' : 'opacity-95 group-hover:opacity-100'}`}
             loading="lazy"
           />
           
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-50"></div>
           
           <button
             onClick={toggleBookmark}
             className={`absolute top-3 right-3 p-2.5 rounded-full shadow-sm transition-all z-10 backdrop-blur-md ${
               saved 
                ? 'bg-white/90 text-red-400 hover:bg-red-50' 
                : 'bg-white/60 text-gray-500 hover:text-red-400 hover:bg-white'
             }`}
             aria-label={saved ? "Remove from bookmarks" : "Add to bookmarks"}
           >
             <Heart size={18} className={saved ? 'fill-current' : ''} />
           </button>

           <div className="absolute bottom-3 left-3 flex flex-col items-start gap-2 z-10">
             <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40 flex items-center gap-1.5 shadow-sm">
                {getIcon()} {medicine.category}
             </span>
             {isExpiringSoon && (
                 <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                    <AlertTriangle size={12} /> Expiring Soon
                 </span>
             )}
           </div>

           {/* Quick Add to Cart Button */}
           {isAuthenticated && (
             <button
               onClick={handleAddToCart}
               disabled={isExpiringSoon}
               className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-lg transition-all duration-500 transform z-10 flex items-center gap-2 ${
                 isExpiringSoon
                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed translate-y-0 opacity-100'
                   : isAdded
                     ? 'bg-pastel-secondary text-white translate-y-0 opacity-100 scale-105'
                     : 'bg-pastel-primary text-white hover:bg-pastel-secondary translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
               }`}
               title={isExpiringSoon ? "Unavailable - Expiring Soon" : "Add to Cart"}
             >
               {isExpiringSoon ? <ShieldAlert size={18} /> : isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
               {isAdded && !isExpiringSoon && <span className="text-xs font-bold pr-1 animate-fade-in">Added</span>}
             </button>
           )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-pastel-dark mb-1 group-hover:text-pastel-primary transition-colors line-clamp-1 font-sans">
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-400 mb-5 font-medium line-clamp-1">
             (Generic for {medicine.brandExample})
          </p>

          <div className="mt-auto">
             <div className="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden content-start">
               {medicine.commonUse.slice(0, 3).map((use, idx) => (
                 <span key={idx} className="text-[10px] font-medium bg-pastel-blue text-gray-600 px-2.5 py-1 rounded-full border border-blue-50/50">
                   {use}
                 </span>
               ))}
             </div>
             
             <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">
                  Generic Price: <span className="text-pastel-dark font-bold text-sm">₹{medicine.genericPrice}</span> <span className="text-[10px] text-gray-400">/ {medicine.stripSize} tabs</span>
                </span>
                <div className="flex items-center text-pastel-primary text-xs font-bold group/btn">
                    Details <ArrowRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MedicineCard;
