
import React, { useState } from 'react';
import { MapPin, Navigation, Search, Phone, Clock, Truck, ChevronRight, Star, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORES = [
    { 
        id: 1, 
        name: "Pradhan Mantri Janaushadhi Kendra", 
        address: "Opp. District Civil Hospital, Collectorate Road, Karimnagar, Telangana 505001", 
        phone: "+91 878 223 4567",
        dist: "0.5 km", 
        open: true,
        rating: 4.6,
        reviews: 142,
        lat: 18.4348,
        lng: 79.1328,
        hours: "09:00 AM - 09:00 PM"
    },
    { 
        id: 2, 
        name: "Sanjivani Generic Meds", 
        address: "Shop No. 4, Tower Circle, Mukarampura, Karimnagar, Telangana 505001", 
        phone: "+91 98480 12345",
        dist: "1.2 km", 
        open: true,
        rating: 4.3,
        reviews: 89,
        lat: 18.4386,
        lng: 79.1288,
        hours: "08:30 AM - 10:00 PM"
    },
    { 
        id: 3, 
        name: "Generic Plus Pharmacy", 
        address: "H.No 2-10-12, Mankammathota, Main Road, Karimnagar, Telangana 505001", 
        phone: "+91 878 224 5678",
        dist: "2.8 km", 
        open: false,
        rating: 4.1,
        reviews: 56,
        lat: 18.4450,
        lng: 79.1250,
        hours: "10:00 AM - 08:00 PM"
    },
    { 
        id: 4, 
        name: "DavaIndia Generic Pharmacy", 
        address: "Beside Ganesh Temple, Bhagatnagar, Karimnagar, Telangana 505001", 
        phone: "+91 99080 67890",
        dist: "3.5 km", 
        open: true,
        rating: 4.5,
        reviews: 110,
        lat: 18.4500,
        lng: 79.1400,
        hours: "09:00 AM - 09:30 PM"
    },
];

const StoresPage: React.FC = () => {
    const [activeStoreId, setActiveStoreId] = useState(STORES[0].id);
    const activeStore = STORES.find(s => s.id === activeStoreId) || STORES[0];

    return (
        <div className="h-[calc(100vh-80px)] bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Sidebar List */}
            <div className="w-full lg:w-[450px] bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-xl shadow-gray-200/50">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-white z-10">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                        <MapPin className="text-pastel-primary fill-pastel-primary/20" /> Store Locator
                    </h1>
                    <p className="text-sm text-gray-500">Find verified generic medicine stores near you.</p>
                    
                    <div className="mt-4 relative group">
                        <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-pastel-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search area, city or pincode..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-primary/50 focus:border-pastel-primary transition-all text-sm font-medium" 
                        />
                    </div>
                </div>

                {/* Tracking Widget (Optional) */}
                <div className="px-6 py-2 bg-gray-50/50">
                    <Link to="/track-order" className="flex items-center justify-between p-3 bg-white border border-pastel-blue/30 rounded-xl shadow-sm hover:shadow-md transition-all group">
                         <div className="flex items-center gap-3">
                             <div className="bg-pastel-mint p-2 rounded-lg text-pastel-primary">
                                 <Truck size={18} />
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Active Order</p>
                                 <p className="text-[10px] text-gray-500">Track delivery status</p>
                             </div>
                         </div>
                         <div className="bg-gray-50 p-1.5 rounded-full text-gray-400 group-hover:bg-pastel-primary group-hover:text-white transition-colors">
                             <ChevronRight size={14} />
                         </div>
                    </Link>
                </div>

                {/* Scrollable Store List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50/30">
                    {STORES.map(store => (
                        <div 
                            key={store.id}
                            onClick={() => setActiveStoreId(store.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                                activeStoreId === store.id 
                                ? 'bg-white border-pastel-primary shadow-lg shadow-pastel-primary/5 ring-1 ring-pastel-primary' 
                                : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                            {/* Selection Indicator Bar */}
                            {activeStoreId === store.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pastel-primary"></div>
                            )}

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <h3 className={`font-bold text-sm sm:text-base ${activeStoreId === store.id ? 'text-pastel-primary' : 'text-gray-800'}`}>
                                    {store.name}
                                </h3>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    store.open 
                                    ? 'bg-green-50 text-green-600 border-green-100' 
                                    : 'bg-red-50 text-red-500 border-red-100'
                                }`}>
                                    {store.open ? 'OPEN' : 'CLOSED'}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 mb-3 pl-2 line-clamp-2 leading-relaxed">
                                {store.address}
                            </p>

                            <div className="flex items-center gap-4 pl-2 mb-3">
                                <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 border border-yellow-100">
                                    <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-bold">{store.rating}</span>
                                    <span className="text-[10px] text-yellow-600/70">({store.reviews})</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <MapPin size={12} /> {store.dist} away
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pl-2 mt-2 pt-3 border-t border-gray-50">
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors">
                                    <Phone size={12} /> Call
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pastel-primary hover:bg-pastel-secondary text-xs font-bold text-white transition-colors shadow-sm shadow-teal-500/20">
                                    <Navigation size={12} /> Directions
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-gray-100 h-[50vh] lg:h-auto">
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    title={activeStore.name}
                    src={`https://maps.google.com/maps?q=${activeStore.lat},${activeStore.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                    allowFullScreen
                ></iframe>

                {/* Floating Store Details on Map */}
                <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white animate-fade-in z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="font-bold text-gray-900 leading-tight">{activeStore.name}</h2>
                        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{activeStore.address}</p>
                    
                    <div className="space-y-3 text-xs">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Clock size={14} className="text-pastel-primary" />
                            <span className="font-medium">{activeStore.hours}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone size={14} className="text-pastel-primary" />
                            <span className="font-medium">{activeStore.phone}</span>
                        </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                         <a 
                           href={`https://www.google.com/maps/dir/?api=1&destination=${activeStore.lat},${activeStore.lng}`}
                           target="_blank"
                           rel="noreferrer"
                           className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                         >
                            <ArrowUpRight size={16} /> Open Maps
                         </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoresPage;
