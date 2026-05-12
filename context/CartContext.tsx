
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { CartItem, Medicine } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/db';

interface CartContextType {
  items: CartItem[];
  addToCart: (medicine: Medicine, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  totalDiscount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart on mount or user change
  useEffect(() => {
    const loadedCart = db.getCart(userId);
    setItems(loadedCart);
  }, [userId]);

  // Persist cart on items change
  useEffect(() => {
    db.saveCart(userId, items);
  }, [items, userId]);

  const addToCart = (medicine: Medicine, quantityToAdd?: number) => {
    // Default to 1 strip size if no quantity specified
    const qty = quantityToAdd !== undefined ? quantityToAdd : medicine.stripSize;

    setItems(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.id === medicine.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);

  // --- Pricing Logic ---
  // 1. Calculate base price per tablet
  // 2. Apply bulk discount logic: >= 50 tabs (5%), >= 100 tabs (10%)
  
  const calculateItemTotal = (item: CartItem) => {
    const pricePerTablet = item.genericPrice / item.stripSize;
    const baseTotal = item.quantity * pricePerTablet;
    
    let discount = 0;
    if (item.quantity >= 100) {
        discount = baseTotal * 0.10; // 10%
    } else if (item.quantity >= 50) {
        discount = baseTotal * 0.05; // 5%
    }
    
    return {
        base: baseTotal,
        discount: discount,
        final: baseTotal - discount
    };
  };

  const cartTotal = items.reduce((total, item) => total + calculateItemTotal(item).final, 0);
  const totalDiscount = items.reduce((total, item) => total + calculateItemTotal(item).discount, 0);
  
  // Count represents total tablets now, but for badges usually we want unique items or maybe just count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, totalDiscount, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
