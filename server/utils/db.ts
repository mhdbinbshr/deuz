import { User, Order, CartItem, Address, OrderStatus } from '../types';

// Safely resolve API URL for both build and no-build environments
const getApiUrl = () => {
  // In production (built app served by same origin), we use relative path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api';
  }
  
  // Local Development
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  } catch (e) {
    // Ignore ReferenceError for process
  }
  return '/api';
};

const API_URL = getApiUrl();

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Client-side fallback to prevent app crash when server is unreachable
const FALLBACK_SETTINGS = {
    key: 'global_config',
    conciergeConfig: {
        instagramHandle: 'deuzandco',
        whatsappNumber: '919876543210',
        emailAddress: 'deuzandco@gmail.com',
        businessHours: '9 AM - 9 PM IST',
        dmTemplate: 'Greetings from DEUZ & CO.'
    },
    siteContent: {
        heroTitle: 'CINEMATIC REALITY',
        heroSubtitle: 'Not for everyone.',
        ctaText: 'Initiate Request',
        checkoutDisclaimer: 'Submit your allocation request.',
        footerText: 'Designed in Cinematic Vision'
    }
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Request Failed');
    }

    return data;
  } catch (error: any) {
    // --- OFFLINE FALLBACKS ---
    // Suppress errors for known endpoints that have fallbacks
    
    if (endpoint === '/admin/settings') {
        // Silent fallback for settings to prevent console noise on init
        return FALLBACK_SETTINGS;
    }

    if (endpoint === '/products') {
        console.warn("Offline Mode: Returning empty products list");
        return [];
    }

    if (endpoint === '/cart' || endpoint === '/cart/merge' || endpoint.startsWith('/cart/')) {
        console.warn("Offline Mode: Cart service unavailable");
        return { items: [] };
    }

    if (endpoint === '/orders/concierge') {
        console.warn("Offline Mode: Generating Local Dossier");
        const body = JSON.parse(config.body as string || '{}');
        return {
            success: true,
            orderId: `OFFLINE_${Date.now()}`,
            orderCode: `DEUZ-OFFLINE-${Math.floor(Math.random() * 1000)}`,
            order: {
                items: body.items || [],
                shippingAddress: body.address || {},
                totalAmount: body.total || 0,
                contactMethod: body.contactMethod || 'instagram'
            },
            message: 'Dossier Registered (Offline Mode)'
        };
    }

    // For Auth endpoints, we strictly throw errors to allow UI to show "Invalid Credentials" etc.
    // No mock fallback for auth.

    // For other endpoints, log the error and re-throw
    console.error(`Request failed: ${endpoint}`, error);
    throw error;
  }
};

export const db = {
  // Auth
  validateSession: (token: string) => request('/auth/me', { 
    headers: { Authorization: `Bearer ${token}` }
  }),
  loginUser: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginUserWithGoogle: (email: string, name: string) => request('/auth/google', { method: 'POST', body: JSON.stringify({ email, name }) }),
  checkUserExists: (email: string) => request('/auth/check', { method: 'POST', body: JSON.stringify({ email }) }),
  registerUser: (userData: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  logoutUser: () => request('/auth/logout', { method: 'POST' }),

  // Products
  getProducts: () => request('/products'),
  getProductById: (id: string) => request(`/products/${id}`),
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  // Cart
  getCart: () => request('/cart'),
  addToCart: (item: any) => request('/cart', { method: 'POST', body: JSON.stringify({ productId: item.id || item.product, quantity: item.quantity || 1, selectedSize: item.selectedSize }) }),
  updateCartQty: (itemId: string, quantity: number) => request(`/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId: string) => request(`/cart/${itemId}`, { method: 'DELETE' }),
  mergeCart: (items: any[]) => request('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) }),

  // Orders
  createConciergeOrder: (data: any) => request('/orders/concierge', { method: 'POST', body: JSON.stringify(data) }),
  markConversationStarted: (id: string, interaction: any) => request(`/orders/${id}/conversation`, { method: 'POST', body: JSON.stringify({ interaction }) }),
  updateOrderChannel: (id: string, channel: string) => request(`/orders/${id}/channel`, { method: 'PUT', body: JSON.stringify({ channel }) }),
  trackOrder: (code: string) => request(`/orders/track/${code}`),
  getMyOrders: () => request('/orders/myorders'),
  cancelOrder: (orderId: string, reason: string) => request('/orders/cancel', { method: 'POST', body: JSON.stringify({ orderId, reason }) }),
  
  // Admin
  bootstrapSystem: (data: any) => request('/admin/bootstrap', { method: 'POST', body: JSON.stringify(data) }),
  getAllOrders: () => request('/admin/orders'),
  getUsers: () => request('/admin/users'),
  createUser: (data: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string, internalNotes?: string) => request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status, internalNotes }) }),
  generatePaymentLink: (id: string) => request(`/admin/orders/${id}/payment-link`, { method: 'POST' }),
  recordManualPayment: (id: string, data: any) => request(`/admin/orders/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => request('/admin/audit'),
  
  // Settings with Robust Fallback
  getSystemSettings: async () => {
      // Direct request will utilize the fallback inside request() if offline
      return await request('/admin/settings');
  },
  updateSystemSettings: (data: any) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
};