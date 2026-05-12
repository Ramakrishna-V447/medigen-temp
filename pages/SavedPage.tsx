import React from 'react';
import { MEDICINES } from '../constants';
import MedicineCard from '../components/MedicineCard';
import { useBookmarks } from '../context/BookmarkContext';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SavedPage: React.FC = () => {
  const { bookmarks } = useBookmarks();

  const savedMedicines = MEDICINES.filter(med => bookmarks.includes(med.id));

  return (
    <div className="min-h-screen pb-20 bg-gray-50/50">
       {/* Header */}
       <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
             <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="text-gray-600" size={24} />
             </Link>
             <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="fill-red-500 text-red-500" /> Saved Comparisons
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {savedMedicines.length} items in your list
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {savedMedicines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {savedMedicines.map((med) => (
              <div key={med.id}>
                <MedicineCard medicine={med} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center justify-center animate-slide-up">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Heart size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No saved medicines yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bookmark medicines while exploring to quickly access their price comparisons and dosage info here.
            </p>
            <Link 
                to="/" 
                className="bg-pastel-primary hover:bg-pastel-secondary text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-teal-500/20"
            >
                Browse Medicines
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPage;