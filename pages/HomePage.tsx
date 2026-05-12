
import React, { useState } from 'react';
import { MEDICINES } from '../constants';
import MedicineCard from '../components/MedicineCard';
import { Search, Filter } from 'lucide-react';
import { MedicineCategory } from '../types';

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', ...Object.values(MedicineCategory)];
  const today = new Date();

  const filteredMedicines = MEDICINES.filter(med => {
    // Search Logic
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.brandExample.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.commonUse.some(u => u.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category Logic
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;

    // Auto-Hide Expired Logic
    const expiryDate = new Date(med.expiryDate);
    const isExpired = expiryDate < today;

    return matchesSearch && matchesCategory && !isExpired;
  });

  return (
    <div className="pb-20">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-pastel-blue to-transparent pt-20 pb-24 px-4 sm:px-6 lg:px-8 mb-4">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-block mb-4 px-4 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-pastel-primary uppercase tracking-wider animate-bounce">
            Compare & Save Today
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-pastel-dark mb-6 tracking-tight leading-tight">
            Find Affordable <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-primary to-pastel-secondary">Generic Medicines</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Compare prices between top brands and generic alternatives. Save up to 70% on your monthly medical bills in India with our transparent pricing.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto shadow-2xl shadow-pastel-primary/10 rounded-full transition-transform hover:scale-[1.01]">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-6 py-5 rounded-full border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-pastel-primary bg-white text-gray-800 placeholder-gray-400 text-lg transition-all shadow-sm"
              placeholder="Search medicine (e.g. Dolo, Pan 40, Fever)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-8 mb-4 scrollbar-hide">
          <div className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 text-gray-400 mr-2 flex-shrink-0">
            <Filter size={20} />
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat 
                  ? 'bg-pastel-primary text-white shadow-lg shadow-teal-500/20 transform scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:text-gray-700 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredMedicines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMedicines.map((med, index) => (
              <div key={med.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <MedicineCard medicine={med} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-gray-300" />
            </div>
            <p className="text-xl font-medium text-gray-600">No medicines found</p>
            <p className="text-sm mt-2">Try searching for generic names like 'Paracetamol'.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
