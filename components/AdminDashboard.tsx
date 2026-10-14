import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Package, Users, ShoppingBag, Edit, Trash, Plus, X, 
  Save, AlertTriangle, Search, TrendingUp, LogOut, ServerOff,
  Crown, Link as LinkIcon, CheckCircle2, Copy, UserCheck, DollarSign,
  MessageCircle, Mail, Instagram, Filter, Settings, Clock, FileText, Smartphone,
  CreditCard, ExternalLink, PenTool, Layout, Lock, Power, RefreshCw, Archive, Truck, Box, EyeOff, Check, Activity, Terminal, Database, Menu,
  Calendar, Compass, Phone, Sparkles, MapPin, Plane, ArrowUpRight, Radio, ChevronUp, KeyRound
} from 'lucide-react';
import { User, OrderStatus, ORDER_STATUS_LABELS, CustomerStage, CUSTOMER_STAGES } from '../types';
import { ADMIN_EMAIL } from '../utils/securityVerification';

interface ProductForm {
  _id?: string;
  title: string;
  price: number;
  description: string;
  category: string;
  productType: 'APPAREL';
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
}

const PREDEFINED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const INITIAL_PRODUCT: ProductForm = {
  title: '',
  price: 0,
  description: '',
  category: '',
  productType: 'APPAREL',
  fit: 'regular',
  countInStock: 0,
  isArchived: false,
  image: '',
  gallery: [],
  sizes: PREDEFINED_SIZES,
  details: {},
  imageTag: '',
  houseCode: ''
};

