
export interface MarketRate {
  shopName: string;
  price: number;
  type: 'Generic' | 'Branded';
}

export interface Medicine {
  id: string;
  name: string; // Generic Name primarily
  brandExample: string;
  saltComposition: string;
  batchNumber: string; // New field for batch tracking
  stripSize: number; // Number of tablets/capsules per sheet
  category: MedicineCategory;
  commonUse: string[];
  description: string;
  genericPrice: number;
  brandedPrice: number;
  stock: number;
  expiryDate: string;
  marketRates: MarketRate[]; // Prices at different shops
  imageUrl: string;
  dosage: {
    normal: string;
    maxSafe: string;
    overdoseWarning: string;
  };
  details: {
    mechanism: string;
    sideEffects: string[];
    contraindications: string[]; // Who should avoid
    storage: string;
  };
}

export interface CartItem extends Medicine {
  quantity: number;
}

export enum MedicineCategory {
  FEVER = 'Fever',
  COLD_FLU = 'Cold & Flu',
  PAIN = 'Pain Relief',
  ACIDITY = 'Acidity & Gas',
  ALLERGY = 'Allergy',
  ANTIBIOTIC = 'Antibiotic',
  DIABETES = 'Diabetes',
  HEART = 'Heart Health',
  SUPPLEMENTS = 'Vitamins & Supplements',
  SKIN = 'Skin Care',
  NEURO = 'Neurology & Mental Health',
  THYROID = 'Thyroid',
  WOMEN = 'Women\'s Health'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string; // Added phone number for SMS notifications
  role: 'user' | 'admin';
  password?: string; // Only used internally in DB, stripped for frontend context
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Address {
  fullName: string;
  phone: string;
  line: string;
  city: string;
  pincode: string;
  type: 'home' | 'work';
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'placed' | 'packed' | 'out_for_delivery' | 'delivered';
  prescriptionUrl?: string; // URL or Base64 of the prescription
  rejectionReason?: string; // If status is rejected
  address: Address;
  customerEmail: string;
  createdAt: number;
  deliveryTime: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  admin: string;
  timestamp: number;
  details: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string; // HTML content
  sentAt: number;
  status: 'sent' | 'failed';
}

export interface AdminNotification {
    id: number;
    type: 'registration' | 'login';
    message: string;
    user_email: string;
    ip_address: string;
    created_at: number;
    read: number;
}
