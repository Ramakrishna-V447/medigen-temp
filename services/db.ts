
import { Medicine, Order, CartItem, Address, ActivityLog, User, EmailLog, AdminNotification } from '../types';
import { MEDICINES } from '../constants';

// Keys for localStorage
const DB_KEYS = {
  ORDERS: 'medigen_db_orders',
  MEDICINES: 'medigen_db_medicines',
  LOGS: 'medigen_db_logs',
  EMAILS: 'medigen_db_emails',
  USERS: 'medigen_db_users_fallback', // New key for offline users
  NOTIFICATIONS: 'medigen_db_notifications', // New key for offline notifications
  // Base keys for dynamic user data
  CART_PREFIX: 'medigen_cart_',
  BOOKMARK_PREFIX: 'medigen_bookmarks_'
};

const API_URL = 'http://localhost:5000/api';

// Simulate network delay for LS operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERNAL HELPERS ---
const getStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage Full or Error", e);
  }
};

export const db = {
  // --- USER & AUTH (HYBRID: API -> FALLBACK) ---

  registerUser: async (name: string, email: string, phone: string, password: string): Promise<User> => {
      try {
          // 1. Try Backend
          const response = await fetch(`${API_URL}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, phone, password })
          });

          if (response.ok) {
              const data = await response.json();
              await db.logActivity('User Registration', `New user registered: ${email}`);
              return data as User;
          } else {
             const errData = await response.json().catch(() => ({}));
             throw new Error(errData.error || "Registration failed on server");
          }

      } catch (error: any) {
          console.warn("Backend unavailable or failed, switching to offline mode:", error.message);
          
          // 2. Local Fallback
          await delay(500);
          const users = getStorage<User[]>(DB_KEYS.USERS, []);
          
          if (users.find(u => u.email === email)) {
              throw new Error("User already exists (Offline Mode)");
          }

          const newUser: User = {
              id: `usr_local_${Date.now()}`,
              name,
              email,
              phone,
              role: 'user',
              createdAt: Date.now(),
              password: password 
          };

          users.push(newUser);
          setStorage(DB_KEYS.USERS, users);
          
          const { password: _, ...userReturn } = newUser;
          return userReturn;
      }
  },

  authenticateUser: async (email: string, password: string): Promise<User> => {
      try {
          // 1. Try Backend
          const response = await fetch(`${API_URL}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });

          if (response.ok) {
              const data = await response.json();
              return data as User;
          } else {
             const errData = await response.json().catch(() => ({}));
             if (response.status === 401) throw new Error("Invalid credentials");
             if (response.status < 500) throw new Error(errData.error || "Login failed");
             throw new Error("Server Error"); // Trigger fallback
          }

      } catch (error: any) {
          console.warn("Backend unavailable, checking local records:", error.message);

          // 2. Local Fallback
          await delay(500);

          // Hardcoded Admin
          if (email === 'admin@medigen.com' && password === 'admin') {
              return {
                  id: 'usr_admin',
                  name: 'Super Admin',
                  email: 'admin@medigen.com',
                  phone: '+91 98765 43210',
                  role: 'admin',
                  createdAt: Date.now()
              };
          }

          // Check Offline Users
          const users = getStorage<User[]>(DB_KEYS.USERS, []);
          const user = users.find(u => u.email === email && u.password === password);

          if (user) {
              const { password: _, ...userReturn } = user;
              return userReturn;
          }

          throw new Error("Invalid credentials or Server Unavailable");
      }
  },

  sendOtp: async (email: string): Promise<boolean> => {
      const response = await fetch(`${API_URL}/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
      });
      if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send OTP");
      }
      return true;
  },

  verifyOtp: async (email: string, otp: string): Promise<User> => {
      const response = await fetch(`${API_URL}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
      });
      if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Invalid OTP");
      }
      const data = await response.json();
      return data as User;
  },

  // --- ADMIN NOTIFICATIONS ---
  
  logNotification: async (type: 'registration' | 'login', message: string, userEmail: string): Promise<void> => {
      const notifs = getStorage<AdminNotification[]>(DB_KEYS.NOTIFICATIONS, []);
      const newNotif: AdminNotification = {
          id: Date.now(),
          type,
          message,
          user_email: userEmail,
          ip_address: '127.0.0.1 (Client)',
          created_at: Date.now(),
          read: 0
      };
      notifs.unshift(newNotif);
      if (notifs.length > 50) notifs.pop();
      setStorage(DB_KEYS.NOTIFICATIONS, notifs);
  },

  getAdminNotifications: async (): Promise<AdminNotification[]> => {
      try {
          const response = await fetch(`${API_URL}/admin/notifications`);
          if (response.ok) {
              return await response.json();
          }
          throw new Error("Server error");
      } catch (e) {
          // Fallback to local storage silently
          return getStorage<AdminNotification[]>(DB_KEYS.NOTIFICATIONS, []);
      }
  },

  // --- MEDICINES (LocalStorage) ---
  
  getMedicines: async (): Promise<Medicine[]> => {
    await delay(300);
    const stored = localStorage.getItem(DB_KEYS.MEDICINES);
    if (!stored) {
      setStorage(DB_KEYS.MEDICINES, MEDICINES);
      return MEDICINES;
    }
    return JSON.parse(stored);
  },

  getMedicineById: async (id: string): Promise<Medicine | undefined> => {
    await delay(200);
    const medicines = getStorage<Medicine[]>(DB_KEYS.MEDICINES, MEDICINES);
    return medicines.find(m => m.id === id);
  },

  saveMedicine: async (medicine: Medicine): Promise<void> => {
    await delay(500);
    const medicines = getStorage<Medicine[]>(DB_KEYS.MEDICINES, MEDICINES);
    
    const index = medicines.findIndex(m => m.id === medicine.id);
    if (index >= 0) {
      medicines[index] = medicine;
    } else {
      medicines.push(medicine);
    }
    
    setStorage(DB_KEYS.MEDICINES, medicines);
    await db.logActivity('Medicine Update', `Updated/Added medicine: ${medicine.name}`);
  },

  deleteMedicine: async (id: string): Promise<void> => {
    await delay(400);
    let medicines = getStorage<Medicine[]>(DB_KEYS.MEDICINES, MEDICINES);
    const name = medicines.find(m => m.id === id)?.name || id;
    medicines = medicines.filter(m => m.id !== id);
    setStorage(DB_KEYS.MEDICINES, medicines);
    await db.logActivity('Medicine Delete', `Deleted medicine: ${name}`);
  },

  // --- ORDERS (LocalStorage) ---
  
  saveOrder: async (
    items: CartItem[], 
    totalAmount: number, 
    address: Address,
    customerEmail: string,
    prescriptionUrl?: string
  ): Promise<Order> => {
    await delay(1500);
    
    const orders = getStorage<Order[]>(DB_KEYS.ORDERS, []);
    
    const newOrder: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      items,
      totalAmount,
      address,
      customerEmail,
      status: 'pending_approval', // Default status is now pending approval
      prescriptionUrl,
      createdAt: Date.now(),
      deliveryTime: '45 mins' // Estimate
    };
    
    orders.push(newOrder);
    setStorage(DB_KEYS.ORDERS, orders);

    const { sendOrderConfirmationEmail } = await import('./emailService');
    sendOrderConfirmationEmail(newOrder).catch(err => console.error("Failed to process email", err));
    
    return newOrder;
  },

  getOrder: async (orderId: string): Promise<Order | null> => {
    await delay(800); 
    const orders = getStorage<Order[]>(DB_KEYS.ORDERS, []);
    return orders.find(o => o.id === orderId) || null;
  },

  getAllOrders: async (): Promise<Order[]> => {
    await delay(500);
    return getStorage<Order[]>(DB_KEYS.ORDERS, []);
  },

  updateOrderStatus: async (orderId: string, status: Order['status'], rejectionReason?: string): Promise<void> => {
    await delay(400);
    const orders = getStorage<Order[]>(DB_KEYS.ORDERS, []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index].status = status;
      if (rejectionReason) {
        orders[index].rejectionReason = rejectionReason;
      }
      setStorage(DB_KEYS.ORDERS, orders);
      await db.logActivity('Order Update', `Updated order #${orderId} status to ${status}`);
    }
  },

  getOrdersByEmail: async (email: string): Promise<Order[]> => {
    await delay(600);
    const orders = getStorage<Order[]>(DB_KEYS.ORDERS, []);
    return orders
      .filter(o => o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // --- EMAILS (LocalStorage) ---

  saveEmail: async (to: string, subject: string, body: string): Promise<void> => {
      const emails = getStorage<EmailLog[]>(DB_KEYS.EMAILS, []);
      const newEmail: EmailLog = {
          id: `email_${Date.now()}`,
          to,
          subject,
          body,
          sentAt: Date.now(),
          status: 'sent'
      };
      emails.push(newEmail);
      setStorage(DB_KEYS.EMAILS, emails);
  },

  getEmails: async (): Promise<EmailLog[]> => {
      await delay(200);
      return getStorage<EmailLog[]>(DB_KEYS.EMAILS, []);
  },

  // --- LOGS (LocalStorage) ---

  logActivity: async (action: string, details: string) => {
    const logs = getStorage<ActivityLog[]>(DB_KEYS.LOGS, []);
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      action,
      admin: 'System/Admin',
      timestamp: Date.now(),
      details
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    setStorage(DB_KEYS.LOGS, logs);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
    await delay(300);
    return getStorage<ActivityLog[]>(DB_KEYS.LOGS, []);
  },

  // --- CART & BOOKMARKS (LocalStorage) ---

  getCart: (userId: string | null): CartItem[] => {
    const key = userId ? `${DB_KEYS.CART_PREFIX}${userId}` : 'medigen_cart_guest';
    return getStorage<CartItem[]>(key, []);
  },

  saveCart: (userId: string | null, items: CartItem[]): void => {
    const key = userId ? `${DB_KEYS.CART_PREFIX}${userId}` : 'medigen_cart_guest';
    setStorage(key, items);
  },

  getBookmarks: (userId: string | null): string[] => {
    const key = userId ? `${DB_KEYS.BOOKMARK_PREFIX}${userId}` : 'medigen_bookmarks_guest';
    return getStorage<string[]>(key, []);
  },

  saveBookmarks: (userId: string | null, ids: string[]): void => {
    const key = userId ? `${DB_KEYS.BOOKMARK_PREFIX}${userId}` : 'medigen_bookmarks_guest';
    setStorage(key, ids);
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
      const users = getStorage<User[]>(DB_KEYS.USERS, []);
      const user = users.find(u => u.email === email);
      if (user) {
          const { password: _, ...userReturn } = user;
          return userReturn;
      }
      return undefined; 
  },
};
