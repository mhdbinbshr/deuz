import { User, CartItem } from '../types';

const KEYS = {
  TOKEN: 'deuz_auth_token',
  USER: 'deuz_user',
  CART: 'deuz_cart',
  WISHLIST: 'deuz_wishlist',
  CONFIRMED_ORDERS: 'deuz_confirmed_orders',
  ORDER_CODES: 'deuz_recent_order_codes',
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

  // --- Wishlist / Favourites Management ---
  getWishlist: (): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setWishlist: (wishlist: any[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  },

  removeWishlist: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(KEYS.WISHLIST);
    } catch (e) {
      console.error('Failed to remove wishlist', e);
    }
  },

  // --- Confirmed Orders / Dossiers Management ---
  getConfirmedOrders: (): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.CONFIRMED_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConfirmedOrder: (order: any) => {
    if (typeof window === 'undefined' || !order) return;
    try {
      const currentOrders = storage.getConfirmedOrders();
      const orderCode = order.conciergeCode || order.code || order.orderCode || order.id || order._id;
      
      // Update existing or prepend new
      const index = currentOrders.findIndex((o: any) => 
        (o.conciergeCode && o.conciergeCode === orderCode) || 
        (o.id && o.id === orderCode) ||
        (o._id && o._id === orderCode)
      );

      const normalizedOrder = {
        ...order,
        id: orderCode,
        conciergeCode: orderCode,
        createdAt: order.createdAt || new Date().toISOString()
      };

      if (index >= 0) {
        currentOrders[index] = { ...currentOrders[index], ...normalizedOrder };
      } else {
        currentOrders.unshift(normalizedOrder);
      }

      localStorage.setItem(KEYS.CONFIRMED_ORDERS, JSON.stringify(currentOrders.slice(0, 50)));
      if (orderCode) {
        storage.saveOrderCode(orderCode);
      }
    } catch (e) {
      console.error('Failed to save confirmed order to localStorage', e);
    }
  },

  getConfirmedOrderByCode: (code: string): any | null => {
    if (typeof window === 'undefined' || !code) return null;
    try {
      const currentOrders = storage.getConfirmedOrders();
      return currentOrders.find((o: any) => 
        (o.conciergeCode && o.conciergeCode.toLowerCase() === code.toLowerCase()) || 
        (o.id && o.id.toLowerCase() === code.toLowerCase()) ||
        (o._id && o._id.toLowerCase() === code.toLowerCase()) ||
        (o.code && o.code.toLowerCase() === code.toLowerCase())
      ) || null;
    } catch {
      return null;
    }
  },

  getOrderCodes: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.ORDER_CODES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveOrderCode: (code: string) => {
    if (typeof window === 'undefined' || !code) return;
    try {
      const codes = storage.getOrderCodes();
      if (!codes.includes(code)) {
        codes.unshift(code);
        localStorage.setItem(KEYS.ORDER_CODES, JSON.stringify(codes.slice(0, 30)));
      }
    } catch (e) {
      console.error('Failed to save order code', e);
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
