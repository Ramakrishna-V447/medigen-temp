
import React, { useState, useEffect } from 'react';
import { Medicine } from '../../types';
import { Check, AlertTriangle, Info, Pill, Wallet, Store, Scale, Star } from 'lucide-react';

// --- Price Comparison Block ---
export const PriceComparisonBlock: React.FC<{ medicine: Medicine }> = ({ medicine }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const savings = medicine.brandedPrice - medicine.genericPrice;
  const savingsPercent = Math.round((savings / medicine.brandedPrice) * 100);

  // Dynamic Brand Data Generation
  const getComparisonData = (med: Medicine) => {
      const data = [];
      
      // 1. Generic Entry
      data.push({
        isGeneric: true,
        name: med.name,
        genericName: med.saltComposition.split('IP')[0].split('(')[0].trim(), // Cleaned up name
        strength: med.name.match(/(\d+\s?mg|gm|ml|%)/i)?.[0] || 'Standard',
        price: med.genericPrice,
        manufacturer: 'Jan Aushadhi / Generic',
        availability: 'In Stock',
        rating: 4.8
      });

      // 2. Brand Entries
      const brands = med.brandExample.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
      brands.forEach((brand, idx) => {
         data.push({
           isGeneric: false,
           name: brand,
           genericName: med.saltComposition.split('IP')[0].split('(')[0].trim(),
           strength: med.name.match(/(\d+\s?mg|gm|ml|%)/i)?.[0] || 'Standard',
           price: idx === 0 ? med.brandedPrice : Math.ceil(med.brandedPrice * (1 + Math.random() * 0.15)), // Varied price
           manufacturer: idx === 0 ? 'Standard Pharma' : 'Premium Healthcare Ltd',
           availability: Math.random() > 0.2 ? 'In Stock' : 'Low Stock',
           rating: 4.0 + (Math.random() * 0.9)
         });
      });

      return data;
  };

  const comparisonRows = getComparisonData(medicine);

  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <Wallet className="text-green-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Price Comparison</h2>
        </div>

        <div className="relative transition-all duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Branded */}
            <div className="border border-red-100 bg-red-50/50 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Market Price</span>
              <span className="text-sm text-gray-400 mt-1">(Avg. Brand)</span>
              <div className="mt-2 text-2xl font-bold text-gray-400 line-through decoration-red-400 decoration-2">
                ₹{medicine.brandedPrice.toFixed(2)}
              </div>
            </div>

            {/* Generic (Highlighted) */}
            <div className={`border-2 border-green-400 bg-green-50 rounded-xl p-5 flex flex-col items-center justify-center text-center transform ${animate ? 'scale-100' : 'scale-95'} transition-transform duration-500`}>
               <span className="text-sm text-green-700 font-bold uppercase tracking-wide flex items-center gap-1">
                 <Check size={14} strokeWidth={3} /> Smart Choice
               </span>
               <span className="text-sm text-gray-600 mt-1">{medicine.name}</span>
               <div className="mt-2 text-4xl font-extrabold text-green-600">
                 ₹{medicine.genericPrice.toFixed(2)}
               </div>
               <span className="text-xs text-green-600 mt-1 font-medium bg-green-200 px-2 py-0.5 rounded-full">
                 Save {savingsPercent}%
               </span>
            </div>
          </div>

          {/* New Detailed Brand Comparison Table */}
          <div className="mb-8">
             <div className="flex items-center gap-2 mb-3">
                 <Scale size={18} className="text-gray-400" />
                 <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Brand Alternatives</h3>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3 font-semibold min-w-[140px]">Product</th>
                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">Manufacturer</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {comparisonRows.map((row, idx) => (
                        <tr key={idx} className={row.isGeneric ? "bg-green-50/40" : "hover:bg-gray-50 transition-colors"}>
                            <td className="px-4 py-3">
                                <div className="flex flex-col">
                                    <span className={`font-bold text-sm ${row.isGeneric ? 'text-green-700' : 'text-gray-800'}`}>
                                    {row.name} {row.isGeneric && <span className="ml-1.5 px-1.5 py-0.5 bg-green-200 text-green-800 text-[9px] rounded-md border border-green-300 uppercase tracking-tight">Generic</span>}
                                    </span>
                                    <span className="text-[11px] text-gray-400 mt-0.5 font-medium">{row.genericName} • {row.strength}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                                <span className="text-xs font-medium block">{row.manufacturer}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < Math.floor(row.rating) ? "fill-current" : "text-gray-200"} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-gray-400">({row.rating.toFixed(1)})</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-800">
                                ₹{row.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${row.availability === 'In Stock' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                    {row.availability}
                                </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              </div>
          </div>

          {/* Market Rates Table */}
          {medicine.marketRates && medicine.marketRates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                 <Store size={18} className="text-gray-400" />
                 <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Market Price Check</h3>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                   <thead className="bg-gray-100">
                     <tr>
                       <th className="px-4 py-3 text-left font-medium text-gray-500">Shop / Source</th>
                       <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                       <th className="px-4 py-3 text-right font-medium text-gray-500">Est. Price</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {medicine.marketRates.map((rate, idx) => (
                       <tr key={idx} className="hover:bg-white transition-colors">
                         <td className="px-4 py-3 text-gray-700 font-medium">{rate.shopName}</td>
                         <td className="px-4 py-3">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${rate.type === 'Generic' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                             {rate.type}
                           </span>
                         </td>
                         <td className="px-4 py-3 text-right font-bold text-gray-800">₹{rate.price.toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500">Total Savings per strip</p>
                <p className="text-2xl font-bold text-gray-800">₹{savings.toFixed(2)}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-400">Average savings</p>
                <p className="text-sm font-semibold text-blue-600">Instant Cash Benefit</p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Usage Block ---
export const UsageBlock: React.FC<{ medicine: Medicine }> = ({ medicine }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Pill className="text-blue-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Why Use This?</h2>
      </div>
      
      <p className="text-gray-600 mb-4 leading-relaxed">
        {medicine.description}
      </p>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Treats Symptoms</h3>
        <div className="flex flex-wrap gap-2">
          {medicine.commonUse.map((use, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200">
              {use}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Dosage Block ---
export const DosageBlock: React.FC<{ medicine: Medicine }> = ({ medicine }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-orange-100 p-2 rounded-lg">
          <AlertTriangle className="text-orange-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Dosage & Safety</h2>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="block text-xs font-bold text-blue-500 uppercase mb-1">Normal Dosage</span>
            <p className="text-sm text-gray-700 font-medium">{medicine.dosage.normal}</p>
        </div>

        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
            <span className="block text-xs font-bold text-yellow-600 uppercase mb-1">Max Safe Limit</span>
            <p className="text-sm text-gray-700 font-medium">{medicine.dosage.maxSafe}</p>
        </div>

        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <span className="block text-xs font-bold text-red-500 uppercase mb-1">Overdose Warning</span>
            <p className="text-sm text-red-700 font-medium">{medicine.dosage.overdoseWarning}</p>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-gray-400 text-center border-t border-gray-100 pt-3">
        ⚠️ Disclaimer: Information for awareness only. Always consult a certified doctor before taking any medication.
      </div>
    </div>
  );
};

// --- Details Block ---
export const DetailsBlock: React.FC<{ medicine: Medicine }> = ({ medicine }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Info className="text-purple-600" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Medical Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <h3 className="font-semibold text-gray-700 mb-2">Salt Composition</h3>
           <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium text-pastel-secondary">
             {medicine.saltComposition}
           </p>
           
           <h3 className="font-semibold text-gray-700 mt-4 mb-2">How it works</h3>
           <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
             {medicine.details.mechanism}
           </p>
        </div>

        <div>
           <h3 className="font-semibold text-gray-700 mb-2">Storage</h3>
           <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
             {medicine.details.storage}
           </p>
        </div>

        <div>
           <h3 className="font-semibold text-gray-700 mb-2">Common Side Effects</h3>
           <ul className="list-disc pl-5 space-y-1">
             {medicine.details.sideEffects.map((effect, idx) => (
               <li key={idx} className="text-sm text-gray-600">{effect}</li>
             ))}
           </ul>
        </div>

        <div>
           <h3 className="font-semibold text-red-500 mb-2">Who should avoid?</h3>
           <ul className="list-disc pl-5 space-y-1">
             {medicine.details.contraindications.map((c, idx) => (
               <li key={idx} className="text-sm text-gray-600">{c}</li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
};
