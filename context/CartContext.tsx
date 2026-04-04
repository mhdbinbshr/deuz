import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { db } from '../utils/db';
import { useAuth } from './AuthContext';
import { storage } from '../utils/storage';

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  cartLoading: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (cartItemId: string | undefined) => Promise<void>;
  updateQuantity: (cartItemId: string | undefined, delta: number) => Promise<void>;
  clearCart: () => void;
  cartCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  // Helper to normalize backend response
  const mapBackendCartToFrontend = (backendCart: any): CartItem[] => {
    if (!backendCart || !Array.isArray(backendCart.items)) return [];
    
    return backendCart.items.map((item: any) => {
        // If product is populated
        if (item.product && typeof item.product === 'object') {
            return {
                cartItemId: item._id, // The ID of the line item in cart
                id: item.product._id || item.product.id, // The Product ID
                title: item.product.title,
                price: item.product.price,
                image: item.product.image,
                quantity: item.quantity,
                selectedSize: item.selectedSize,
                category: item.product.category,
                maxStock: item.product.countInStock
            };
        }
        return null;
    }).filter(Boolean) as CartItem[];
  };

  // Initialize and Sync Cart
  useEffect(() => {
    let mounted = true;

    const initializeCart = async () => {
      if (!mounted) return;
      setCartLoading(true);
      try {
        if (user) {
          // 1. User Logged In
          const localCart = storage.getCart();
          
          if (Array.isArray(localCart) && localCart.length > 0) {
            console.log("Merging local cart to account...");
            try {
              // Attempt Merge
              const finalCart = await db.mergeCart(localCart);
              if (mounted) {
                setCartItems(mapBackendCartToFrontend(finalCart));
                storage.removeCart(); // Only clear if merge succeeds
              }
            } catch (err) {
              console.warn("Merge failed, fetching server cart instead");
              // Fallback: Just get server cart
              const serverCart = await db.getCart();
              if (mounted) setCartItems(mapBackendCartToFrontend(serverCart));
            }
          } else {
            // Local empty, fetch server
            const serverCart = await db.getCart();
            if (mounted) setCartItems(mapBackendCartToFrontend(serverCart));
          }
        } else {
          // 2. Guest User - Load from Storage
          const stored = storage.getCart();
          if (mounted) setCartItems(stored);
        }
      } catch (error) {
        console.error("Cart initialization critical error", error);
      } finally {
        if (mounted) setCartLoading(false);
      }
    };

    initializeCart();
    
    return () => { mounted = false; };
  }, [user]);

  // Persist Guest Cart
  useEffect(() => {
    if (!user) {
      storage.setCart(cartItems);
    }
  }, [cartItems, user]);

  const addToCart = async (newItem: Omit<CartItem, 'quantity'>) => {
    setCartLoading(true);
    
    // Sanitize item to prevent circular references (e.g. if event object passed)
    const sanitizedItem: Omit<CartItem, 'quantity'> = {
        id: newItem.id,
        title: newItem.title,
        price: newItem.price,
        image: newItem.image,
        category: newItem.category,
        selectedSize: newItem.selectedSize,
        maxStock: newItem.maxStock,
        productType: newItem.productType,
        description: newItem.description,
        details: newItem.details,
        cartItemId: newItem.cartItemId
    };

    if (user) {
      try {
        const updatedCart = await db.addToCart(sanitizedItem);
        setCartItems(mapBackendCartToFrontend(updatedCart));
        setIsCartOpen(true);
      } catch (e) {
        console.error("Add to cart failed", e);
        alert("Unable to secure item. Please check availability.");
      }
    } else {
      // Simulate network delay slightly for consistent UX
      await new Promise(r => setTimeout(r, 200));
      setCartItems(prev => {
        const existingIndex = prev.findIndex(item => 
            item.id === sanitizedItem.id && item.selectedSize === sanitizedItem.selectedSize
        );
        
        if (existingIndex > -1) {
          const updated = [...prev];
          const currentQty = updated[existingIndex].quantity;
          const max = sanitizedItem.maxStock ?? 99; 
          
          if (currentQty < max) {
             updated[existingIndex].quantity += 1;
          } else {
             alert(`Maximum allocation reached for this artifact.`);
          }
          return updated;
        }
        
        // Generate a guest ID if not present
        const guestCartItemId = `guest_${sanitizedItem.id}_${sanitizedItem.selectedSize || 'std'}_${Date.now()}`;
        return [...prev, { ...sanitizedItem, quantity: 1, cartItemId: guestCartItemId }];
      });
      setIsCartOpen(true);
    }
    setCartLoading(false);
  };

  const updateQuantity = async (cartItemId: string | undefined, delta: number) => {
    if (!cartItemId) return;
    setCartLoading(true);

    if (user) {
        try {
           const currentItem = cartItems.find(i => i.cartItemId === cartItemId);
           if (!currentItem) {
             setCartLoading(false);
             return;
           }
           
           const newQty = currentItem.quantity + delta;
           if (newQty <= 0) {
             setCartLoading(false);
             return;
           }

           const updated = await db.updateCartQty(cartItemId, newQty);
           setCartItems(mapBackendCartToFrontend(updated));
        } catch(e: any) {
           console.error("Update quantity failed", e);
           if(e.message && e.message.includes('stock')) {
             alert(e.message);
           }
        }
    } else {
        setCartItems(prev => prev.map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return item;
            
            const max = item.maxStock ?? 99;
            if (newQty > max) {
                return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        }));
    }
    setCartLoading(false);
  };

  const removeFromCart = async (cartItemId: string | undefined) => {
    if (!cartItemId) return;
    setCartLoading(true);
    
    if (user) {
        try {
          const updated = await db.removeCartItem(cartItemId);
          setCartItems(mapBackendCartToFrontend(updated));
        } catch(e) { console.error(e); }
    } else {
        setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    }
    setCartLoading(false);
  };

  const clearCart = () => {
    setCartItems([]);
    if (!user) storage.removeCart();
  };

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  // Ensure precise floating point calc
  const total = Math.round(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      cartLoading,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      total
    }}>
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