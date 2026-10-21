


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
  ORDER_SECURED: 'Order Secured',
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
  CANCELLED: 'Cancelled'
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
  CANCELLED: 'This allocation has been cancelled.'
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

export type WishlistItem = Omit<CartItem, 'quantity'> & { countInStock?: number };

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

export interface Product {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  description: string;
  category: string;
  productType: 'APPAREL' | 'CARD';
  fit?: 'oversized' | 'regular';
  countInStock: number;
  isArchived: boolean;
  image: string;
  gallery?: string[];
  sizes: string[];
  outOfStockSizes?: string[];
  sizeStock?: Record<string, number>;
  details: Record<string, string>;
  imageTag?: string;
  houseCode?: string;
  createdAt?: any;
}

export type CustomerStage = 'applicant' | 'initiative' | 'core' | 'inner' | 'ascent' | 'black' | 'signature';

export interface StageDefinition {
  id: CustomerStage;
  level: number;
  name: string;
  code: string;
  tagline: string;
  flightStatus: string;
  callsign: string;
  altitude: string;
  machSpeed: string;
  coordinates: string;
  accentColor: string;
  description: string;
  privileges: string[];
}

export const CUSTOMER_STAGES: StageDefinition[] = [
  {
    id: 'applicant',
    level: 0,
    name: 'Applicant',
    code: 'APPL-00',
    tagline: 'Pre-Flight Registration',
    flightStatus: 'Pre-Flight Standby • Awaiting First Order & Admin Accreditation',
    callsign: 'DEUZ-APPL-00',
    altitude: '0 FT // HANGAR',
    machSpeed: 'STATIC 0 KTS',
    coordinates: 'ATELIER HANGAR [PRE-FLIGHT]',
    accentColor: '#71717A',
    description: 'Initial patron registration. Unlocks full Initiative Stage (Stage 01) upon completing your first order and receiving administrative accreditation by House Admin.',
    privileges: [
      'Access to exclusive capsule catalog & dossier archive',
      'Placing initial atelier orders & concierge communications',
      'Eligible for Stage 01 (Initiative) elevation after placing first order',
      'Personal patron profile chamber access'
    ]
  },
  {
    id: 'initiative',
    level: 1,
    name: 'Initiative',
    code: 'INIT-01',
    tagline: 'Prologue Horizon',
    flightStatus: 'Clearance Granted • Taxiing Runway 09R',
    callsign: 'DEUZ-INIT-01',
    altitude: '0 FT // GROUND',
    machSpeed: 'TAXI 25 KTS',
    coordinates: '48°51\'N • 2°20\'E [PARIS HUB]',
    accentColor: '#A1A1AA',
    description: 'First order accredited patron. Official verification of coordinates and invitation to house releases.',
    privileges: [
      'Standard seasonal collection reservations',
      'Digital certificate of acquisition authentication',
      'Private house communications & archival releases',
      'Standard insured delivery'
    ]
  },
  {
    id: 'core',
    level: 2,
    name: 'Core',
    code: 'CORE-02',
    tagline: 'Foundational Circle',
    flightStatus: 'Climb Vector Authorized • Takeoff Speed',
    callsign: 'DEUZ-CORE-02',
    altitude: '12,000 FT // ASCENDING',
    machSpeed: 'MACH 0.55',
    coordinates: '51°30\'N • 0°07\'W [LONDON VECTOR]',
    accentColor: '#60A5FA',
    description: 'Patron foundation. Elevated priority in seasonal allocations and complimentary air express shipping.',
    privileges: [
      '24-Hour advance lock on capsule drops',
      'Complimentary insured global air courier dispatch',
      'Priority waitlist for limited run card & apparel editions',
      'Direct order tracking via live concierge protocol'
    ]
  },
  {
    id: 'inner',
    level: 3,
    name: 'Inner',
    code: 'INNER-03',
    tagline: 'Sanctuary Enclave',
    flightStatus: 'En-Route Cruising • Jetstream Stable',
    callsign: 'DEUZ-INNER-03',
    altitude: '36,000 FT // FL360',
    machSpeed: 'MACH 0.84',
    coordinates: '25°12\'N • 55°17\'E [DUBAI CORRIDOR]',
    accentColor: '#34D399',
    description: 'Inner circle sanctuary. Dedicated concierge line and private capsule reservations.',
    privileges: [
      '48-Hour advance private reservation window',
      'Private WhatsApp concierge direct dispatch link',
      'Bespoke monogrammed packaging & embossed dossier certificates',
      'Invitations to preview digital showroom streams'
    ]
  },
  {
    id: 'ascent',
    level: 4,
    name: 'Ascent',
    code: 'ASCENT-04',
    tagline: 'Vanguard Stratosphere',
    flightStatus: 'Supersonic Transit • Mach Barrier Crossed',
    callsign: 'DEUZ-ASCENT-04',
    altitude: '52,000 FT // FL520',
    machSpeed: 'MACH 1.45',
    coordinates: '35°40\'N • 139°46\'E [TOKYO HORIZON]',
    accentColor: '#F59E0B',
    description: 'The vanguard ascent. Bespoke tailoring consultations and direct artisan mastercraft allocations.',
    privileges: [
      'Private tailor fitting consultations (virtual or private salon)',
      'Direct master artisan allocation before public announcements',
      'Seasonal physical textile sample swatches delivered to door',
      'Priority allocation in house runway presentations'
    ]
  },
  {
    id: 'black',
    level: 5,
    name: 'Black',
    code: 'BLACK-05',
    tagline: 'Obsidian Circle',
    flightStatus: 'Sub-Orbital Ceiling • Stealth Vector',
    callsign: 'DEUZ-BLACK-05',
    altitude: '70,000 FT // FL700',
    machSpeed: 'MACH 2.20',
    coordinates: '40°42\'N • 74°00\'W [NEW YORK ZENITH]',
    accentColor: '#D4AF37',
    description: 'The black obsidian sanctum. Access to unlisted vault archives and 24/7 dedicated executive handler.',
    privileges: [
      'Exclusive access to unlisted Deuz & Co. Archival Vault pieces',
      '24/7 dedicated personal Executive Atelier Handler',
      'Invitations to private in-person seasonal salon presentations',
      'Custom bespoke 1-of-1 silhouette alterations'
    ]
  },
  {
    id: 'signature',
    level: 6,
    name: 'Signature',
    code: 'SIG-06',
    tagline: 'Apex Sovereign',
    flightStatus: 'Orbital Sovereign • Apex Trajectory Locked',
    callsign: 'DEUZ-SIG-06',
    altitude: '100,000+ FT // ORBITAL APEX',
    machSpeed: 'HYPERSONIC MACH 3.5+',
    coordinates: 'GLOBAL APEX // SOVEREIGN TRAJECTORY',
    accentColor: '#FDE047',
    description: 'The apex sovereign distinction. Highest honor of the house with permanent patron plaque and white-glove envoy delivery.',
    privileges: [
      'Commission custom 1-of-1 archival masterworks built to client specification',
      'Permanent bronze plaque engraving in the Deuz & Co. Master Ledger',
      'Worldwide white-glove personal delivery by designated house envoy',
      'Lifetime VIP privileges across all future global house activations'
    ]
  }
];

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  joinedDate?: string;
  createdAt?: any;
  orders?: Order[];
  address?: Address;
  addresses?: Address[];
  role?: UserRole;
  stage?: CustomerStage;
  houseCode?: string;
  houseId?: string;
  token?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  dossierRegistered?: boolean;
  authProvider?: string;
  linkedProviders?: string[];
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}

export interface SystemLog {
  id?: string;
  _id?: string;
  level: 'info' | 'warn' | 'error' | 'security';
  category: 'auth' | 'system' | 'order' | 'catalog' | 'security';
  message: string;
  action: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt?: any;
}

export interface AuthLogRecord {
  id?: string;
  _id?: string;
  event: string;
  email?: string;
  userId?: string;
  role?: string;
  provider?: string;
  status: 'success' | 'failed' | 'pending';
  failureReason?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  createdAt?: any;
}

