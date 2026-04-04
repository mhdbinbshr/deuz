
import { User, CartItem } from '../types';

const KEYS = {
  USER: 'lumiere_user', // Kept for caching profile data if needed
  CART: 'lumiere_cart',
};

export const storage = {
  // --- Token Management (Deprecated with Firebase) ---
  getToken: (): string | null => null,
  setToken: (token: string) => {},
  removeToken: () => {},

  // --- User Profile Management ---
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: User) => {
    if (typeof window === 'undefined') return;
    try {
      const safeUser = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          joinedDate: user.joinedDate,
          // Avoid storing full order history in local storage if it gets large or complex
          orders: user.orders ? user.orders.map(o => ({ 
              id: o.id, 
              total: o.total, 
              date: o.date, 
              orderStatus: o.orderStatus,
              items: o.items ? o.items.map(i => ({
                  id: i.id,
                  title: i.title,
                  price: i.price,
                  quantity: i.quantity,
                  image: i.image,
                  selectedSize: i.selectedSize
              })) : []
          })) : [],
          address: user.address
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(safeUser));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  removeUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.USER);
  },

  // --- Cart Management ---
  getCart: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setCart: (cart: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      // Sanitize cart items to prevent circular references
      const safeCart = cart.map(item => ({
        id: item.id,
        cartItemId: item.cartItemId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        selectedSize: item.selectedSize,
        maxStock: item.maxStock,
        productType: item.productType,
        description: item.description,
        details: item.details
      }));
      localStorage.setItem(KEYS.CART, JSON.stringify(safeCart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  },

  removeCart: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.CART);
  },

  // --- Global ---
  clearAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.CART);
  }
};
