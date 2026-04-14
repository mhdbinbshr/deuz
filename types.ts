


export type UserRole = 'user' | 'admin' | 'concierge';

/**
 * Strict System Lifecycle States
 * Maps the journey from initial inquiry to final fulfillment.
 */
export type OrderStatus = 
  | 'ORDER_SECURED'
  | 'PAYMENT_AUTHORIZED'
  | 'ORDER_VERIFIED'
  | 'IN_PRODUCTION'
  | 'QUALITY_ASSURED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXPERIENCE_UNLOCKED'
  | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_SECURED: 'Not Confirmed',
  PAYMENT_AUTHORIZED: 'Payment Authorized',
  ORDER_VERIFIED: 'Order Verified',
  IN_PRODUCTION: 'In Production',
  QUALITY_ASSURED: 'Quality Assured',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  DISPATCHED: 'Dispatched',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_HUB: 'Arrived at Destination Hub',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  EXPERIENCE_UNLOCKED: 'Experience Unlocked',
  CANCELLED: 'Archived'
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  ORDER_SECURED: 'Your selection has been successfully reserved.',
  PAYMENT_AUTHORIZED: 'Transaction approved. The process begins.',
  ORDER_VERIFIED: 'Details reviewed for perfection.',
  IN_PRODUCTION: 'Your piece is being prepared with precision.',
  QUALITY_ASSURED: 'Each detail is inspected to meet our standards.',
  READY_FOR_DISPATCH: 'Prepared and packaged for its journey.',
  DISPATCHED: 'Your order has left our facility.',
  IN_TRANSIT: 'Traveling through our global network.',
  ARRIVED_AT_HUB: 'Reached your region’s premium facility.',
  OUT_FOR_DELIVERY: 'On the final stretch to you.',
  DELIVERED: 'Your order has arrived.',
  EXPERIENCE_UNLOCKED: 'The story continues with you.',
  CANCELLED: 'Order has been archived or cancelled.'
};

export const ORDER_PHASES = [
  {
    name: 'PHASE 1 — INITIATION',
    statuses: ['ORDER_SECURED', 'PAYMENT_AUTHORIZED', 'ORDER_VERIFIED'] as OrderStatus[]
  },
  {
    name: 'PHASE 2 — CREATION',
    statuses: ['IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH'] as OrderStatus[]
  },
  {
    name: 'PHASE 3 — TRANSIT',
    statuses: ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY'] as OrderStatus[]
  },
  {
    name: 'PHASE 4 — ARRIVAL',
    statuses: ['DELIVERED', 'EXPERIENCE_UNLOCKED'] as OrderStatus[]
  }
];

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OrderPayload {
  items: CartItem[];
  shippingAddress: Address;
  totalAmount: number;
}

export interface NavLink {
  name: string;
  href: string;
}

export interface Project {
  id: number;
  title: string;
  category: string;
  year: string;
  image: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface CartItem {
  id: string | number; // Product ID
  cartItemId?: string; // Unique ID for the cart entry (DB _id or composite for guest)
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string; 
  productType?: 'APPAREL' | 'CARD'; // New Logic Separation
  description?: string;
  details?: Record<string, string>;
  selectedSize?: string;
  maxStock?: number;
  houseCode?: string;
}

export type WishlistItem = Omit<CartItem, 'quantity'>;

export interface Address {
  firstName: string;
  lastName: string;
  fullName?: string; // Optional/Legacy support
  email: string;
  mobile: string; // Phone
  alternateMobile?: string; // Optional additional phone number
  country: string; // Fixed: India
  address: string; // Combined Address
  city: string; // Town/City
  state: string; // Selected from list
  pincode: string;
  
  // Legacy fields (optional to prevent breaking changes during migration)
  house?: string;
  street?: string;
  landmark?: string;
  type?: 'Home' | 'Work';
}

export interface Order {
  id: string;
  code?: string; // Public reference code (e.g. DEUZ-XXXX)
  items: CartItem[];
  total: number;
  address: Address;
  date: string;
  deliveryDate: string;
  paymentStatus?: string; 
  orderStatus: OrderStatus; 
  contactMethod?: string;
  _id?: string; // Mongoose ID
  createdAt?: string;
  isTrashed?: boolean;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
  };

  // Backend fields often returned directly
  totalAmount?: number;
  shippingAddress?: Address;
  conciergeCode?: string;
  updatedAt?: string;
  paymentLink?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  password?: string;
  joinedDate: string;
  orders: Order[];
  address?: Address;
  role?: UserRole;
  token?: string;
}
