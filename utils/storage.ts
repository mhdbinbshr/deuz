import { User, CartItem } from '../types';

const KEYS = {
  TOKEN: 'deuz_auth_token',
  USER: 'deuz_user',
  CART: 'deuz_cart',
  WISHLIST: 'deuz_wishlist',
  CONFIRMED_ORDERS: 'deuz_confirmed_orders',
  ORDER_CODES: 'deuz_recent_order_codes',
  REGISTRATION_DRAFT: 'deuz_registration_draft',
};

export interface RegistrationDraft {
  uid?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  pincode?: string;
  termsAccepted?: boolean;
  isGoogleAccountSelected?: boolean;
}

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

  // --- User Profile Management (Never stores passwords) ---
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(KEYS.USER);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Ensure password is never present in browser storage
      if (parsed && 'password' in parsed) {
        delete parsed.password;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setUser: (user: User) => {
    if (typeof window === 'undefined') return;
    try {
      const safeUser: User = {
        id: user.id,
        _id: user._id || user.id,
        fullName: user.fullName,
        displayName: user.displayName || user.fullName,
        email: user.email,
        photoURL: user.photoURL,
        emailVerified: Boolean(user.emailVerified),
        mobile: user.mobile || '',
        alternateMobile: user.alternateMobile || '',
        role: user.role || 'user',
        stage: user.stage || 'applicant',
        houseCode: user.houseCode || user.houseId || '',
        houseId: user.houseId || user.houseCode || '',
        joinedDate: user.joinedDate || new Date().toISOString(),
        orders: user.orders ? [...user.orders] : [],
        address: user.address,
        addresses: user.addresses || (user.address ? [user.address] : []),
        profileCompleted: user.profileCompleted ?? true,
        dossierRegistered: user.dossierRegistered ?? true,
        authProvider: user.authProvider,
        linkedProviders: user.linkedProviders || [],
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt
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

  // --- Registration Form Draft Persistence (Survives Page Refresh, Never Stores Passwords) ---
  getRegistrationDraft: (): RegistrationDraft | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(KEYS.REGISTRATION_DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setRegistrationDraft: (draft: RegistrationDraft) => {
    if (typeof window === 'undefined') return;
    try {
      const safeDraft: RegistrationDraft = {
        uid: draft.uid,
        fullName: draft.fullName || '',
        email: draft.email || '',
        mobile: draft.mobile || '',
        address: draft.address || '',
        city: draft.city || '',
        pincode: draft.pincode || '',
        termsAccepted: Boolean(draft.termsAccepted),
        isGoogleAccountSelected: Boolean(draft.isGoogleAccountSelected)
      };
      sessionStorage.setItem(KEYS.REGISTRATION_DRAFT, JSON.stringify(safeDraft));
    } catch {}
  },

  clearRegistrationDraft: () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(KEYS.REGISTRATION_DRAFT);
    } catch {}
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

  // --- Global Session Cleanup (Prevents cross-account data leaks) ---
  clearAll: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.CART);
      localStorage.removeItem(KEYS.WISHLIST);
      localStorage.removeItem(KEYS.CONFIRMED_ORDERS);
      localStorage.removeItem(KEYS.ORDER_CODES);
      sessionStorage.removeItem(KEYS.REGISTRATION_DRAFT);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  }
};

