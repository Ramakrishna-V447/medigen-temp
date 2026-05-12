
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { MapPin, CreditCard, CheckCircle2, Home, Building, Truck, Loader2, Mail, Navigation, RefreshCw, FileText, Upload, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
  const { cartTotal, items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [addressType, setAddressType] = useState<'home' | 'work'>('home');
  
  // Prescription State
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Distance Simulation State
  const [distance, setDistance] = useState<number>(2.5); // Default demo distance
  const [isCalculatingDist, setIsCalculatingDist] = useState(false);

  // Billing Constants
  const DELIVERY_THRESHOLD = 200;
  const PLATFORM_FEE = 10;
  
  // Dynamic Delivery Logic
  const getDeliveryFee = (dist: number, subtotal: number) => {
      if (subtotal > DELIVERY_THRESHOLD) return 0;
      if (dist <= 1) return 15;
      if (dist <= 2) return 20;
      if (dist <= 5) return 40;
      return 60; // Base charge for > 5km
  };

  const deliveryCharge = getDeliveryFee(distance, cartTotal);
  const finalTotal = cartTotal + deliveryCharge + PLATFORM_FEE;
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    line: '',
    city: '',
    pincode: ''
  });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
        setFormData(prev => ({
            ...prev,
            fullName: prev.fullName || user.name,
            email: prev.email || user.email
        }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError('');
      const file = e.target.files?.[0];
      if (!file) return;

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
          setUploadError('File too large (Max 5MB).');
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          setPrescriptionFile(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const simulateLocationCheck = () => {
      setIsCalculatingDist(true);
      // Simulate API call
      setTimeout(() => {
          // Generate random distance between 0.5 and 6.0 km
          const newDist = parseFloat((Math.random() * 5.5 + 0.5).toFixed(1));
          setDistance(newDist);
          setIsCalculatingDist(false);
      }, 1500);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!prescriptionFile) {
        setUploadError('Prescription is required to place an order.');
        // Scroll to error
        document.getElementById('prescription-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    setIsProcessing(true);

    try {
        const address = {
            fullName: formData.fullName,
            phone: formData.phone,
            line: formData.line,
            city: formData.city,
            pincode: formData.pincode,
            type: addressType
        };

        const newOrder = await db.saveOrder(
            items, 
            finalTotal, 
            address, 
            formData.email, 
            prescriptionFile
        );
        
        setIsProcessing(false);
        setStep(3); // Success Step

        setTimeout(() => {
            clearCart();
            navigate(`/track-order?orderId=${newOrder.id}`);
        }, 2000);
    } catch (error) {
        console.error("Order Failed", error);
        setIsProcessing(false);
        alert("Failed to place order. Please try again.");
    }
  };

  if (step === 3) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="bg-white p-12 rounded-3xl shadow-lg text-center animate-fade-in max-w-md">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
                  <p className="text-gray-500 mb-2">Your order is pending admin approval.</p>
                  <p className="font-bold text-gray-800 mb-6 bg-gray-50 py-2 px-4 rounded-lg inline-block">{formData.email}</p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                      <div className="bg-green-500 h-full w-full animate-[shimmer_1s_infinite]"></div>
                  </div>
                  <p className="text-xs text-gray-400">Redirecting to order tracking...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                
                {/* Contact Info Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                     <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Mail className="text-pastel-primary" /> Contact Details
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                required name="fullName" value={formData.fullName} onChange={handleInputChange}
                                type="text" placeholder="Full Name" 
                                className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                            />
                            <input 
                                required name="phone" value={formData.phone} onChange={handleInputChange}
                                type="tel" placeholder="Phone Number" 
                                className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                            />
                        </div>
                        <input 
                            required name="email" value={formData.email} onChange={handleInputChange}
                            type="email" placeholder="Email Address (for order confirmation)" 
                            className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                        />
                    </div>
                </div>

                {/* Address Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="text-pastel-primary" /> Delivery Address
                    </h2>

                    {/* Visual Map for Pinning */}
                    <div className="mb-6 h-48 bg-gray-100 rounded-xl relative overflow-hidden group border border-gray-200">
                         <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Bangalore.jpg')] bg-cover opacity-60"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <button 
                                type="button"
                                onClick={simulateLocationCheck}
                                disabled={isCalculatingDist}
                                className="bg-pastel-primary text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold transform hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
                            >
                                {isCalculatingDist ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                                {isCalculatingDist ? 'Calculating...' : 'Recalculate Location'}
                             </button>
                         </div>
                         
                         {/* Simulated Distance Display */}
                         <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs font-bold text-gray-700 flex items-center gap-2">
                             <MapPin size={14} className="text-pastel-secondary" /> 
                             Distance: {distance} km
                         </div>
                    </div>

                    <div className="space-y-4">
                        <input 
                            required name="line" value={formData.line} onChange={handleInputChange}
                            type="text" placeholder="House No, Building, Area" 
                            className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                        />
                        <div className="grid grid-cols-2 gap-4">
                             <input 
                                required name="city" value={formData.city} onChange={handleInputChange}
                                type="text" placeholder="City" 
                                className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                             />
                             <input 
                                required name="pincode" value={formData.pincode} onChange={handleInputChange}
                                type="text" placeholder="Pincode" 
                                className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-pastel-primary outline-none transition-all" 
                             />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button 
                                type="button"
                                onClick={() => setAddressType('home')}
                                className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center gap-2 font-medium transition-all ${addressType === 'home' ? 'border-pastel-primary text-pastel-primary bg-pastel-blue/20' : 'border-gray-200 text-gray-500'}`}
                            >
                                <Home size={18} /> Home
                            </button>
                            <button 
                                type="button"
                                onClick={() => setAddressType('work')}
                                className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center gap-2 font-medium transition-all ${addressType === 'work' ? 'border-pastel-primary text-pastel-primary bg-pastel-blue/20' : 'border-gray-200 text-gray-500'}`}
                            >
                                <Building size={18} /> Work
                            </button>
                        </div>
                    </div>
                </div>

                {/* Prescription Upload Section */}
                <div id="prescription-section" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="text-pastel-primary" /> Upload Prescription
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 uppercase">Required</span>
                    </h2>
                    
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 text-sm text-blue-800">
                        <p className="font-bold mb-1">Doctor's prescription is mandatory.</p>
                        <p className="text-xs text-blue-600">Please upload a clear image of your valid prescription for verification by our pharmacists.</p>
                    </div>

                    {!prescriptionFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pastel-primary hover:bg-pastel-blue/5 transition-all group relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handlePrescriptionUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="text-gray-400 group-hover:text-pastel-primary" size={24} />
                            </div>
                            <p className="font-bold text-gray-600 group-hover:text-pastel-primary">Click to Upload Image</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</p>
                        </div>
                    ) : (
                        <div className="relative border border-gray-200 rounded-xl p-2 bg-gray-50 flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                <img src={prescriptionFile} alt="Prescription" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-sm text-gray-700 truncate">Prescription Uploaded</p>
                                <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={12}/> Ready to submit</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setPrescriptionFile(null)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    
                    {uploadError && (
                        <div className="mt-3 text-sm text-red-500 flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                            <AlertCircle size={16} /> {uploadError}
                        </div>
                    )}
                </div>

                {/* Payment Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard className="text-pastel-primary" /> Payment Method
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-pastel-primary transition-colors">
                            <input type="radio" name="payment" className="w-5 h-5 text-pastel-primary" defaultChecked />
                            <div className="flex-1">
                                <span className="font-bold text-gray-800 block">UPI / Netbanking</span>
                                <span className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</span>
                            </div>
                        </label>
                         <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-pastel-primary transition-colors">
                            <input type="radio" name="payment" className="w-5 h-5 text-pastel-primary" />
                            <div className="flex-1">
                                <span className="font-bold text-gray-800 block">Cash on Delivery</span>
                                <span className="text-xs text-gray-500">Pay when you receive</span>
                            </div>
                        </label>
                    </div>
                </div>

            </div>

            {/* Summary Sidebar */}
            <div>
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                     <h3 className="text-lg font-bold text-gray-800 mb-4">Bill Details</h3>
                     <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between text-gray-600">
                             <span>Item Subtotal</span>
                             <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                             <div className="flex flex-col">
                                <span>Delivery Fee</span>
                                <span className="text-[10px] text-gray-400">({distance} km)</span>
                             </div>
                             {deliveryCharge === 0 ? (
                                <span className="text-green-500 font-medium">Free</span>
                             ) : (
                                <span>₹{deliveryCharge.toFixed(2)}</span>
                             )}
                        </div>
                        {deliveryCharge > 0 && (
                            <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
                                <span className="block">Distance Based Pricing:</span>
                                1km: ₹15 | 2km: ₹20 | 5km: ₹40
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                             <span>Platform Fee</span>
                             <span>₹{PLATFORM_FEE.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-green-600 font-medium">
                             <span>Total Discount</span>
                             <span>- ₹0.00</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-800">
                             <span>To Pay</span>
                             <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                     </div>

                     <button 
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-pastel-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:bg-pastel-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Truck size={20} />}
                        {isProcessing ? 'Processing...' : 'Place Order'}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} /> 100% Safe & Secure Payments
                    </p>
                 </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
