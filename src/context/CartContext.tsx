import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { toast } from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, weight?: string, quantity?: number) => void;
  removeItem: (id: string, weight?: string) => void;
  updateQuantity: (id: string, quantity: number, weight?: string) => void;
  clearCart: () => void;
  total: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, weight?: string, quantity: number = 1) => {
    // Determine the price for this weight
    const price = (weight && product.weightPrices?.[weight]) || product.price;

    setItems(current => {
      const existing = current.find(item => item.id === product.id && item.weight === weight);
      if (existing) {
        return current.map(item => 
          (item.id === product.id && item.weight === weight) ? { ...item, quantity: item.quantity + quantity, price } : item
        );
      }
      return [...current, { ...product, quantity, weight, price }];
    });
    toast.success(`${product.name} ${weight ? `(${weight})` : ''} added to cart`);
  }, []);

  const removeItem = useCallback((id: string, weight?: string) => {
    setItems(current => current.filter(item => !(item.id === id && item.weight === weight)));
    toast.error('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, weight?: string) => {
    if (quantity < 1) {
      removeItem(id, weight);
      return;
    }
    setItems(current => 
      current.map(item => (item.id === id && item.weight === weight) ? { ...item, quantity } : item)
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);
  const itemsCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemsCount,
  }), [items, addItem, removeItem, updateQuantity, clearCart, total, itemsCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