// Complete Images Auto-Animated Reel for Archived Products in Admin Vault
const ArchivedProductReel: React.FC<{
  product: any;
  onEdit: () => void;
  onDelete: () => void;
  onArchiveToggle: () => void;
}> = ({ product, onEdit, onDelete, onArchiveToggle }) => {
  const images: string[] = [
    product.image,
    ...(Array.isArray(product.gallery) ? product.gallery : [])
  ].filter((img, i, arr) => Boolean(img) && typeof img === 'string' && arr.indexOf(img) === i);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % images.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-[#0A0A0A] border border-gold-500/25 hover:border-gold-500/80 transition-all duration-500 group relative flex flex-col justify-between overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="h-56 overflow-hidden relative bg-black">
        {images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img 
              key={images[activeIdx]}
              src={images[activeIdx]} 
              alt={product.title} 
              initial={{ opacity: 0.35, scale: 1.04 }}
              animate={{ opacity: 0.95, scale: 1 }}
              exit={{ opacity: 0.35, scale: 0.98 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-xs">
            No Artifact Imagery
          </div>
        )}

        {/* Complete Images Auto-Scroll Pill */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-gold-500/40 text-[9px] font-mono text-gold-400 shadow-lg">
            <Sparkles size={10} className="animate-spin text-gold-400" />
            <span>{images.length} Images Auto-Cycling ({activeIdx + 1}/{images.length})</span>
          </div>
        )}

        {/* Thumbnail Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIdx ? 'bg-gold-500 w-3' : 'bg-white/30 hover:bg-white/70'}`}
                title={`Image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Actions Menu */}
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          <button 
            onClick={onEdit} 
            className="p-2 bg-black/70 text-white hover:bg-gold-500 hover:text-black transition-colors backdrop-blur-sm rounded-sm"
            title="Edit Artifact Details"
          >
            <Edit size={12} />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 bg-black/70 text-white hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm rounded-sm"
            title="Purge Artifact"
          >
            <Trash size={12} />
          </button>
        </div>

        {/* Unarchive / Restore Toggle */}
        <div className="absolute bottom-2 left-2 flex gap-2 z-10">
          <button 
            onClick={onArchiveToggle} 
            title={product.isArchived ? "Restore Artifact to Active Boutique" : "Archive to Museum Vault"}
            className={`px-3 py-1.5 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-sm transition-all shadow-md ${product.isArchived ? 'bg-gold-500 text-black font-bold hover:bg-white' : 'bg-white/10 text-white/70 hover:text-white'}`}
          >
            <Archive size={12} />
            <span>{product.isArchived ? 'Restore to Boutique' : 'Archive'}</span>
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 border-t border-white/5 bg-gradient-to-b from-[#0e0e0e] to-[#080808]">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-white text-sm font-serif tracking-wide">{product.title}</h3>
          <span className="text-gold-500 text-xs font-mono font-bold">₹{product.price?.toLocaleString('en-IN') || product.price}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/50 font-mono">
          <span>{product.category} {product.houseCode ? `∞ ${product.houseCode}` : ''}</span>
          <span className="text-gold-400 font-bold">
            {product.isArchived ? 'VAULT ARCHIVE' : 'SOLD OUT'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
    onExit: () => void;
    onViewArchive?: () => void;
    onViewConcierge?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit, onViewArchive, onViewConcierge }) => {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const isAdmin = user?.role === 'admin';

  // Navigation
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users' | 'dashboard' | 'concierge' | 'settings' | 'audit' | 'trash' | 'archive'>('dashboard');
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'confirmed' | 'shipped' | 'cancelled'>('all');
  
  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [authLogs, setAuthLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logStreamFilter, setLogStreamFilter] = useState<'all' | 'auth' | 'system' | 'audit'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);

  // Private Concierge Appointments State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Concierge State
  const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);
  
  // Modals & Forms
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'Payment Link', referenceId: '', note: '' });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductForm>(INITIAL_PRODUCT);
  const [isEditing, setIsEditing] = useState(false);

  // User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ fullName: '', email: '', password: '', role: 'concierge', mobile: '', houseCode: '' });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStageFilter, setUserStageFilter] = useState<string>('all');
  const [updatingStageUserId, setUpdatingStageUserId] = useState<string | null>(null);

  // Unique House Code Management
  const [houseCodeModal, setHouseCodeModal] = useState<{
    isOpen: boolean;
    user: User | null;
    code: string;
    error: string | null;
    isSaving: boolean;
  }>({
    isOpen: false,
    user: null,
    code: '',
    error: null,
    isSaving: false
  });

  const generateUniqueHouseCode = () => {
    const existingCodes = new Set(
      users
        .map(u => (u.houseCode || u.houseId || '').trim().toUpperCase())
        .filter(Boolean)
    );
    let candidate = '';
    let attempts = 0;
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      candidate = `DEUZ-HC-${num}`;
      attempts++;
    } while (existingCodes.has(candidate) && attempts < 100);
    return candidate;
  };

  const openHouseCodeModal = (targetUser: User) => {
    setHouseCodeModal({
      isOpen: true,
      user: targetUser,
      code: targetUser.houseCode || targetUser.houseId || '',
      error: null,
      isSaving: false
    });
  };

  const handleSaveHouseCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!houseCodeModal.user) return;

    const trimmed = houseCodeModal.code.trim().toUpperCase();
    if (!trimmed) {
      setHouseCodeModal(prev => ({ ...prev, error: 'Please enter a valid unique House Code (e.g. DEUZ-HC-104).' }));
      return;
    }

    // Uniqueness validation against other clients
    const duplicate = users.find(u => 
      u.id !== houseCodeModal.user?.id && 
      ((u.houseCode || '').trim().toUpperCase() === trimmed || (u.houseId || '').trim().toUpperCase() === trimmed)
    );

    if (duplicate) {
      setHouseCodeModal(prev => ({ 
        ...prev, 
        error: `Conflict: Code "${trimmed}" is already assigned to ${duplicate.fullName} (${duplicate.email}). House Codes must be strictly unique.` 
      }));
      return;
    }

    setHouseCodeModal(prev => ({ ...prev, isSaving: true, error: null }));
    try {
      const res = await db.updateUserHouseCode(houseCodeModal.user.id, trimmed);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === houseCodeModal.user!.id ? { ...u, houseCode: trimmed, houseId: trimmed } : u));
        showNotification(`House Code "${trimmed}" successfully assigned to ${houseCodeModal.user.fullName} and synchronized.`);
        setHouseCodeModal({ isOpen: false, user: null, code: '', error: null, isSaving: false });
      }
    } catch (err: any) {
      setHouseCodeModal(prev => ({ ...prev, isSaving: false, error: err.message || 'Failed to update House Code' }));
    }
  };

  const handleClearHouseCode = async () => {
    if (!houseCodeModal.user) return;
    setHouseCodeModal(prev => ({ ...prev, isSaving: true, error: null }));
    try {
      await db.updateUserProfile(houseCodeModal.user.id, { houseCode: '', houseId: '' });
      setUsers(prev => prev.map(u => u.id === houseCodeModal.user!.id ? { ...u, houseCode: '', houseId: '' } : u));
      showNotification(`House Code cleared for ${houseCodeModal.user.fullName}.`);
      setHouseCodeModal({ isOpen: false, user: null, code: '', error: null, isSaving: false });
    } catch (err: any) {
      setHouseCodeModal(prev => ({ ...prev, isSaving: false, error: err.message || 'Failed to clear House Code' }));
    }
  };

  const handleUpdateUserStage = async (userId: string, newStage: CustomerStage, userName: string) => {
    setUpdatingStageUserId(userId);
    try {
      const res = await db.updateUserStage(userId, newStage);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, stage: newStage } : u));
        const stageMeta = CUSTOMER_STAGES.find(s => s.id === newStage);
        showNotification(`${userName || 'Client'} elevated to Stage ${stageMeta?.level || ''} (${stageMeta?.name || newStage})`);
      } else {
        showNotification('Failed to update client stage', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error updating stage', 'error');
    } finally {
      setUpdatingStageUserId(null);
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    if (!targetUser) return;
    if (targetUser.email && targetUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
      showNotification('Executive Root Administrator cannot be removed.', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Remove User Dossier',
      message: `Are you sure you want to permanently remove "${targetUser.fullName || 'Operative'}" (${targetUser.email || 'No email'})? This will erase their user profile, permissions, and house assignments.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await db.deleteUserByAdmin(targetUser.id, targetUser.email);
          if (res.success) {
            setUsers(prev => prev.filter(u => u.id !== targetUser.id));
            setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
            showNotification(res.message || `User dossier removed successfully.`);
          } else {
            showNotification(res.message || 'Failed to remove user dossier.', 'error');
          }
        } catch (err: any) {
          showNotification(err.message || 'Failed to remove user.', 'error');
        } finally {
          setActionLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Stats
  const [stats, setStats] = useState({ 
      revenue: 0, 
      totalOrders: 0, 
      totalUsers: 0, 
      lowStock: 0,
      awaitingConcierge: 0,
      awaitingPayment: 0,
      paidUnfulfilled: 0
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!orders.length) setLoading(true);
    
    setIsOfflineMode(false);
    try {
      const ordPromise = db.getAllOrders();
      const prodPromise = isAdmin ? db.getProducts() : Promise.resolve([]);
      const userPromise = isAdmin ? db.getUsers() : Promise.resolve([]);
      const apptPromise = db.getAppointments();
      const settPromise = isAdmin ? db.getSystemSettings() : Promise.resolve(null);
      const logPromise = isAdmin ? db.getAuditLogs() : Promise.resolve([]);
      const authLogPromise = isAdmin ? db.getAuthLogs() : Promise.resolve([]);
      const sysLogPromise = isAdmin ? db.getSystemLogs() : Promise.resolve([]);

      const [ordData, prodData, userData, apptData, settingsData, logData, authLogData, sysLogData] = await Promise.allSettled([
        ordPromise,
        prodPromise,
        userPromise,
        apptPromise,
        settPromise,
        logPromise,
        authLogPromise,
        sysLogPromise
      ]);

      if (ordData.status === 'rejected') {
          if (process.env.NODE_ENV !== 'production') {
              setIsOfflineMode(true);
          }
      } else {
          const safeOrders = ordData.status === 'fulfilled' && Array.isArray(ordData.value) ? ordData.value : [];
          const safeProducts = prodData.status === 'fulfilled' && Array.isArray(prodData.value) ? prodData.value : [];
          const safeUsers = userData.status === 'fulfilled' && Array.isArray(userData.value) ? userData.value : [];
          const safeAppointments = apptData.status === 'fulfilled' && Array.isArray(apptData.value) ? apptData.value : [];
          const safeSettings = settingsData.status === 'fulfilled' ? settingsData.value : null;
          const safeLogs = logData.status === 'fulfilled' && Array.isArray(logData.value) ? logData.value : [];
          const safeAuthLogs = authLogData.status === 'fulfilled' && Array.isArray(authLogData.value) ? authLogData.value : [];
          const safeSysLogs = sysLogData.status === 'fulfilled' && Array.isArray(sysLogData.value) ? sysLogData.value : [];

          setOrders(safeOrders);
          setProducts(safeProducts);
          setUsers(safeUsers);
          setAppointments(safeAppointments);
          setLogs(safeLogs);
          setAuthLogs(safeAuthLogs);
          setSystemLogs(safeSysLogs);
          if (safeSettings) {
              setSettings((prev: any) => {
                  if (prev) return prev;
                  return {
                      ...safeSettings,
                      siteContent: safeSettings.siteContent || {},
                      conciergeConfig: safeSettings.conciergeConfig || {}
                  };
              });
          }
          
          const revenue = safeOrders.reduce((acc: number, o: any) => {
             return (o?.paymentStatus === 'Paid' && typeof o?.totalAmount === 'number') ? acc + o.totalAmount : acc;
          }, 0);
          
          const lowStock = safeProducts.filter((p: any) => (p?.countInStock || 0) < 10).length;
          
          const awaitingConcierge = safeOrders.filter((o: any) => o.orderStatus === 'ORDER_SECURED').length;
          const awaitingPayment = safeOrders.filter((o: any) => o.orderStatus === 'ORDER_SECURED' && o.paymentLink).length;
          const paidUnfulfilled = safeOrders.filter((o: any) => ['PAYMENT_AUTHORIZED', 'ORDER_VERIFIED', 'IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;

          setStats({
            revenue,
            totalOrders: safeOrders.length,
            totalUsers: safeUsers.length,
            lowStock,
            awaitingConcierge,
            awaitingPayment,
            paidUnfulfilled
          });
      }
    } catch (error) {
      setIsOfflineMode(true);
    }
    setLoading(false);
  }, [isAdmin, orders.length]);

  useEffect(() => {
    fetchData();

    // Attach real-time Firestore listeners for live synchronisation
    const unsubProducts = db.subscribeProducts((liveProds) => {
      if (Array.isArray(liveProds)) setProducts(liveProds);
    });

    const unsubOrders = db.subscribeOrders((liveOrders) => {
      if (Array.isArray(liveOrders)) {
        setOrders(liveOrders);
        const revenue = liveOrders.reduce((acc: number, o: any) => {
          return (o?.paymentStatus === 'Paid' && typeof o?.totalAmount === 'number') ? acc + o.totalAmount : acc;
        }, 0);
        const awaitingConcierge = liveOrders.filter((o: any) => o.orderStatus === 'ORDER_SECURED').length;
        const awaitingPayment = liveOrders.filter((o: any) => o.orderStatus === 'ORDER_SECURED' && o.paymentLink).length;
        const paidUnfulfilled = liveOrders.filter((o: any) => ['PAYMENT_AUTHORIZED', 'ORDER_VERIFIED', 'IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;
        setStats(prev => ({
          ...prev,
          revenue,
          totalOrders: liveOrders.length,
          awaitingConcierge,
          awaitingPayment,
          paidUnfulfilled
        }));
      }
    });

    const unsubAppointments = db.subscribeAppointments((liveAppts) => {
      if (Array.isArray(liveAppts)) setAppointments(liveAppts);
    });

    const unsubUsers = db.subscribeUsers((liveUsers) => {
      if (Array.isArray(liveUsers)) {
        setUsers(liveUsers);
        setStats(prev => ({ ...prev, totalUsers: liveUsers.length }));
      }
    });

    const interval = setInterval(fetchData, 15000);
    return () => {
      clearInterval(interval);
      unsubProducts();
      unsubOrders();
      unsubAppointments();
      unsubUsers();
    };
  }, [fetchData]);

  const handleManualFirebaseSync = async () => {
    setIsSyncing(true);
    try {
      await fetchData();
      showNotification("Database Synchronized (Real-time connection active)");
    } catch (e: any) {
      showNotification("Sync error: " + (e.message || "Network issue"), "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      await db.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => (a._id === id || a.id === id) ? { ...a, status } : a));
      showNotification(`Appointment Dossier status updated to ${status}`);
    } catch (e: any) {
      showNotification(e.message || "Failed to update appointment", 'error');
    }
    setActionLoading(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Appointment Dossier',
      message: 'Are you sure you want to permanently purge this concierge appointment record from the database?',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await db.deleteAppointment(id);
          setAppointments(prev => prev.filter(a => a._id !== id && a.id !== id));
          showNotification('Appointment Dossier Purged');
        } catch (e: any) {
          showNotification(e.message || "Failed to delete appointment", 'error');
        }
        setActionLoading(false);
      }
    });
  };

  // --- ACTIONS ---

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          await db.createUser(newUserForm);
          await fetchData();
          showNotification(`Operative ${newUserForm.fullName} Registered`);
          setIsUserModalOpen(false);
          setNewUserForm({ fullName: '', email: '', password: '', role: 'concierge', mobile: '', houseCode: '' });
      } catch (e: any) {
          showNotification(e.message || "Failed to create user", 'error');
      }
      setActionLoading(false);
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          const cleanPayload = JSON.parse(JSON.stringify({ 
              conciergeConfig: settings.conciergeConfig,
              siteContent: settings.siteContent
          }));
          await db.updateSystemSettings(cleanPayload);
          await refreshSettings();
          showNotification("System Configuration Updated");
      } catch (e: any) {
          console.error("Settings update error:", e);
          showNotification("Failed to update settings: " + (e.message || "Unknown error"), 'error');
      }
      setActionLoading(false);
  };

  const handleSetLatestDrop = async (product: any) => {
      setActionLoading(true);
      try {
          const prodId = product._id || product.id;
          const currentSiteContent = settings?.siteContent || {};
          const updatedSiteContent = {
              ...currentSiteContent,
              latestDropProductId: prodId,
              latestDropTitle: product.title,
              latestDropDescription: product.description,
              latestDropImage: product.image,
              latestDropCategory: product.category,
              latestDropPrice: `₹${product.price?.toLocaleString('en-IN') || product.price}`,
              latestDropStatus: product.countInStock > 0 ? 'Active' : 'Exhausted',
              sovereignCategory: product.category,
              sovereignPrice: `₹${product.price?.toLocaleString('en-IN') || product.price}`,
              sovereignStatus: product.countInStock > 0 ? 'Active' : 'Exhausted'
          };
          const newSettings = {
              ...settings,
              siteContent: updatedSiteContent
          };
          setSettings(newSettings);

          const cleanPayload = JSON.parse(JSON.stringify({
              conciergeConfig: settings?.conciergeConfig || {},
              siteContent: updatedSiteContent
          }));
          await db.updateSystemSettings(cleanPayload);
          await refreshSettings();
          showNotification(`"${product.title}" set as Collection 1 Latest Drop on Homepage`);
      } catch (e: any) {
          console.error("Set latest drop error:", e);
          showNotification("Failed to set latest drop: " + (e.message || "Unknown error"), 'error');
      }
      setActionLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
        await db.updateOrderStatus(id, status);
        const updatedOrders = orders.map(o => (o._id === id || o.id === id || o.conciergeCode === id) ? { ...o, orderStatus: status } : o);
        setOrders(updatedOrders);
        if (selectedOrder && (selectedOrder._id === id || selectedOrder.id === id || selectedOrder.conciergeCode === id)) {
            setSelectedOrder({ ...selectedOrder, orderStatus: status });
        }
        showNotification(`Order status updated to ${ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}`);
    } catch (e) {
        showNotification("Failed to update status", 'error');
    }
  };

  const handleNotesUpdate = async () => {
      if (!selectedOrder) return;
      setActionLoading(true);
      try {
          // IMPORTANT: Re-send current status to ensure valid API call structure, but only notes update
          await db.updateOrderStatus(selectedOrder._id, selectedOrder.orderStatus, orderNotes);
          setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, internalNotes: orderNotes } : o));
          showNotification("Internal notes saved");
      } catch (e) {
          showNotification("Failed to save notes", 'error');
      }
      setActionLoading(false);
  };

  const handleManualStatusToggle = async () => {
      if (!selectedOrder) return;
      const nextStatus = 'PAYMENT_AUTHORIZED';
      setConfirmModal({
        isOpen: true,
        title: 'Confirm Manual Payment',
        message: `Confirm manual payment and transition to ${nextStatus}? This will mark the allocation as secured and set stock to 0 for unique items.`,
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setActionLoading(true);
          await handleStatusUpdate(selectedOrder._id, nextStatus);
          setActionLoading(false);
        }
      });
  };

  const handleViewOrder = (order: any) => {
      setSelectedOrder(order);
      setOrderNotes(order.internalNotes || '');
      setTrackingInfo(order.trackingInfo || { carrier: '', trackingNumber: '', trackingUrl: '' });
      setIsOrderModalOpen(true);
  };

  const handleTrackingUpdate = async () => {
      if (!selectedOrder) return;
      setActionLoading(true);
      try {
          await db.updateOrderTracking(selectedOrder._id, trackingInfo);
          setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, trackingInfo } : o));
          showNotification("Tracking information updated");
      } catch (e) {
          showNotification("Failed to update tracking", 'error');
      }
      setActionLoading(false);
  };

  const handleOpenPaymentModal = (order: any) => {
      setPaymentOrder(order);
      setPaymentForm({
          amount: order.totalAmount,
          method: 'Payment Link',
          referenceId: '',
          note: ''
      });
      setIsPaymentModalOpen(true);
  };

  const submitManualPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!paymentOrder) return;
      setActionLoading(true);
      try {
          await db.recordManualPayment(paymentOrder._id, paymentForm);
          setOrders(prev => prev.map(o => o._id === paymentOrder._id ? { 
              ...o, 
              paymentStatus: 'Paid', 
              orderStatus: 'PAYMENT_AUTHORIZED' 
          } : o));
          showNotification(`Payment Recorded for ${paymentOrder.conciergeCode}`);
          setIsPaymentModalOpen(false);
          setPaymentOrder(null);
          if (selectedOrder && selectedOrder._id === paymentOrder._id) {
              setSelectedOrder({ ...selectedOrder, paymentStatus: 'Paid', orderStatus: 'PAYMENT_AUTHORIZED' });
              fetchData();
          }
      } catch (err) {
          showNotification("Failed to record payment", 'error');
      }
      setActionLoading(false);
  };

  const handleGeneratePaymentLink = async (order: any) => {
      const customLink = prompt("Enter custom payment link (e.g., Stripe, PayPal):", order.paymentLink || "");
      if (customLink !== null) {
          setGeneratingLinkFor(order._id);
          try {
              await db.updateOrderPaymentLink(order._id, customLink);
              setOrders(prev => prev.map(o => o._id === order._id ? { ...o, paymentLink: customLink } : o));
              await navigator.clipboard.writeText(customLink);
              showNotification(`Secure Link Copied`);
              if (selectedOrder && selectedOrder._id === order._id) {
                  setSelectedOrder({ ...selectedOrder, paymentLink: customLink });
                  fetchData();
              }
          } catch (e) {
              showNotification("Failed to update secure link", 'error');
          }
          setGeneratingLinkFor(null);
      }
  };

  const handleTrashOrder = async (id: string) => {
      setConfirmModal({
        isOpen: true,
        title: 'Move to Trash',
        message: 'Are you sure you want to move this order to the trash?',
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setActionLoading(true);
          try {
              await db.trashOrder(id);
              setOrders(prev => prev.map(o => o._id === id ? { ...o, isTrashed: true } : o));
              showNotification("Order moved to trash");
          } catch (e) {
              showNotification("Failed to trash order", 'error');
          }
          setActionLoading(false);
        }
      });
  };

  const handleRestoreOrder = async (id: string) => {
      setActionLoading(true);
      try {
          await db.restoreOrder(id);
          setOrders(prev => prev.map(o => o._id === id ? { ...o, isTrashed: false } : o));
          showNotification("Order restored");
      } catch (e) {
          showNotification("Failed to restore order", 'error');
      }
      setActionLoading(false);
  };

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('DEUZ & CO - System Report', 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Orders Table
      doc.setFontSize(14);
      doc.text('Recent Orders', 14, 45);
      
      const orderData = orders.filter(o => !o.isTrashed).map(o => [
        o.conciergeCode || o.code || 'N/A',
        o.userEmail || 'Guest',
        `₹${o.totalAmount}`,
        o.orderStatus,
        o.paymentStatus,
        o.items?.map((i: any) => `${i.quantity}x ${i.title || i.product?.title || 'Item'} (${i.selectedSize || 'std'})`).join(', ') || 'No items'
      ]);
      
      autoTable(doc, {
        startY: 50,
        head: [['Code', 'Client', 'Amount', 'Status', 'Payment', 'Items']],
        body: orderData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 20, 20] }
      });
      
      // Products Table
      const finalY = (doc as any).lastAutoTable.finalY || 50;
      doc.text('Inventory Status', 14, finalY + 15);
      
      const productData = products.map(p => [
        p.title,
        p.category,
        `₹${p.price}`,
        p.countInStock.toString(),
        p.isArchived ? 'Yes' : 'No',
        p.details ? (typeof p.details === 'object' ? Object.entries(p.details).map(([k,v]) => `${k}: ${v}`).join(', ') : p.details.toString()) : 'No details'
      ]);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Product', 'Category', 'Price', 'Stock', 'Archived', 'Details']],
        body: productData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 20, 20] }
      });

      // Users Table
      const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 20;
      doc.text('Operatives / Users', 14, finalY2 + 15);
      
      const usersData = users.map(u => [
        u.fullName || 'N/A',
        u.email || 'N/A',
        u.role || 'user',
        (u as any).createdAt ? new Date((u as any).createdAt).toLocaleDateString() : (u.joinedDate || 'N/A')
      ]);

      autoTable(doc, {
        startY: finalY2 + 20,
        head: [['Name', 'Email', 'Role', 'Joined']],
        body: usersData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 20, 20] }
      });
      
      doc.save('deuz-system-report.pdf');
      showNotification('Report generated successfully');
    } catch (error) {
      console.error(error);
      showNotification('Failed to generate report', 'error');
    }
  };

  // --- PRODUCT MANAGEMENT ---

  const handleOpenProductModal = (product?: any) => {
    if (product) {
      setIsEditing(true);
      setCurrentProduct({
        ...product,
        productType: product.productType || 'APPAREL',
        sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : PREDEFINED_SIZES,
        details: product.details && typeof product.details === 'object' ? product.details : {},
        imageTag: product.imageTag || '',
        isArchived: !!product.isArchived
      });
    } else {
      setIsEditing(false);
      setCurrentProduct(INITIAL_PRODUCT);
    }
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing && currentProduct._id) {
        await db.updateProduct(currentProduct._id, currentProduct);
        showNotification('Product updated');
      } else {
        await db.createProduct(currentProduct);
        showNotification('Product created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to save product', 'error');
    }
    setActionLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Artifact',
      message: 'Delete this artifact from the collection?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        try {
          await db.deleteProduct(id);
          setProducts(prev => prev.filter(p => p._id !== id));
          showNotification('Product removed');
          fetchData();
        } catch (error: any) {
          showNotification(error.message || 'Failed to delete', 'error');
        }
        setActionLoading(false);
      }
    });
  };

  const handleQuickStockToggle = async (product: any) => {
      // Toggle logic: If > 0, set to 0 (Sold Out). If 0, set to 1 (Activate/Restock).
      const newStock = product.countInStock > 0 ? 0 : 1;
      
      try {
          await db.updateProduct(product._id, { countInStock: newStock });
          setProducts(prev => prev.map(p => p._id === product._id ? { ...p, countInStock: newStock } : p));
          showNotification(newStock === 0 ? 'Item marked Sold Out (Stock 0)' : 'Item Restocked (Stock 1)');
      } catch (e) {
          showNotification('Stock update failed', 'error');
      }
  };

  const handleArchiveToggle = async (product: any) => {
      const newArchivedState = !product.isArchived;
      try {
          await db.updateProduct(product._id, { isArchived: newArchivedState });
          setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isArchived: newArchivedState } : p));
          showNotification(newArchivedState ? 'Product Archived (Hidden)' : 'Product Unarchived (Visible)');
      } catch (e) {
          showNotification('Archive toggle failed', 'error');
      }
  };

  const handleCancelOrder = async () => {
      if (!selectedOrder) return;
      const reason = prompt("Enter cancellation reason (visible to internal staff):");
      if (reason !== null) {
          setActionLoading(true);
          try {
              // Call the specific cancel endpoint which handles restocking
              await db.cancelOrder(selectedOrder._id, reason);
              setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, orderStatus: 'CANCELLED' } : o));
              setSelectedOrder({ ...selectedOrder, orderStatus: 'CANCELLED' });
              showNotification("Order Cancelled & Stock Restored");
          } catch (e: any) {
              showNotification(e.message || "Cancellation failed", 'error');
          }
          setActionLoading(false);
      }
  };

  const renderLogDetails = (details: any) => {
      if (!details) return <span className="text-white/20 italic">No details</span>;
      
      // Flatten simple objects for display
      return (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(details).map(([key, value]) => {
                  const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                  return (
                      <span key={key} className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-widest text-gold-500/70">{key}:</span>
                          <span className="text-xs text-white/70 font-mono truncate max-w-[200px]" title={valStr}>{valStr}</span>
                      </span>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#020202] text-white font-sans flex relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-64 border-r border-white/10 flex flex-col fixed h-full bg-[#050505] z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
         <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-serif tracking-[0.2em] text-white">DEUZ<span className="text-gold-500">CORP</span></h1>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Command Center</p>
            </div>
            <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
            </button>
         </div>
         
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[
                { id: 'dashboard', icon: Layout, label: 'Overview' },
                { id: 'orders', icon: Package, label: 'Allocations' },
                { id: 'concierge', icon: Calendar, label: 'Concierge Dossiers', badge: appointments.filter(a => a.status === 'PENDING').length },
                { id: 'products', icon: ShoppingBag, label: 'Inventory' },
                ...(isAdmin ? [
                    { id: 'users', icon: Users, label: 'Operatives' }, 
                    { id: 'audit', icon: Activity, label: 'Audit Log' },
                    { id: 'settings', icon: Settings, label: 'System' },
                    { id: 'archive', icon: Archive, label: 'Archive' },
                    { id: 'trash', icon: Trash, label: 'Trash' }
                ] : [])
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => {
                        setActiveTab(item.id as any);
                        setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-300 group ${activeTab === item.id ? 'bg-gold-500/10 text-gold-500' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3">
                        <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs uppercase tracking-widest font-bold">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gold-500 text-black text-[10px] font-mono font-bold animate-pulse">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
         </nav>

         <div className="p-4 border-t border-white/10">
            <button onClick={onExit} className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-sm transition-colors">
                <LogOut size={18} />
                <span className="text-xs uppercase tracking-widest font-bold">Logout</span>
            </button>
         </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 relative overflow-x-hidden overflow-y-auto h-screen">
         {/* Status Bar */}
         <header className="sticky top-0 z-30 bg-[#020202]/90 backdrop-blur-md -mx-4 px-4 py-4 md:mx-0 md:px-0 md:py-0 md:static md:bg-transparent md:backdrop-blur-none flex flex-row justify-between items-center mb-6 md:mb-10 gap-4 border-b border-white/10 md:border-none">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-white hover:text-gold-500 transition-colors" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h2 className="text-lg md:text-2xl font-serif text-white tracking-widest truncate max-w-[150px] sm:max-w-none">
                    {activeTab === 'dashboard' ? 'SITUATION REPORT' : activeTab.toUpperCase()}
                </h2>
            </div>
            {/* ... Status indicators ... */}
            <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={handleManualFirebaseSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 text-white/70 hover:text-gold-500 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
                  title="Force Live Synchronisation with Database"
                >
                  <RefreshCw size={13} className={isSyncing ? "animate-spin text-gold-500" : "text-gold-400"} />
                  <span className="hidden sm:inline text-[9px] uppercase tracking-widest font-mono font-bold">
                    {isSyncing ? 'Syncing...' : 'Live Sync'}
                  </span>
                </button>
                <button 
                  onClick={generatePDFReport}
                  className="flex items-center gap-2 text-gold-500 hover:text-white transition-colors"
                  title="Download Full System Report (PDF)"
                >
                  <FileText size={18} />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-bold">Export Report</span>
                </button>
                {isOfflineMode && (
                    <div className="hidden sm:flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        <ServerOff size={14} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Offline Mode</span>
                    </div>
                )}
                <div className="flex items-center gap-2" title="Firebase Firestore Live Sync Status">
                    <div className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/50">Firestore {isOfflineMode ? 'Severed' : 'Live'}</span>
                </div>
                <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-6">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {user?.fullName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs text-white">{user?.fullName}</p>
                        <p className="text-[9px] text-gold-500 uppercase tracking-widest">{user?.role}</p>
                    </div>
                </div>
            </div>
         </header>

         {/* Content Area */}
         {activeTab === 'dashboard' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Stats Cards */}
                <div className="bg-[#0A0A0A] border border-white/10 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={40} /></div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Revenue</p>
                    <h3 className="text-2xl md:text-3xl font-serif text-white">₹{stats.revenue.toLocaleString('en-IN')}</h3>
                </div>
                {/* ... other stats ... */}
                <div className="bg-[#0A0A0A] border border-white/10 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Package size={40} /></div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Orders</p>
                    <h3 className="text-2xl md:text-3xl font-serif text-white">{stats.totalOrders}</h3>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={40} /></div>
                     <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Client Base</p>
                     <h3 className="text-2xl md:text-3xl font-serif text-white">{stats.totalUsers}</h3>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={40} /></div>
                     <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Low Stock Alerts</p>
                     <h3 className="text-2xl md:text-3xl font-serif text-gold-500">{stats.lowStock}</h3>
                </div>

                <div className="col-span-1 sm:col-span-2 bg-[#0A0A0A] border border-white/10 p-6 flex items-center justify-between">
                     <div>
                         <h4 className="text-white text-sm uppercase tracking-widest mb-1">Concierge Queue</h4>
                         <p className="text-white/40 text-xs">Pending review</p>
                     </div>
                     <span className="text-3xl md:text-4xl font-serif text-white">{stats.awaitingConcierge}</span>
                </div>
                <div className="col-span-1 sm:col-span-2 bg-[#0A0A0A] border border-white/10 p-6 flex items-center justify-between">
                     <div>
                         <h4 className="text-white text-sm uppercase tracking-widest mb-1">Payment Pending</h4>
                         <p className="text-white/40 text-xs">Links sent</p>
                     </div>
                     <span className="text-3xl md:text-4xl font-serif text-gold-500">{stats.awaitingPayment}</span>
                </div>
             </div>
         )}

         {activeTab === 'orders' && (
             <div className="space-y-6">
                 {/* Order Filters */}
                 <div className="flex flex-wrap gap-2 mb-6">
                     {['all', 'new', 'confirmed', 'shipped', 'cancelled'].map((filter) => (
                         <button
                             key={filter}
                             onClick={() => setOrderFilter(filter as any)}
                             className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                                 orderFilter === filter 
                                 ? 'border-gold-500 text-gold-500 bg-gold-500/10' 
                                 : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                             }`}
                         >
                             {filter}
                         </button>
                     ))}
                 </div>

                 {/* Orders Table */}
                 <div className="bg-[#0A0A0A] border border-white/10 overflow-x-auto">
                     <table className="w-full text-left min-w-[800px]">
                         <thead className="bg-white/5 border-b border-white/10">
                             <tr>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Ref ID</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Client</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Total</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Status</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {orders.filter(o => !o.isTrashed).filter(o => {
                                 if (orderFilter === 'all') return true;
                                 if (orderFilter === 'new') return ['ORDER_SECURED', 'PAYMENT_AUTHORIZED'].includes(o.orderStatus);
                                 if (orderFilter === 'confirmed') return ['ORDER_VERIFIED', 'IN_PRODUCTION', 'QUALITY_ASSURED', 'READY_FOR_DISPATCH'].includes(o.orderStatus);
                                 if (orderFilter === 'shipped') return ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXPERIENCE_UNLOCKED'].includes(o.orderStatus);
                                 if (orderFilter === 'cancelled') return o.orderStatus === 'CANCELLED';
                                 return true;
                             }).map((order) => (
                                 <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                                     <td className="p-4 text-xs font-mono text-gold-500">{order.conciergeCode || order._id.slice(-6)}</td>
                                     <td className="p-4">
                                         <p className="text-white text-xs font-bold">{order.shippingAddress?.fullName || 'Unknown'}</p>
                                         <p className="text-white/40 text-[10px]">{order.shippingAddress?.city}</p>
                                     </td>
                                     <td className="p-4 text-xs text-white">₹{order.totalAmount?.toLocaleString('en-IN') || 0}</td>
                                     <td className="p-4">
                                         <div className="flex flex-col gap-1.5">
                                             <select
                                                 value={order.orderStatus}
                                                 onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                 className="bg-black/90 border border-white/20 text-gold-400 text-[10px] font-mono uppercase px-2 py-1 rounded-sm focus:border-gold-500 outline-none cursor-pointer hover:border-gold-500/60 transition-colors"
                                                 title="Update Order Status"
                                             >
                                                 {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                                     <option key={key} value={key} className="bg-[#111] text-white">
                                                         {label}
                                                     </option>
                                                 ))}
                                             </select>
                                             <span className={`px-2 py-0.5 text-[8.5px] uppercase tracking-wider rounded-sm border w-fit ${
                                                 order.orderStatus === 'ORDER_SECURED' ? 'border-orange-500/30 text-orange-400 bg-orange-900/10' :
                                                 order.orderStatus === 'PAYMENT_AUTHORIZED' ? 'border-green-500/30 text-green-400 bg-green-900/10' :
                                                 order.orderStatus === 'CANCELLED' ? 'border-red-500/30 text-red-400 bg-red-900/10' :
                                                 'border-white/20 text-white/60'
                                             }`}>
                                                 {order.orderStatus}
                                             </span>
                                         </div>
                                     </td>
                                     <td className="p-4 flex items-center gap-2">
                                         <button onClick={() => handleViewOrder(order)} className="p-2 hover:bg-white/10 rounded-sm text-white/60 hover:text-white transition-colors" title="View Details">
                                             <Layout size={14} />
                                         </button>
                                         {order.orderStatus === 'ORDER_SECURED' && (
                                             <>
                                                 <button 
                                                     onClick={() => handleGeneratePaymentLink(order)}
                                                     className="p-2 hover:bg-gold-500/10 rounded-sm text-gold-500 transition-colors" 
                                                     title="Generate Payment Link"
                                                 >
                                                     {generatingLinkFor === order._id ? <RefreshCw size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                                                 </button>
                                                 <button 
                                                     onClick={() => handleOpenPaymentModal(order)}
                                                     className="p-2 hover:bg-green-500/10 rounded-sm text-green-500 transition-colors" 
                                                     title="Record Manual Payment"
                                                 >
                                                     <DollarSign size={14} />
                                                 </button>
                                             </>
                                         )}
                                         <button onClick={() => handleTrashOrder(order._id)} className="p-2 hover:bg-red-500/10 rounded-sm text-red-500 transition-colors" title="Move to Trash">
                                             <Trash size={14} />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}

         {/* --- CONCIERGE DOSSIERS & APPOINTMENTS TAB --- */}
         {activeTab === 'concierge' && (() => {
             const filteredAppointments = appointments.filter(appt => {
                 if (appointmentFilter !== 'all' && appt.status !== appointmentFilter) return false;
                 if (appointmentSearch.trim()) {
                     const q = appointmentSearch.toLowerCase();
                     const name = (appt.fullName || appt.name || '').toLowerCase();
                     const email = (appt.email || '').toLowerCase();
                     const phone = (appt.phone || appt.mobile || '').toLowerCase();
                     const code = (appt.dossierCode || appt.code || appt.id || '').toLowerCase();
                     const service = (appt.consultationType || appt.service || '').toLowerCase();
                     const city = (appt.location || appt.city || '').toLowerCase();
                     return name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q) || service.includes(q) || city.includes(q);
                 }
                 return true;
             });

             const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
             const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
             const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

             return (
                 <div className="space-y-6">
                     {/* Header and Quick Stats */}
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                         <div>
                             <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-[9px] uppercase tracking-widest font-mono mb-2">
                                 <Sparkles size={11} className="text-gold-400 animate-pulse" />
                                 <span>Real-Time Synchronized</span>
                             </div>
                             <h3 className="text-2xl font-serif text-white tracking-wide">Concierge Dossiers & Salon Appointments</h3>
                             <p className="text-white/50 text-xs font-mono mt-1">
                               Client consultation requests, bespoke garment commissions, and private salon viewings.
                             </p>
                         </div>
                         <div className="flex items-center gap-3">
                             {onViewConcierge && (
                                 <button
                                     onClick={onViewConcierge}
                                     className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-white text-black text-xs uppercase tracking-widest font-mono font-bold transition-all rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
                                 >
                                     <Compass size={13} /> Open Private Concierge
                                 </button>
                             )}
                             <button
                                 onClick={handleManualFirebaseSync}
                                 disabled={isSyncing}
                                 className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-mono rounded-sm transition-colors cursor-pointer"
                                 title="Sync Firestore"
                             >
                                 <RefreshCw size={13} className={isSyncing ? "animate-spin text-gold-500" : ""} />
                                 <span className="hidden sm:inline">Refresh</span>
                             </button>
                         </div>
                     </div>

                     {/* KPI Summary Grid */}
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-sm">
                             <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Total Bookings</p>
                             <p className="text-2xl font-serif text-white mt-1">{appointments.length}</p>
                         </div>
                         <div className="bg-[#0A0A0A] border border-gold-500/30 p-4 rounded-sm">
                             <div className="flex justify-between items-center">
                                 <p className="text-[10px] uppercase tracking-widest text-gold-400 font-mono">Pending Review</p>
                                 {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />}
                             </div>
                             <p className="text-2xl font-serif text-gold-400 mt-1">{pendingCount}</p>
                         </div>
                         <div className="bg-[#0A0A0A] border border-emerald-500/30 p-4 rounded-sm">
                             <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono">Confirmed</p>
                             <p className="text-2xl font-serif text-emerald-400 mt-1">{confirmedCount}</p>
                         </div>
                         <div className="bg-[#0A0A0A] border border-sky-500/30 p-4 rounded-sm">
                             <p className="text-[10px] uppercase tracking-widest text-sky-400 font-mono">Completed</p>
                             <p className="text-2xl font-serif text-sky-400 mt-1">{completedCount}</p>
                         </div>
                     </div>

                     {/* Filter and Search Bar */}
                     <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#070707] p-4 border border-white/10 rounded-sm">
                         <div className="flex flex-wrap gap-2">
                             {(['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((filterKey) => {
                                 const count = filterKey === 'all' 
                                     ? appointments.length 
                                     : appointments.filter(a => a.status === filterKey).length;
                                 return (
                                     <button
                                         key={filterKey}
                                         onClick={() => setAppointmentFilter(filterKey)}
                                         className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                             appointmentFilter === filterKey 
                                                 ? 'bg-gold-500 text-black font-bold shadow-sm' 
                                                 : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                                         }`}
                                     >
                                         <span>{filterKey}</span>
                                         <span className="opacity-70">({count})</span>
                                     </button>
                                 );
                             })}
                         </div>

                         <div className="relative w-full md:w-80">
                             <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                             <input
                                 type="text"
                                 value={appointmentSearch}
                                 onChange={(e) => setAppointmentSearch(e.target.value)}
                                 placeholder="Search client, email, dossier code..."
                                 className="w-full bg-black/60 border border-white/10 pl-9 pr-8 py-2 text-xs text-white placeholder-white/30 focus:border-gold-500 focus:outline-none rounded-sm"
                             />
                             {appointmentSearch && (
                                 <button 
                                     onClick={() => setAppointmentSearch('')}
                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                 >
                                     <X size={12} />
                                 </button>
                             )}
                         </div>
                     </div>

                     {/* Appointments List / Grid */}
                     {filteredAppointments.length > 0 ? (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                             {filteredAppointments.map((appt) => {
                                 const apptId = appt._id || appt.id || '';
                                 const dossierCode = appt.dossierCode || `CNCG-${apptId.slice(-6).toUpperCase()}`;
                                 const status = appt.status || 'PENDING';
                                 const formattedDate = appt.createdAt?.seconds 
                                     ? new Date(appt.createdAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                                     : (appt.createdAt ? new Date(appt.createdAt).toLocaleString() : 'Recent Booking');

                                 const cleanPhone = (appt.phone || appt.mobile || '').replace(/[^0-9]/g, '');
                                 const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(appt.fullName || '')},%20this%20is%20the%20DEUZ%20Private%20Concierge%20regarding%20your%20dossier%20${dossierCode}.` : null;
                                 const mailLink = appt.email ? `mailto:${appt.email}?subject=DEUZ%20Private%20Concierge%20%E2%80%94%20Dossier%20${dossierCode}&body=Dear%20${encodeURIComponent(appt.fullName || 'Client')},%0A%0AWe%20have%20received%20your%20consultation%20request%20for%20${encodeURIComponent(appt.consultationType || 'our private salon services')}.%0A%0AWith%20distinction,%0ADEUZ%20Private%20Concierge` : null;

                                 return (
                                     <div 
                                         key={apptId}
                                         className="bg-[#090909] border border-white/10 hover:border-gold-500/40 transition-all duration-300 rounded-sm p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between"
                                     >
                                         {/* Card Top: Dossier Code + Status Pill */}
                                         <div className="flex justify-between items-start gap-3 border-b border-white/5 pb-3">
                                             <div>
                                                 <div className="flex items-center gap-2">
                                                     <span className="font-mono text-xs font-bold text-gold-400 tracking-wider">
                                                         {dossierCode}
                                                     </span>
                                                     <span className="text-[10px] text-white/40 font-mono">
                                                         • {formattedDate}
                                                     </span>
                                                 </div>
                                                 <h4 className="text-base font-serif text-white mt-1">
                                                     {appt.fullName || appt.name || 'Confidential Client'}
                                                 </h4>
                                             </div>

                                             {/* Status Badge */}
                                             <span className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-widest border flex items-center gap-1.5 shrink-0 ${
                                                 status === 'CONFIRMED'
                                                     ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                                     : status === 'COMPLETED'
                                                     ? 'bg-sky-950/40 text-sky-400 border-sky-500/30'
                                                     : status === 'CANCELLED'
                                                     ? 'bg-red-950/40 text-red-400 border-red-500/30'
                                                     : 'bg-gold-950/40 text-gold-400 border-gold-500/30 animate-pulse'
                                             }`}>
                                                 {status === 'CONFIRMED' && <CheckCircle2 size={11} />}
                                                 {status === 'COMPLETED' && <Sparkles size={11} />}
                                                 {status === 'PENDING' && <Clock size={11} />}
                                                 {status === 'CANCELLED' && <X size={11} />}
                                                 <span>{status}</span>
                                             </span>
                                         </div>

                                         {/* Card Middle: Consultation Spec & Contact info */}
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                             <div className="space-y-1">
                                                 <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">
                                                     Service Requested
                                                 </span>
                                                 <p className="text-white/90 font-medium">
                                                     {appt.consultationType || appt.service || 'Private Salon Consultation'}
                                                 </p>
                                             </div>

                                             <div className="space-y-1">
                                                 <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">
                                                     Location / Atelier
                                                 </span>
                                                 <p className="text-gold-400/90 font-mono flex items-center gap-1">
                                                     <MapPin size={11} /> {appt.location || appt.city || 'Atelier Mumbai — BKC & Colaba'}
                                                 </p>
                                             </div>

                                             <div className="space-y-1">
                                                 <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">
                                                     Preferred Time
                                                 </span>
                                                 <p className="text-white/80 font-mono">
                                                     {appt.date || appt.preferredDate || 'Flexible / Priority Schedule'}
                                                 </p>
                                             </div>

                                             <div className="space-y-1">
                                                 <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">
                                                     Direct Channels
                                                 </span>
                                                 <div className="flex flex-wrap gap-2 pt-0.5">
                                                     {mailLink && (
                                                         <a
                                                             href={mailLink}
                                                             className="inline-flex items-center gap-1 text-[10px] font-mono text-white/70 hover:text-white bg-white/5 border border-white/10 px-2 py-1 rounded"
                                                             title="Email Client"
                                                         >
                                                             <Mail size={10} /> {appt.email}
                                                         </a>
                                                     )}
                                                     {appt.phone && (
                                                         <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/70 bg-white/5 border border-white/10 px-2 py-1 rounded">
                                                             <Phone size={10} /> {appt.phone}
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>

                                         {/* Notes quote block */}
                                         {appt.notes && (
                                             <div className="bg-black/60 border-l-2 border-gold-500 p-3 rounded-r text-xs text-white/70 font-light leading-relaxed">
                                                 <span className="text-[9px] uppercase tracking-widest font-mono text-white/40 block mb-1">
                                                     Client Notes & Inquiries:
                                                 </span>
                                                 "{appt.notes}"
                                             </div>
                                         )}

                                         {/* Card Bottom: Action Controls */}
                                         <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                                             <div className="flex flex-wrap items-center gap-2">
                                                 {status !== 'CONFIRMED' && (
                                                     <button
                                                         onClick={() => handleUpdateAppointmentStatus(apptId, 'CONFIRMED')}
                                                         disabled={actionLoading}
                                                         className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-emerald-400 text-[10px] font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
                                                     >
                                                         Confirm Booking
                                                     </button>
                                                 )}

                                                 {status === 'CONFIRMED' && (
                                                     <button
                                                         onClick={() => handleUpdateAppointmentStatus(apptId, 'COMPLETED')}
                                                         disabled={actionLoading}
                                                         className="px-3 py-1.5 bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500 hover:text-black text-sky-400 text-[10px] font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
                                                     >
                                                         Mark Completed
                                                     </button>
                                                 )}

                                                 {status !== 'CANCELLED' && (
                                                      <button
                                                         onClick={() => handleUpdateAppointmentStatus(apptId, 'CANCELLED')}
                                                         disabled={actionLoading}
                                                         className="px-2.5 py-1.5 text-white/40 hover:text-red-400 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                                                     >
                                                         Cancel
                                                     </button>
                                                 )}

                                                 {status === 'CANCELLED' && (
                                                     <button
                                                         onClick={() => handleUpdateAppointmentStatus(apptId, 'PENDING')}
                                                         disabled={actionLoading}
                                                         className="px-2.5 py-1.5 text-gold-400 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                                                     >
                                                         Restore to Pending
                                                     </button>
                                                 )}
                                             </div>

                                             <div className="flex items-center gap-2">
                                                 {waLink && (
                                                     <a
                                                         href={waLink}
                                                         target="_blank"
                                                         rel="noreferrer"
                                                         className="p-2 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded transition-colors"
                                                         title="Open WhatsApp Consultation"
                                                     >
                                                         <MessageCircle size={13} />
                                                     </a>
                                                 )}
                                                 {mailLink && (
                                                      <a
                                                         href={mailLink}
                                                         className="p-2 bg-white/5 text-white/70 hover:bg-white hover:text-black rounded transition-colors"
                                                         title="Email Client"
                                                     >
                                                         <Mail size={13} />
                                                     </a>
                                                 )}
                                                 <button
                                                     onClick={() => handleDeleteAppointment(apptId)}
                                                     disabled={actionLoading}
                                                     className="p-2 text-white/30 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                                     title="Purge Record from Firestore"
                                                 >
                                                     <Trash size={13} />
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     ) : (
                         <div className="py-20 text-center border border-white/10 bg-[#080808] rounded-sm">
                             <Calendar size={36} className="mx-auto text-white/20 mb-3" />
                             <p className="text-white/60 font-serif text-lg mb-1">No Concierge Dossiers Found</p>
                             <p className="text-white/30 font-mono text-xs max-w-sm mx-auto mb-4">
                               {appointmentSearch ? "No records match your search criteria." : "Client appointments and salon requests will appear here in real-time as they are submitted."}
                             </p>
                             {onViewConcierge && (
                                 <button
                                     onClick={onViewConcierge}
                                     className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/40 text-gold-400 hover:bg-gold-500 hover:text-black text-xs font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
                                 >
                                     <Compass size={13} /> Visit Concierge Booking Page
                                 </button>
                             )}
                         </div>
                     )}
                 </div>
             );
         })()}

         {activeTab === 'trash' && (
             <div className="space-y-6">
                 {/* Trashed Orders Table */}
                 <div className="bg-[#0A0A0A] border border-white/10 overflow-x-auto">
                     <table className="w-full text-left min-w-[800px]">
                         <thead className="bg-white/5 border-b border-white/10">
                             <tr>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Ref ID</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Client</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Total</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Status</th>
                                 <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {orders.filter(o => o.isTrashed).map((order) => (
                                 <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                                     <td className="p-4 text-xs font-mono text-gold-500">{order.conciergeCode || order._id.slice(-6)}</td>
                                     <td className="p-4">
                                         <p className="text-white text-xs font-bold">{order.shippingAddress?.fullName || 'Unknown'}</p>
                                         <p className="text-white/40 text-[10px]">{order.shippingAddress?.city}</p>
                                     </td>
                                     <td className="p-4 text-xs text-white">₹{order.totalAmount?.toLocaleString('en-IN') || 0}</td>
                                     <td className="p-4">
                                         <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border border-red-500/30 text-red-400 bg-red-900/10`}>
                                             TRASHED
                                         </span>
                                     </td>
                                     <td className="p-4 flex items-center gap-2">
                                         <button onClick={() => handleRestoreOrder(order._id)} className="p-2 hover:bg-green-500/10 rounded-sm text-green-500 transition-colors" title="Restore Order">
                                             <RefreshCw size={14} />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                             {orders.filter(o => o.isTrashed).length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="p-8 text-center text-white/40 text-xs">No orders in trash.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
         )}

         {activeTab === 'products' && (
             <div>
                 <div className="flex flex-col sm:flex-row justify-end mb-6 gap-4">
                     <button onClick={() => handleOpenProductModal()} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-gold-500 hover:text-white transition-colors">
                         <Plus size={14} /> Add Artifact
                     </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {products.map((product) => (
                         <div key={product._id} className={`bg-[#0A0A0A] border transition-all duration-300 group relative ${product.isArchived ? 'border-white/5 opacity-50' : product.countInStock === 0 ? 'border-red-500/20' : 'border-white/10'}`}>
                             {/* ... Product Item Content ... */}
                             <div className="h-48 overflow-hidden relative">
                                 <img src={product.image} alt={product.title} className={`w-full h-full object-cover transition-all duration-500 ${product.isArchived || product.countInStock === 0 ? 'grayscale opacity-40' : 'opacity-60 group-hover:opacity-100'}`} />
                                 {(settings?.siteContent?.latestDropProductId === product._id || settings?.siteContent?.latestDropProductId === product.id) && (
                                     <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gold-500 text-black text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                         <Crown size={10} /> Collection 1 Drop
                                     </div>
                                 )}
                                 <div className="absolute top-2 right-2 flex gap-2 z-10">
                                     <button 
                                         onClick={() => handleSetLatestDrop(product)} 
                                         title={(settings?.siteContent?.latestDropProductId === product._id || settings?.siteContent?.latestDropProductId === product.id) ? "Currently featured as Collection 1 Latest Drop on homepage" : "Set as Collection 1 Latest Drop on homepage"} 
                                         className={`p-2 backdrop-blur-sm transition-colors ${(settings?.siteContent?.latestDropProductId === product._id || settings?.siteContent?.latestDropProductId === product.id) ? 'bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-black/50 text-white hover:bg-gold-500 hover:text-black'}`}
                                     >
                                         <Crown size={12} />
                                     </button>
                                     <button onClick={() => handleOpenProductModal(product)} className="p-2 bg-black/50 text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"><Edit size={12} /></button>
                                     <button onClick={() => handleDeleteProduct(product._id)} className="p-2 bg-black/50 text-white hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"><Trash size={12} /></button>
                                 </div>
                                 <div className="absolute bottom-2 left-2 flex gap-2">
                                     {/* Stock Toggle 0/1 */}
                                     <button 
                                        onClick={() => handleQuickStockToggle(product)} 
                                        title={product.countInStock > 0 ? "Mark Sold Out (Stock 0)" : "Restock (Stock 1)"}
                                        className={`p-2 backdrop-blur-sm transition-colors ${product.countInStock > 0 ? 'bg-green-500 text-black hover:bg-red-500 hover:text-white' : 'bg-red-500/20 text-red-500 hover:bg-green-500 hover:text-black'}`}
                                     >
                                         <Power size={12} />
                                     </button>
                                     {/* Archive Toggle */}
                                     <button 
                                        onClick={() => handleArchiveToggle(product)} 
                                        title={product.isArchived ? "Unarchive (Make Visible)" : "Archive (Hide from Store)"}
                                        className={`p-2 backdrop-blur-sm transition-colors ${product.isArchived ? 'bg-white/20 text-white hover:bg-white hover:text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                     >
                                         <Archive size={12} />
                                     </button>
                                 </div>
                             </div>
                             <div className="p-4">
                                 <div className="flex justify-between items-start mb-2">
                                     <h3 className="text-white text-sm font-serif">{product.title}</h3>
                                     <span className="text-gold-500 text-xs">₹{product.price}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40">
                                     <span>{product.category}</span>
                                     <span className={product.isArchived ? 'text-white/20 italic' : product.countInStock === 0 ? 'text-red-500 font-bold' : ''}>
                                         {product.isArchived ? 'HIDDEN' : product.countInStock === 0 ? 'SOLD OUT' : `Stock: ${product.countInStock}`}
                                     </span>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
         
         {activeTab === 'archive' && (
             <div>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-6">
                     <div>
                         <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-[9px] uppercase tracking-widest font-mono mb-2">
                             <Sparkles size={11} className="text-gold-400 animate-pulse" />
                             <span>Archival Vitrine Protocol</span>
                         </div>
                         <h3 className="text-2xl font-serif text-white tracking-wide">The Vault & Museum Vitrines</h3>
                         <p className="text-white/50 text-xs font-mono mt-1">
                           Archived artifacts preserved with auto-animated image carousels. Synced with Firestore.
                         </p>
                     </div>
                     <div className="flex items-center gap-3">
                         {onViewArchive && (
                             <button 
                               onClick={onViewArchive} 
                               className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-gold-500/30 text-gold-400 hover:bg-gold-500 hover:text-black text-xs uppercase tracking-widest font-mono transition-all rounded-sm shadow-md cursor-pointer"
                             >
                                 <ExternalLink size={13} /> View Public Archive
                             </button>
                         )}
                         <div className="px-3 py-2 bg-black/60 border border-white/10 text-[10px] font-mono text-white/60 rounded-sm">
                           {products.filter(p => p.isArchived || p.countInStock === 0).length} Artifacts Sealed
                         </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {products.filter(p => p.isArchived || p.countInStock === 0).map((product) => (
                         <ArchivedProductReel 
                             key={product._id || product.id}
                             product={product}
                             onEdit={() => handleOpenProductModal(product)}
                             onDelete={() => handleDeleteProduct(product._id || product.id)}
                             onArchiveToggle={() => handleArchiveToggle(product)}
                         />
                     ))}
                     {products.filter(p => p.isArchived || p.countInStock === 0).length === 0 && (
                         <div className="col-span-full py-16 text-center border border-white/10 bg-[#080808] rounded-sm">
                             <Archive size={36} className="mx-auto text-white/20 mb-3" />
                             <p className="text-white/60 font-serif text-lg mb-1">No Artifacts in the Vault</p>
                             <p className="text-white/30 font-mono text-xs max-w-sm mx-auto">
                               To archive an artifact, navigate to Inventory and click the archive button on any product.
                             </p>
                         </div>
                     )}
                 </div>
             </div>
         )}
         
          {activeTab === 'users' && (() => {
             const filteredUsers = users.filter(u => {
               const matchesSearch = userSearchQuery === '' || 
                 (u.fullName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                 (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                 (u.role || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                 (u.houseCode || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                 (u.houseId || '').toLowerCase().includes(userSearchQuery.toLowerCase());
               
               const userStage = u.stage || 'initiative';
               const matchesStage = userStageFilter === 'all' || userStage === userStageFilter;

               return matchesSearch && matchesStage;
             });

             // Stage distribution stats
             const stageCounts: Record<string, number> = {};
             CUSTOMER_STAGES.forEach(s => { stageCounts[s.id] = 0; });
             users.forEach(u => {
               const st = u.stage || 'initiative';
               stageCounts[st] = (stageCounts[st] || 0) + 1;
             });

             const assignedCount = users.filter(u => Boolean(u.houseCode || u.houseId)).length;

             return (
               <div className="space-y-6">
                 {/* Top Controls: Registration & Search */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="relative flex-1 max-w-md">
                     <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                     <input
                       type="text"
                       value={userSearchQuery}
                       onChange={(e) => setUserSearchQuery(e.target.value)}
                       placeholder="Filter by name, email, house code (e.g. DEUZ-HC), or ID..."
                       className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/60 font-mono"
                     />
                   </div>

                   <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                     <div className="flex items-center gap-2 px-3.5 py-2 bg-[#0A0A0A] border border-gold-500/30 rounded text-xs font-mono text-gold-400">
                       <Sparkles size={13} className="text-gold-400" />
                       <span>House Codes:</span>
                       <span className="font-bold text-white">
                         {assignedCount} / {users.length} Assigned
                       </span>
                     </div>

                     <button 
                       onClick={() => setIsUserModalOpen(true)} 
                       className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-gold-500 hover:text-white transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                     >
                       <UserCheck size={14} /> Register Operative
                     </button>
                   </div>
                 </div>

                 {/* Customer Stage Telemetry Distribution Banner */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                   {CUSTOMER_STAGES.map(s => {
                     const count = stageCounts[s.id] || 0;
                     const isSelected = userStageFilter === s.id;
                     return (
                       <button
                         key={s.id}
                         type="button"
                         onClick={() => setUserStageFilter(isSelected ? 'all' : s.id)}
                         className={`p-3 rounded border text-left transition-all cursor-pointer ${
                           isSelected 
                             ? 'bg-gold-500/15 border-gold-400 text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                             : 'bg-[#0A0A0A] border-white/5 text-white/60 hover:border-white/20'
                         }`}
                       >
                         <div className="flex items-center justify-between">
                           <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">0{s.level}</span>
                           <span className="text-xs font-mono font-bold text-gold-400">{count}</span>
                         </div>
                         <p className="text-xs font-serif text-white font-semibold mt-1 truncate">{s.name}</p>
                         <p className="text-[9px] font-mono text-white/40 truncate">{s.callsign}</p>
                       </button>
                     );
                   })}
                 </div>

                 {/* Users Table */}
                 <div className="bg-[#0A0A0A] border border-white/10 overflow-x-auto rounded-sm">
                   <table className="w-full text-left min-w-[850px]">
                     <thead className="bg-white/5 border-b border-white/10">
                       <tr>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Client Dossier</th>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Contact Email</th>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Role</th>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-gold-400">House Code // ID</th>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Flight Stage</th>
                         <th className="p-4 text-[10px] uppercase tracking-widest text-white/50 text-right">Admin Stage Elevation</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                       {filteredUsers.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="p-8 text-center text-xs text-white/40 font-mono">
                             No matching clients or operatives found in archive.
                           </td>
                         </tr>
                       ) : (
                         filteredUsers.map(u => {
                           const currentStageId = (u.stage || 'initiative') as CustomerStage;
                           const currentStageIdx = CUSTOMER_STAGES.findIndex(s => s.id === currentStageId);
                           const currentStageMeta = CUSTOMER_STAGES[currentStageIdx >= 0 ? currentStageIdx : 0];
                           const isUpdating = updatingStageUserId === u.id;
                           const canElevate = currentStageIdx < CUSTOMER_STAGES.length - 1;
                           const nextStage = canElevate ? CUSTOMER_STAGES[currentStageIdx + 1] : null;

                           return (
                             <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                               {/* Client Dossier */}
                               <td className="p-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/30 to-black border border-gold-500/40 flex items-center justify-center text-gold-400 font-serif text-xs font-bold shrink-0">
                                     {u.fullName?.charAt(0).toUpperCase() || 'P'}
                                   </div>
                                   <div>
                                     <p className="text-sm text-white font-medium">{u.fullName}</p>
                                     <p className="text-[9px] font-mono text-white/30 truncate max-w-[140px]">{u.id}</p>
                                   </div>
                                 </div>
                               </td>

                               {/* Contact */}
                               <td className="p-4">
                                 <p className="text-xs text-white/80 font-mono">{u.email}</p>
                                 {u.mobile && (
                                   <p className="text-[10px] text-white/40 font-mono mt-0.5">{u.mobile}</p>
                                 )}
                               </td>

                               {/* Role */}
                               <td className="p-4">
                                 <span className={`inline-block px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest rounded border ${
                                   u.role === 'admin'
                                     ? 'bg-red-500/15 border-red-500/40 text-red-300 font-bold'
                                     : u.role === 'concierge'
                                     ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                                     : 'bg-white/5 border-white/10 text-white/60'
                                 }`}>
                                   {u.role}
                                 </span>
                               </td>

                               {/* House ID // Unique Code */}
                               <td className="p-4">
                                 {u.houseCode || u.houseId ? (
                                   <div className="flex items-center gap-2">
                                     <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                       <Sparkles size={11} className="text-amber-400 shrink-0" />
                                       {u.houseCode || u.houseId}
                                     </span>
                                     <button
                                       type="button"
                                       onClick={() => openHouseCodeModal(u)}
                                       className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer"
                                       title="Modify Unique House Code"
                                     >
                                       <Edit size={12} />
                                     </button>
                                   </div>
                                 ) : (
                                   <button
                                     type="button"
                                     onClick={() => openHouseCodeModal(u)}
                                     className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gold-500/10 hover:bg-gold-500/25 border border-dashed border-gold-500/40 hover:border-gold-400 text-gold-400 text-xs font-mono tracking-wider transition-all cursor-pointer"
                                   >
                                     <Plus size={12} />
                                     <span>Assign House ID</span>
                                   </button>
                                 )}
                               </td>

                               {/* Flight Stage Status Badge */}
                               <td className="p-4">
                                 <div className="flex items-center gap-2">
                                   <div className="p-1.5 rounded bg-gold-500/10 border border-gold-500/30 text-gold-400">
                                     <Plane size={13} className="rotate-45" />
                                   </div>
                                   <div>
                                     <div className="flex items-center gap-1.5">
                                       <span className="text-xs font-serif font-bold text-gold-400">
                                         {currentStageMeta.name}
                                       </span>
                                       <span className="text-[9px] font-mono text-white/40">
                                         (0{currentStageMeta.level})
                                       </span>
                                     </div>
                                     <p className="text-[9px] font-mono text-white/40">
                                       {currentStageMeta.machSpeed} • {currentStageMeta.altitude}
                                     </p>
                                   </div>
                                 </div>
                               </td>

                               {/* Admin Stage Upgrade Dropdown & Fast Elevate Button */}
                               <td className="p-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                   {/* Remove User Dossier */}
                                   <button
                                     type="button"
                                     onClick={() => handleDeleteUser(u)}
                                     title={`Remove user dossier: ${u.fullName || u.email}`}
                                     className="p-1.5 rounded bg-red-950/30 hover:bg-red-600/30 text-white/40 hover:text-red-400 border border-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer"
                                   >
                                     <Trash size={12} />
                                   </button>

                                   {/* Stage Select Dropdown */}
                                   <select
                                     value={currentStageId}
                                     disabled={isUpdating}
                                     onChange={(e) => handleUpdateUserStage(u.id, e.target.value as CustomerStage, u.fullName)}
                                     className="bg-black/80 border border-gold-500/40 text-gold-400 text-xs font-mono uppercase tracking-wider rounded px-2.5 py-1.5 outline-none focus:border-gold-400 cursor-pointer disabled:opacity-50"
                                   >
                                     {CUSTOMER_STAGES.map(s => (
                                       <option key={s.id} value={s.id} className="bg-[#0A0A0A] text-white">
                                         Stage 0{s.level}: {s.name} ({s.code})
                                       </option>
                                     ))}
                                   </select>

                                   {/* Fast Elevate Button */}
                                   {canElevate && nextStage && (
                                     <button
                                       type="button"
                                       disabled={isUpdating}
                                       onClick={() => handleUpdateUserStage(u.id, nextStage.id, u.fullName)}
                                       title={`Fast elevate to Stage 0${nextStage.level}: ${nextStage.name}`}
                                       className="flex items-center gap-1 px-2.5 py-1.5 bg-gold-500/20 hover:bg-gold-500/40 text-gold-300 border border-gold-500/40 rounded text-[10px] font-mono uppercase tracking-widest font-bold transition-colors cursor-pointer disabled:opacity-50"
                                     >
                                       {isUpdating ? (
                                         <span className="w-3 h-3 border border-gold-400 border-t-transparent rounded-full animate-spin" />
                                       ) : (
                                         <>
                                           <ChevronUp size={12} />
                                           <span>+1 {nextStage.name}</span>
                                         </>
                                       )}
                                     </button>
                                   )}
                                 </div>
                               </td>
                             </tr>
                           );
                         })
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             );
          })()}

         {/* --- AUDIT & LOG STREAM TAB --- */}
         {activeTab === 'audit' && (() => {
             const normalizedAuth = authLogs.map(item => ({
                 ...item,
                 _stream: 'auth',
                 _action: (item.event || item.action || 'AUTH_EVENT').toUpperCase(),
                 _user: item.email || item.userId || 'Guest',
                 _status: item.status || 'success',
                 _details: {
                     event: item.event,
                     provider: item.provider,
                     role: item.role,
                     status: item.status,
                     failureReason: item.failureReason,
                     ip: item.ip,
                     userAgent: item.userAgent
                 }
             }));

             const normalizedSys = systemLogs.map(item => ({
                 ...item,
                 _stream: 'system',
                 _action: (item.action || item.category || 'SYSTEM_LOG').toUpperCase(),
                 _user: item.userEmail || item.userId || 'System',
                 _status: item.level || 'info',
                 _details: {
                     message: item.message,
                     level: item.level,
                     category: item.category,
                     ip: item.ip,
                     userAgent: item.userAgent,
                     metadata: item.metadata
                 }
             }));

             const normalizedAudit = logs.map(item => ({
                 ...item,
                 _stream: 'audit',
                 _action: item.action || 'ADMIN_ACTION',
                 _user: item.performedBy?.fullName || item.performedBy?.email || 'Administrator',
                 _status: 'info',
                 _details: item.details
             }));

             let combinedList = [];
             if (logStreamFilter === 'all') {
                 combinedList = [...normalizedAuth, ...normalizedSys, ...normalizedAudit];
             } else if (logStreamFilter === 'auth') {
                 combinedList = normalizedAuth;
             } else if (logStreamFilter === 'system') {
                 combinedList = normalizedSys;
             } else {
                 combinedList = normalizedAudit;
             }

             combinedList.sort((a, b) => {
                 const tA = new Date(a.timestamp || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)).getTime();
                 const tB = new Date(b.timestamp || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)).getTime();
                 return tB - tA;
             });

             const filteredList = logSearchQuery.trim() === '' 
                 ? combinedList 
                 : combinedList.filter(item => {
                     const q = logSearchQuery.toLowerCase();
                     const strAction = (item._action || '').toLowerCase();
                     const strUser = (item._user || '').toLowerCase();
                     const strDetails = JSON.stringify(item._details || {}).toLowerCase();
                     const strIp = (item.ip || '').toLowerCase();
                     return strAction.includes(q) || strUser.includes(q) || strDetails.includes(q) || strIp.includes(q);
                 });

             return (
             <div className="space-y-6">
                 {/* Firebase Console Reference Guide Card */}
                 <div className="bg-[#0A0A0A] border border-white/10 p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                         <div>
                             <div className="flex items-center gap-2 text-gold-500 font-mono text-sm uppercase tracking-widest">
                                 <Database size={16} /> Firebase Console Collections & Sync Status
                             </div>
                             <p className="text-white/40 text-xs mt-1">
                                 All authentication records, login events, and operational logs are stored in Firebase Firestore and Authentication.
                             </p>
                         </div>
                         <a 
                             href="https://console.firebase.google.com" 
                             target="_blank" 
                             rel="noreferrer" 
                             className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:border-gold-500 text-xs text-white uppercase tracking-wider transition-colors shrink-0"
                         >
                             <ExternalLink size={12} className="text-gold-500" />
                             <span>Open Firebase Console</span>
                         </a>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="bg-black/60 border border-white/5 p-3 font-mono text-xs">
                             <span className="text-white/40 text-[10px] uppercase block tracking-widest">Collection</span>
                             <span className="text-purple-400 font-bold block mt-1">auth_logs</span>
                             <span className="text-white/40 text-[10px] mt-0.5 block">{authLogs.length} Authentication Records</span>
                         </div>
                         <div className="bg-black/60 border border-white/5 p-3 font-mono text-xs">
                             <span className="text-white/40 text-[10px] uppercase block tracking-widest">Collection</span>
                             <span className="text-blue-400 font-bold block mt-1">logs</span>
                             <span className="text-white/40 text-[10px] mt-0.5 block">{systemLogs.length} System Stream Events</span>
                         </div>
                         <div className="bg-black/60 border border-white/5 p-3 font-mono text-xs">
                             <span className="text-white/40 text-[10px] uppercase block tracking-widest">Collection</span>
                             <span className="text-gold-500 font-bold block mt-1">audit_logs</span>
                             <span className="text-white/40 text-[10px] mt-0.5 block">{logs.length} Executive Audits</span>
                         </div>
                         <div className="bg-black/60 border border-white/5 p-3 font-mono text-xs">
                             <span className="text-white/40 text-[10px] uppercase block tracking-widest">Collection</span>
                             <span className="text-green-400 font-bold block mt-1">users</span>
                             <span className="text-white/40 text-[10px] mt-0.5 block">{users.length} Registered Identities</span>
                         </div>
                     </div>
                 </div>

                 {/* Log Stream Viewer */}
                 <div className="bg-[#0A0A0A] border border-white/10 overflow-hidden p-6 font-mono">
                     <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                         {/* Stream Filter Pills */}
                         <div className="flex flex-wrap items-center gap-2">
                             <button 
                                 onClick={() => setLogStreamFilter('all')}
                                 className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                                     logStreamFilter === 'all' 
                                         ? 'border-gold-500 bg-gold-500/10 text-gold-500 font-bold' 
                                         : 'border-white/10 text-white/50 hover:text-white'
                                 }`}
                             >
                                 All Streams ({authLogs.length + systemLogs.length + logs.length})
                             </button>
                             <button 
                                 onClick={() => setLogStreamFilter('auth')}
                                 className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                                     logStreamFilter === 'auth' 
                                         ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold' 
                                         : 'border-white/10 text-white/50 hover:text-white'
                                 }`}
                             >
                                 Auth Logs ({authLogs.length})
                             </button>
                             <button 
                                 onClick={() => setLogStreamFilter('system')}
                                 className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                                     logStreamFilter === 'system' 
                                         ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold' 
                                         : 'border-white/10 text-white/50 hover:text-white'
                                 }`}
                             >
                                 System Logs ({systemLogs.length})
                             </button>
                             <button 
                                 onClick={() => setLogStreamFilter('audit')}
                                 className={`px-3 py-1 text-xs uppercase tracking-wider border transition-colors ${
                                     logStreamFilter === 'audit' 
                                         ? 'border-gold-500 bg-gold-500/10 text-gold-500 font-bold' 
                                         : 'border-white/10 text-white/50 hover:text-white'
                                 }`}
                             >
                                 Audit Trail ({logs.length})
                             </button>
                         </div>

                         {/* Search & Refresh */}
                         <div className="flex items-center gap-3 w-full md:w-auto">
                             <div className="relative flex-1 md:w-64">
                                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                 <input 
                                     type="text"
                                     placeholder="Filter events, emails, IPs..."
                                     value={logSearchQuery}
                                     onChange={(e) => setLogSearchQuery(e.target.value)}
                                     className="w-full bg-black/60 border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-gold-500 outline-none"
                                 />
                             </div>
                             <button 
                                 onClick={() => fetchData()}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-gold-500 text-xs text-white uppercase tracking-wider transition-colors shrink-0"
                             >
                                 <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                                 <span>Sync</span>
                             </button>
                         </div>
                     </div>

                     {/* Stream Rows */}
                     <div className="space-y-1">
                         {filteredList.length === 0 ? (
                             <div className="text-white/30 text-center py-12 flex flex-col items-center gap-2">
                                 <Activity className="animate-pulse text-gold-500/50" size={24} />
                                 <span className="text-xs uppercase tracking-widest">No matching logs found in Firestore</span>
                             </div>
                         ) : (
                             filteredList.map((log: any, idx: number) => {
                                 const isFailure = log._status === 'failed' || log._status === 'warn' || log._status === 'error';
                                 const isSuccess = log._status === 'success';

                                 return (
                                 <div 
                                     key={idx} 
                                     className="flex flex-col md:flex-row gap-2 md:gap-4 p-3 hover:bg-white/[0.03] transition-colors border-l-2 group text-xs"
                                     style={{
                                         borderLeftColor: log._stream === 'auth' ? '#a855f7' : log._stream === 'system' ? '#3b82f6' : '#d4af37'
                                     }}
                                 >
                                     {/* Timestamp */}
                                     <div className="flex items-center gap-2 w-full md:w-44 shrink-0 text-white/30">
                                         <Clock size={10} className="hidden md:block" />
                                         {(() => {
                                             if (!log.timestamp) return 'Just now';
                                             if (typeof (log.timestamp as any)?.toDate === 'function') {
                                                 return (log.timestamp as any).toDate().toLocaleString();
                                             }
                                             if ((log.timestamp as any)?.seconds) {
                                                 return new Date((log.timestamp as any).seconds * 1000).toLocaleString();
                                             }
                                             const d = new Date(log.timestamp);
                                             return isNaN(d.getTime()) ? String(log.timestamp) : d.toLocaleString();
                                         })()}
                                     </div>

                                     {/* Stream Tag */}
                                     <div className="w-full md:w-24 shrink-0">
                                         <span className={`text-[9px] uppercase px-1.5 py-0.5 border font-mono tracking-wider ${
                                             log._stream === 'auth' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' :
                                             log._stream === 'system' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
                                             'border-gold-500/40 text-gold-500 bg-gold-500/10'
                                         }`}>
                                             {log._stream.toUpperCase()}
                                         </span>
                                     </div>

                                     {/* Action / Event */}
                                     <div className="flex items-center gap-2 w-full md:w-48 shrink-0">
                                         <span className={`uppercase font-bold tracking-wider truncate ${
                                             isFailure ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-gold-500'
                                         }`}>
                                             {log._action}
                                         </span>
                                     </div>

                                     {/* Identity */}
                                     <div className="w-full md:w-48 shrink-0 flex items-center gap-2 text-white/70 truncate">
                                         <UserCheck size={11} className="text-white/40 shrink-0" />
                                         <span className="truncate">{log._user}</span>
                                     </div>

                                     {/* Details */}
                                     <div className="flex-1 min-w-0">
                                         {renderLogDetails(log._details)}
                                     </div>
                                 </div>
                             );
                             })
                         )}
                     </div>
                 </div>
             </div>
             );
         })()}

         {activeTab === 'settings' && settings && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="bg-[#0A0A0A] border border-white/10 p-8">
                     <h3 className="text-white font-serif mb-6 flex items-center gap-2"><Crown size={18} className="text-gold-500"/> Collection 1 — Latest Drop (Homepage)</h3>
                     <form onSubmit={handleSettingsUpdate} className="space-y-6">
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Featured Artifact on Homepage</label>
                             <select 
                                 value={settings.siteContent?.latestDropProductId || 'auto'} 
                                 onChange={e => {
                                     const val = e.target.value;
                                     const selected = products.find(p => p._id === val || p.id === val);
                                     setSettings({
                                         ...settings,
                                         siteContent: {
                                             ...settings.siteContent,
                                             latestDropProductId: val,
                                             ...(selected ? {
                                                 latestDropTitle: selected.title,
                                                 latestDropDescription: selected.description,
                                                 latestDropImage: selected.image,
                                                 latestDropCategory: selected.category,
                                                 latestDropPrice: `₹${selected.price?.toLocaleString('en-IN')}`,
                                                 latestDropStatus: selected.countInStock > 0 ? 'Active' : 'Exhausted',
                                                 sovereignCategory: selected.category,
                                                 sovereignPrice: `₹${selected.price?.toLocaleString('en-IN')}`,
                                                 sovereignStatus: selected.countInStock > 0 ? 'Active' : 'Exhausted'
                                             } : {})
                                         }
                                     });
                                 }}
                                 className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none font-mono"
                             >
                                 <option value="auto">Auto (Most Recent Drop Added to Store)</option>
                                 {products.filter(p => !p.isArchived).map(p => (
                                     <option key={p._id || p.id} value={p._id || p.id}>
                                         {p.title} — ₹{p.price?.toLocaleString('en-IN')} ({p.countInStock > 0 ? 'In Stock' : 'Sold Out'})
                                     </option>
                                 ))}
                             </select>
                             <p className="text-[10px] text-white/40 mt-1.5 font-mono">
                                 Select which single product is spotlighted in Collection 1 on the homepage.
                             </p>
                         </div>

                         {/* Live Preview Card */}
                         {(() => {
                             const activeDropId = settings.siteContent?.latestDropProductId;
                             const selectedDrop = products.find(p => p._id === activeDropId || p.id === activeDropId) || products[0];
                             const previewImg = settings.siteContent?.latestDropImage || selectedDrop?.image || settings.siteContent?.storeImage;
                             const previewTitle = settings.siteContent?.latestDropTitle || selectedDrop?.title || 'DEUZ FORM 01 — SOVEREIGN';
                             const previewPrice = settings.siteContent?.latestDropPrice || (selectedDrop ? `₹${selectedDrop.price?.toLocaleString('en-IN')}` : '₹12,000');
                             const previewCat = settings.siteContent?.latestDropCategory || selectedDrop?.category || 'APPAREL';
                             const previewStatus = settings.siteContent?.latestDropStatus || (selectedDrop?.countInStock > 0 ? 'Active' : 'Exhausted');

                             return (
                                 <div className="bg-black/40 border border-gold-500/20 p-4 rounded-sm flex gap-4 items-center">
                                     {previewImg && (
                                         <img src={previewImg} alt="Preview" className="w-16 h-20 object-cover border border-white/10 rounded-sm" />
                                     )}
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="text-[9px] uppercase tracking-widest text-gold-500 font-mono font-bold">
                                                 ACTIVE HOMEPAGE DROP
                                             </span>
                                             <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${previewStatus.toLowerCase() === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                 {previewStatus}
                                             </span>
                                         </div>
                                         <h4 className="text-white text-xs font-serif truncate">{previewTitle}</h4>
                                         <div className="text-[10px] text-white/50 font-mono mt-1 flex gap-3">
                                             <span>{previewCat}</span>
                                             <span className="text-gold-400">{previewPrice}</span>
                                         </div>
                                     </div>
                                 </div>
                             );
                         })()}

                         <div className="pt-4 border-t border-white/10 space-y-4">
                             <h4 className="text-gold-500 text-xs font-bold uppercase tracking-widest">Optional Custom Overrides</h4>
                             <div>
                                 <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Display Title</label>
                                 <input 
                                     value={settings.siteContent?.latestDropTitle || ''} 
                                     onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, latestDropTitle: e.target.value}})} 
                                     className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" 
                                     placeholder="Leave empty to use artifact title" 
                                 />
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                 <div>
                                     <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Category Display</label>
                                     <input 
                                         value={settings.siteContent?.latestDropCategory || settings.siteContent?.sovereignCategory || ''} 
                                         onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, latestDropCategory: e.target.value, sovereignCategory: e.target.value}})} 
                                         className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" 
                                         placeholder="Apparel" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Price Display</label>
                                     <input 
                                         value={settings.siteContent?.latestDropPrice || settings.siteContent?.sovereignPrice || ''} 
                                         onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, latestDropPrice: e.target.value, sovereignPrice: e.target.value}})} 
                                         className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" 
                                         placeholder="₹12,000" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Status Display</label>
                                     <input 
                                         value={settings.siteContent?.latestDropStatus || settings.siteContent?.sovereignStatus || ''} 
                                         onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, latestDropStatus: e.target.value, sovereignStatus: e.target.value}})} 
                                         className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" 
                                         placeholder="Active" 
                                     />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Description / Notes</label>
                                 <textarea 
                                     value={settings.siteContent?.latestDropDescription || ''} 
                                     onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, latestDropDescription: e.target.value}})} 
                                     className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-20" 
                                     placeholder="Leave empty to use artifact description" 
                                 />
                             </div>
                         </div>

                         <button disabled={actionLoading} className="w-full py-3 bg-white text-black uppercase tracking-widest text-xs font-bold hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50">
                             {actionLoading ? 'Saving...' : 'Update Homepage Collection 1 Drop'}
                         </button>
                     </form>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 p-8">
                     <h3 className="text-white font-serif mb-6 flex items-center gap-2"><Crown size={18} className="text-gold-500"/> Private Acquisition Details</h3>
                     <form onSubmit={handleSettingsUpdate} className="space-y-6">
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">WhatsApp Line</label>
                             <input value={settings.conciergeConfig.whatsappNumber || ''} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, whatsappNumber: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Instagram Handle</label>
                             <input value={settings.conciergeConfig.instagramHandle || ''} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, instagramHandle: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                             <input value={settings.conciergeConfig.emailAddress || ''} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, emailAddress: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <button disabled={actionLoading} className="w-full py-3 bg-white text-black uppercase tracking-widest text-xs font-bold hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50">
                             {actionLoading ? 'Saving...' : 'Update Protocol'}
                         </button>
                     </form>
                 </div>
             </div>
         )}
      </main>

      {/* Notification Toast */}
      <AnimatePresence>
          {notification && (
              <motion.div 
                  initial={{ opacity: 0, y: 20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 20, x: '-50%' }}
                  className={`fixed bottom-8 left-1/2 px-6 py-3 rounded-sm border flex items-center gap-3 z-50 ${notification.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-200' : 'bg-green-900/90 border-green-500/50 text-green-200'}`}
              >
                  {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  <span className="text-xs font-bold uppercase tracking-wide">{notification.message}</span>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Order Detail Modal with STRICT ACTIONS */}
      {isOrderModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-8 relative">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h2 className="text-xl font-serif text-white tracking-widest mb-1">DOSSIER {selectedOrder.conciergeCode || selectedOrder.code}</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 rounded-sm">
                                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">STATUS:</span>
                                  <select
                                      value={selectedOrder.orderStatus}
                                      onChange={(e) => handleStatusUpdate(selectedOrder._id || selectedOrder.id || selectedOrder.conciergeCode, e.target.value)}
                                      className="bg-black border border-gold-500/40 text-gold-400 text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded outline-none cursor-pointer hover:border-gold-500"
                                      title="Update order status and notify client in real-time"
                                  >
                                      {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                          <option key={key} value={key} className="bg-[#111] text-white">
                                              {label}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                                  Channel: <strong className="text-gold-400">
                                      {selectedOrder.contactMethod === 'instagram' ? 'Instagram Direct' : 
                                       selectedOrder.contactMethod === 'whatsapp' ? 'WhatsApp' : 
                                       selectedOrder.contactMethod === 'gmail' ? 'Gmail Concierge' : 
                                       'Private Concierge'}
                                  </strong>
                              </span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <button 
                              onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                      printWindow.document.write(`
                                          <html>
                                              <head>
                                                  <title>Invoice - ${selectedOrder.conciergeCode || selectedOrder.code}</title>
                                                  <style>
                                                      body { font-family: monospace; padding: 40px; color: #000; }
                                                      h1 { font-size: 24px; margin-bottom: 5px; }
                                                      .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                                                      .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                                                      .total { font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
                                                  </style>
                                              </head>
                                              <body>
                                                  <div class="header">
                                                      <h1>DEUZ & CO.</h1>
                                                      <p>INVOICE #${selectedOrder.conciergeCode || selectedOrder.code}</p>
                                                      <p>Date: ${new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                                  </div>
                                                  <div style="margin-bottom: 30px;">
                                                      <h3>Billed To:</h3>
                                                      <p>${selectedOrder.shippingAddress?.fullName}<br/>
                                                      ${selectedOrder.shippingAddress?.house}, ${selectedOrder.shippingAddress?.street}<br/>
                                                      ${selectedOrder.shippingAddress?.city}, ${selectedOrder.shippingAddress?.state} - ${selectedOrder.shippingAddress?.pincode}<br/>
                                                      ${selectedOrder.shippingAddress?.mobile}<br/>
                                                      ${selectedOrder.shippingAddress?.alternateMobile ? `${selectedOrder.shippingAddress?.alternateMobile}<br/>` : ''}
                                                      ${selectedOrder.shippingAddress?.email}</p>
                                                  </div>
                                                  <div style="margin-bottom: 30px;">
                                                      <h3>Items:</h3>
                                                      ${selectedOrder.items.map((item: any) => `
                                                          <div class="row">
                                                              <span>${item.title} x${item.quantity}</span>
                                                              <span>INR ${item.price}</span>
                                                          </div>
                                                      `).join('')}
                                                  </div>
                                                  <div class="row total">
                                                      <span>TOTAL</span>
                                                      <span>INR ${selectedOrder.totalAmount || selectedOrder.total}</span>
                                                  </div>
                                              </body>
                                          </html>
                                      `);
                                      printWindow.document.close();
                                      printWindow.print();
                                  }
                              }}
                              className="text-xs text-gold-500 hover:text-white uppercase tracking-widest flex items-center gap-2 border border-gold-500/30 px-3 py-1.5"
                          >
                              <FileText size={14} /> Print Invoice
                          </button>
                          <button onClick={() => setIsOrderModalOpen(false)} className="text-white/40 hover:text-white"><X size={24}/></button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Client Registry & Shipping Dossier</h3>
                          <div className="space-y-2 text-sm text-white/80 bg-black/40 p-4 border border-white/5 rounded-sm">
                              <p><span className="text-white/30">Client Name:</span> {selectedOrder.shippingAddress?.fullName}</p>
                              <p><span className="text-white/30">Mobile:</span> {selectedOrder.shippingAddress?.mobile}</p>
                              {selectedOrder.shippingAddress?.alternateMobile && (
                                  <p><span className="text-white/30">Alt Mobile:</span> {selectedOrder.shippingAddress?.alternateMobile}</p>
                              )}
                              <p><span className="text-white/30">Email:</span> {selectedOrder.shippingAddress?.email}</p>
                              
                              <div className="border-t border-white/10 pt-2 mt-2">
                                  <span className="text-white/30 block mb-1">Destination Address:</span>
                                  <p className="font-mono text-xs text-white/90 leading-relaxed">
                                      {selectedOrder.shippingAddress?.house}, {selectedOrder.shippingAddress?.street}<br/>
                                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                                  </p>
                              </div>

                              {/* Preferred Channel & Instant Direct Outreach */}
                              <div className="border-t border-white/10 pt-3 mt-3">
                                  <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 block mb-2">
                                      Preferred Contact Channel: <strong className="text-white uppercase font-bold">{selectedOrder.preferredChannel || selectedOrder.contactMethod || 'private desk'}</strong>
                                  </span>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                      {selectedOrder.shippingAddress?.mobile && (
                                          <a 
                                              href={`https://wa.me/${selectedOrder.shippingAddress.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Greetings from DEUZ & CO. Concierge Desk. Regarding your acquisition dossier ${selectedOrder.orderCode || selectedOrder.conciergeCode || selectedOrder.code}.`)}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded text-[10px] font-mono uppercase tracking-wider transition-colors"
                                          >
                                              <MessageCircle size={12} /> WhatsApp Client
                                          </a>
                                      )}
                                      {selectedOrder.shippingAddress?.email && (
                                          <a 
                                              href={`mailto:${selectedOrder.shippingAddress.email}?subject=${encodeURIComponent(`DEUZ & CO. Concierge Acquisition Dossier #${selectedOrder.orderCode || selectedOrder.conciergeCode || selectedOrder.code}`)}`}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/60 border border-sky-500/40 text-sky-400 hover:bg-sky-500 hover:text-black rounded text-[10px] font-mono uppercase tracking-wider transition-colors"
                                          >
                                              <Mail size={12} /> Send Gmail
                                          </a>
                                      )}
                                      <a 
                                          href="https://instagram.com/direct/inbox/"
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-950/60 border border-pink-500/40 text-pink-400 hover:bg-pink-500 hover:text-black rounded text-[10px] font-mono uppercase tracking-wider transition-colors"
                                      >
                                          <ExternalLink size={12} /> Instagram DM
                                      </a>
                                  </div>
                              </div>

                              {/* Client Notes if any */}
                              {(selectedOrder.customerNotes || selectedOrder.notes) && (
                                  <div className="border-t border-white/10 pt-2.5 mt-2.5 text-xs text-gold-300/90 italic font-serif">
                                      <span className="text-[9px] uppercase tracking-widest font-mono text-white/40 block not-italic">
                                          Client Acquisition Notes:
                                      </span>
                                      "{selectedOrder.customerNotes || selectedOrder.notes}"
                                  </div>
                              )}
                          </div>
                      </div>
                      <div>
                          <div className="bg-[#050505] border border-white/10 p-6 relative overflow-hidden shadow-2xl shadow-gold-500/5">
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/80 to-transparent opacity-70"></div>
                              
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-serif text-white tracking-[0.3em] uppercase text-sm">DEUZ & CO. INVOICE</h3>
                                 <Crown size={16} className="text-gold-500/50" />
                              </div>
                              
                              <div className="space-y-2 mb-6 border-t border-b border-white/10 py-4">
                                <div className="flex justify-between text-xs">
                                  <span className="text-white/40 uppercase tracking-widest">Unique Code</span>
                                  <span className="text-gold-400 font-mono font-bold tracking-wider">{selectedOrder.orderCode || selectedOrder.conciergeCode || selectedOrder.code}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-white/40 uppercase tracking-widest">Date Issued</span>
                                  <span className="text-white font-mono">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="space-y-3 mb-6">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                                    <div>
                                      <span className="text-white/90 font-medium">{item.title}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono mt-0.5">
                                          {item.selectedSize && <span>Size: [{item.selectedSize}]</span>}
                                          {item.houseCode && <span className="text-gold-400/80">House: [{item.houseCode}]</span>}
                                          <span>Qty: {item.quantity}</span>
                                      </div>
                                    </div>
                                    <span className="text-gold-400 font-mono">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-sm">
                                <span className="text-white/40 uppercase tracking-widest">Total Value</span>
                                <span className="text-gold-500 font-serif text-xl tracking-wider">₹{(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString('en-IN')}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* INTERNAL ADMIN NOTES */}
                  <div className="bg-white/5 p-6 border border-white/10 mb-8 relative group">
                      <div className="absolute top-0 right-0 bg-gold-500 text-black text-[9px] px-2 py-1 font-bold uppercase tracking-widest">
                          Admin Only
                      </div>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 flex items-center gap-2">
                              <Lock size={12} /> Internal Notes & Logistics
                          </h3>
                      </div>
                      <textarea 
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full bg-black border border-white/10 p-4 text-white text-sm outline-none focus:border-gold-500 min-h-[100px] mb-4 font-mono"
                          placeholder="Record operational details, concierge notes here. Visible only to staff."
                      />
                      <button 
                          onClick={handleNotesUpdate}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gold-500 transition-colors disabled:opacity-50"
                      >
                          {actionLoading ? 'Saving...' : 'Save Internal Notes'}
                      </button>
                  </div>

                  {/* TRACKING INFORMATION */}
                  <div className="bg-white/5 p-6 border border-white/10 mb-8 relative group">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                              <Truck size={12} /> Tracking Information
                          </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Carrier</label>
                              <input 
                                  value={trackingInfo.carrier}
                                  onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                                  className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                                  placeholder="e.g. DHL, FedEx"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Tracking Number</label>
                              <input 
                                  value={trackingInfo.trackingNumber}
                                  onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                                  className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                                  placeholder="Tracking #"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Tracking URL</label>
                              <input 
                                  value={trackingInfo.trackingUrl}
                                  onChange={(e) => setTrackingInfo({...trackingInfo, trackingUrl: e.target.value})}
                                  className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                                  placeholder="https://..."
                              />
                          </div>
                      </div>
                      <button 
                          onClick={handleTrackingUpdate}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gold-500 transition-colors disabled:opacity-50"
                      >
                          {actionLoading ? 'Saving...' : 'Update Tracking'}
                      </button>
                  </div>

                  {/* Lifecycle Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-white/10 pt-6">
                      <button 
                          onClick={() => {
                              const doc = new jsPDF();
                              doc.setFontSize(20);
                              doc.text('DEUZ & CO - Invoice', 14, 22);
                              doc.setFontSize(10);
                              doc.text(`Order ID: ${selectedOrder._id}`, 14, 30);
                              doc.text(`Date: ${new Date(selectedOrder.createdAt).toLocaleDateString()}`, 14, 36);
                              doc.text(`Client: ${selectedOrder.userEmail || 'Guest'}`, 14, 42);
                              
                              doc.setFontSize(14);
                              doc.text('Items', 14, 55);
                              
                              const itemData = selectedOrder.items.map((item: any) => [
                                  item.title,
                                  item.size || 'N/A',
                                  item.houseCode || 'N/A',
                                  item.quantity.toString(),
                                  `$${item.price}`
                              ]);
                              
                              autoTable(doc, {
                                  startY: 60,
                                  head: [['Item', 'Size', 'House Code', 'Qty', 'Price']],
                                  body: itemData,
                                  theme: 'grid',
                                  styles: { fontSize: 10 },
                                  headStyles: { fillColor: [20, 20, 20] }
                              });
                              
                              const finalY = (doc as any).lastAutoTable.finalY || 60;
                              doc.setFontSize(12);
                              doc.text(`Total: $${selectedOrder.totalAmount}`, 14, finalY + 10);
                              
                              doc.save(`invoice-${selectedOrder._id}.pdf`);
                          }}
                          className="w-full sm:w-auto px-6 py-3 border border-gold-500/30 text-gold-500 hover:bg-gold-500 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                          Download Invoice
                      </button>

                      {!['CANCELLED', 'DELIVERED', 'EXPERIENCE_UNLOCKED'].includes(selectedOrder.orderStatus) && (
                          <button 
                              onClick={handleCancelOrder}
                              className="w-full sm:w-auto px-6 py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest"
                          >
                              Cancel Order
                          </button>
                      )}

                      <div className="w-full sm:w-auto flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Update Status</label>
                          <div className="flex flex-col gap-2">
                              <select
                                  value={selectedOrder.orderStatus}
                                  onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                                  className="bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none cursor-pointer"
                              >
                                  {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                      <option key={key} value={key}>{label}</option>
                                  ))}
                              </select>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                  <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(selectedOrder._id, 'PAYMENT_AUTHORIZED')}
                                      className="px-2 py-1 bg-green-500/10 hover:bg-green-500 hover:text-black text-green-400 border border-green-500/30 text-[9px] font-mono uppercase tracking-wider rounded transition-colors"
                                  >
                                      ✓ Paid
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(selectedOrder._id, 'IN_PRODUCTION')}
                                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30 text-[9px] font-mono uppercase tracking-wider rounded transition-colors"
                                  >
                                      ⚡ In Production
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(selectedOrder._id, 'QUALITY_ASSURED')}
                                      className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500 hover:text-black text-purple-400 border border-purple-500/30 text-[9px] font-mono uppercase tracking-wider rounded transition-colors"
                                  >
                                      ★ QA Passed
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(selectedOrder._id, 'DISPATCHED')}
                                      className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500 hover:text-black text-sky-400 border border-sky-500/30 text-[9px] font-mono uppercase tracking-wider rounded transition-colors"
                                  >
                                      ✈ Dispatched
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(selectedOrder._id, 'DELIVERED')}
                                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30 text-[9px] font-mono uppercase tracking-wider rounded transition-colors"
                                  >
                                      ✔ Delivered
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-4 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-serif text-white">Record Payment</h2>
                      <button onClick={() => setIsPaymentModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
                  </div>
                  <form onSubmit={submitManualPayment} className="space-y-4">
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Amount Received (INR)</label>
                          <input type="number" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Payment Method</label>
                          <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none">
                              <option value="Payment Link">Payment Link</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Cash">Cash</option>
                              <option value="Crypto">Crypto</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Reference ID (Optional)</label>
                          <input value={paymentForm.referenceId} onChange={e => setPaymentForm({...paymentForm, referenceId: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="Transaction ID" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Note (Optional)</label>
                          <textarea value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-20" />
                      </div>
                      <button disabled={actionLoading} className="w-full py-4 bg-gold-500 text-black uppercase tracking-widest text-xs font-bold hover:bg-white transition-colors disabled:opacity-50">
                          {actionLoading ? 'Recording...' : 'Confirm Payment'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Kept intact for brevity, functionality remains from previous version */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-8">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-serif text-white">{isEditing ? 'Edit Artifact' : 'New Artifact'}</h2>
                  <button onClick={() => setIsModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
              </div>
              <form onSubmit={handleProductSubmit} className="space-y-6">
                  {/* Form fields identical to before */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Title</label>
                          <input required value={currentProduct.title} onChange={e => setCurrentProduct({...currentProduct, title: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Price (INR)</label>
                          <input type="number" required value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Description</label>
                      <textarea required value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-24" />
                  </div>
                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Details (JSON Object)</label>
                      <textarea 
                        value={JSON.stringify(currentProduct.details || {}, null, 2)} 
                        onChange={e => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                setCurrentProduct({...currentProduct, details: parsed});
                            } catch (err) {
                                // Ignore parse errors while typing
                            }
                        }} 
                        className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-32 font-mono" 
                        placeholder='{&#10;  "Material": "100% Cotton",&#10;  "Origin": "Italy"&#10;}'
                      />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Category</label>
                          <input required value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">House Code</label>
                          <input value={currentProduct.houseCode || ''} onChange={e => setCurrentProduct({...currentProduct, houseCode: e.target.value})} placeholder="e.g. ARC-001" className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Image Tag</label>
                          <input value={currentProduct.imageTag || ''} onChange={e => setCurrentProduct({...currentProduct, imageTag: e.target.value})} placeholder="e.g. NEW ARRIVAL" className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Fit</label>
                          <select 
                            value={currentProduct.fit || 'regular'} 
                            onChange={e => setCurrentProduct({...currentProduct, fit: e.target.value as 'oversized' | 'regular'})} 
                            className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                          >
                              <option value="regular">Regular Fit</option>
                              <option value="oversized">Oversized Fit</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Sizes & Stock</label>
                      <div className="space-y-2">
                          {currentProduct.sizes?.map((size, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <div className="w-1/3 bg-white/5 border border-white/10 p-2 text-white text-sm text-center font-mono">
                                      {size}
                                  </div>
                                  <input 
                                      type="number"
                                      value={currentProduct.sizeStock?.[size] ?? ''}
                                      onChange={e => {
                                          const val = e.target.value;
                                          const newStock = {...(currentProduct.sizeStock || {})};
                                          
                                          if (val === '') {
                                              delete newStock[size];
                                          } else {
                                              newStock[size] = parseInt(val) || 0;
                                          }
                                          
                                          const totalStock = Object.values(newStock).reduce((a, b) => a + b, 0);
                                          
                                          const outOfStock = Object.entries(newStock)
                                              .filter(([_, stock]) => stock <= 0)
                                              .map(([s, _]) => s);

                                          setCurrentProduct({
                                              ...currentProduct, 
                                              sizeStock: newStock,
                                              countInStock: totalStock,
                                              outOfStockSizes: outOfStock
                                          });
                                      }}
                                      className="w-2/3 bg-black border border-white/10 p-2 text-white text-sm focus:border-gold-500 outline-none"
                                      placeholder="Stock Amount"
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Status</label>
                          <select 
                            value={currentProduct.countInStock > 0 ? 'active' : 'exhausted'} 
                            onChange={e => {
                                const val = e.target.value;
                                if (val === 'active') {
                                    setCurrentProduct({...currentProduct, isArchived: false, countInStock: Math.max(1, currentProduct.countInStock)});
                                } else {
                                    setCurrentProduct({...currentProduct, isArchived: false, countInStock: 0});
                                }
                            }} 
                            className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                          >
                              <option value="active">Active (In Stock)</option>
                              <option value="exhausted">Exhausted (Out of Stock)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Stock Count</label>
                          <input 
                            type="number" 
                            required 
                            value={currentProduct.countInStock} 
                            onChange={e => setCurrentProduct({...currentProduct, countInStock: Number(e.target.value)})} 
                            className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none disabled:opacity-50" 
                            disabled={currentProduct.sizes && currentProduct.sizes.length > 0}
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Image URL</label>
                      <input required value={currentProduct.image} onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                  </div>

                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Gallery Images (Optional)</label>
                      {currentProduct.gallery?.map((img, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                              <input value={img} onChange={e => {
                                  const newGallery = [...(currentProduct.gallery || [])];
                                  newGallery[idx] = e.target.value;
                                  setCurrentProduct({...currentProduct, gallery: newGallery});
                              }} placeholder="Additional Image URL" className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                              <button type="button" onClick={() => {
                                  const newGallery = currentProduct.gallery?.filter((_, i) => i !== idx);
                                  setCurrentProduct({...currentProduct, gallery: newGallery});
                              }} className="px-4 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">X</button>
                          </div>
                      ))}
                      <button type="button" onClick={() => setCurrentProduct({...currentProduct, gallery: [...(currentProduct.gallery || []), '']})} className="text-[10px] uppercase tracking-widest text-gold-500 hover:text-white transition-colors mt-1">+ Add Gallery Image</button>
                  </div>

                  <button disabled={actionLoading} className="w-full py-4 bg-white text-black uppercase tracking-widest text-xs font-bold hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50">
                      {actionLoading ? 'Processing...' : 'Save Artifact'}
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* User Registration Modal */}
      {isUserModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-4 md:p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif text-white">New Operative</h2>
                    <button onClick={() => setIsUserModalOpen(false)}><X className="text-white/50 hover:text-white" /></button>
                 </div>
                 <form onSubmit={handleCreateUser} className="space-y-4">
                     <input required placeholder="Full Name" value={newUserForm.fullName} onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                     <input required type="email" placeholder="Email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                     <input required type="password" placeholder="Password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                     <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none">
                         <option value="user">Client (User)</option>
                         <option value="concierge">Concierge</option>
                         <option value="admin">System Admin</option>
                     </select>
                     <button disabled={actionLoading} className="w-full py-4 bg-white text-black uppercase tracking-widest text-xs font-bold hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50">
                         {actionLoading ? 'Registering...' : 'Grant Access'}
                     </button>
                 </form>
             </div>
          </div>
      )}

      {/* Unique House Code Assignment Modal */}
      {houseCodeModal.isOpen && houseCodeModal.user && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
             <div className="bg-[#0A0A0A] border border-gold-500/40 w-full max-w-lg p-6 md:p-8 rounded-sm shadow-[0_20px_70px_rgba(0,0,0,0.95)] relative">
                 <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div>
                       <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400">
                         ATELIER ARCHIVE MANAGEMENT
                       </span>
                       <h2 className="text-xl font-serif text-white mt-1">
                         Assign Unique House ID
                       </h2>
                       <p className="text-xs text-white/50 font-mono mt-0.5">
                         Client: <span className="text-white font-semibold">{houseCodeModal.user.fullName}</span> ({houseCodeModal.user.email})
                       </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setHouseCodeModal({ isOpen: false, user: null, code: '', error: null, isSaving: false })}
                      className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                 </div>

                 <form onSubmit={handleSaveHouseCode} className="space-y-5">
                     <div>
                       <div className="flex items-center justify-between mb-1.5">
                         <label className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                           Unique House ID // Code
                         </label>
                         <button
                           type="button"
                           onClick={() => {
                             const generated = generateUniqueHouseCode();
                             setHouseCodeModal(prev => ({ ...prev, code: generated, error: null }));
                           }}
                           className="text-[10px] font-mono text-gold-400 hover:text-gold-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                         >
                           <Sparkles size={11} /> Auto-Generate Unique Code
                         </button>
                       </div>

                       <div className="relative">
                         <input
                           type="text"
                           required
                           value={houseCodeModal.code}
                           onChange={(e) => {
                             const val = e.target.value.toUpperCase();
                             setHouseCodeModal(prev => ({ ...prev, code: val, error: null }));
                           }}
                           placeholder="e.g. DEUZ-HC-4091 or HOUSE-ALTO"
                           className="w-full bg-black border border-gold-500/40 p-3 text-gold-300 font-mono text-sm tracking-wider uppercase focus:border-gold-400 outline-none rounded-sm"
                         />
                       </div>

                       <p className="text-[10px] font-mono text-white/40 mt-1.5">
                         When saved, this House ID will immediately sync and appear live on the client's profile.
                       </p>
                     </div>

                     {houseCodeModal.error && (
                       <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-red-300 text-xs font-mono flex items-center gap-2">
                         <AlertTriangle size={14} className="shrink-0 text-red-400" />
                         <span>{houseCodeModal.error}</span>
                       </div>
                     )}

                     <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                       {(houseCodeModal.user.houseCode || houseCodeModal.user.houseId) ? (
                         <button
                           type="button"
                           disabled={houseCodeModal.isSaving}
                           onClick={handleClearHouseCode}
                           className="w-full sm:w-auto px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-mono uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                         >
                           Clear Code
                         </button>
                       ) : <div />}

                       <div className="flex items-center gap-3 w-full sm:w-auto">
                         <button
                           type="button"
                           onClick={() => setHouseCodeModal({ isOpen: false, user: null, code: '', error: null, isSaving: false })}
                           className="flex-1 sm:flex-initial px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
                         >
                           Cancel
                         </button>
                         <button
                           type="submit"
                           disabled={houseCodeModal.isSaving}
                           className="flex-1 sm:flex-initial px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-black text-xs font-mono uppercase tracking-widest font-bold rounded transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
                         >
                           {houseCodeModal.isSaving ? (
                             <>
                               <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                               <span>Saving & Syncing...</span>
                             </>
                           ) : (
                             <>
                               <CheckCircle2 size={13} />
                               <span>Save & Sync House ID</span>
                             </>
                           )}
                         </button>
                       </div>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md p-6 md:p-8 relative">
                  <h2 className="text-xl font-serif text-white mb-4">{confirmModal.title}</h2>
                  <p className="text-white/60 text-sm mb-8">{confirmModal.message}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                          className="flex-1 py-3 border border-white/10 text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmModal.onConfirm}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-gold-500 text-black hover:bg-white transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                          {actionLoading ? 'Processing...' : 'Confirm'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;