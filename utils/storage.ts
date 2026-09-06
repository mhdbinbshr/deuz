import { User, CartItem } from '../types';

const KEYS = {
  TOKEN: 'deuz_auth_token',
  USER: 'deuz_user',
  CART: 'deuz_cart',
};

export const storage = {
  // --- Token Management ---
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  setToken: (token: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEYS.TOKEN, token);
    } catch (e) {
      console.error('Failed to save token', e);
    }
  },

  removeToken: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(KEYS.TOKEN);
    } catch (e) {
      console.error('Failed to remove token', e);
    }
  },

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
      const safeUser: User = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile || '',
        alternateMobile: user.alternateMobile || '',
        role: user.role || 'user',
        joinedDate: user.joinedDate || new Date().toISOString(),
        orders: user.orders ? [...user.orders] : [],
        address: user.address,
        token: user.token
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(safeUser));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  removeUser: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.error('Failed to remove user', e);
    }
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
    try {
      localStorage.removeItem(KEYS.CART);
    } catch (e) {
      console.error('Failed to remove cart', e);
    }
  },

  // --- Global ---
  clearAll: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.CART);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  }
};
