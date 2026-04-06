import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Package, Users, ShoppingBag, Edit, Trash, Plus, X, 
  Save, AlertTriangle, Search, TrendingUp, LogOut, ServerOff,
  Crown, Link as LinkIcon, CheckCircle2, Copy, UserCheck, DollarSign,
  MessageCircle, Mail, Instagram, Filter, Settings, Clock, FileText, Smartphone,
  CreditCard, ExternalLink, PenTool, Layout, Lock, Power, RefreshCw, Archive, Truck, Box, EyeOff, Check, Activity, Terminal, Database, Menu
} from 'lucide-react';
import { User, OrderStatus, ORDER_STATUS_LABELS } from '../types';

interface ProductForm {
  _id?: string;
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
  details: Record<string, string>;
  uniquenessTag?: string;
  imageTag?: string;
  houseCode?: string;
}

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
  sizes: [],
  details: {},
  uniquenessTag: '',
  imageTag: '',
  houseCode: ''
};

interface AdminDashboardProps {
    onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users' | 'dashboard' | 'concierge' | 'settings' | 'audit' | 'trash' | 'archive'>('dashboard');
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'confirmed' | 'shipped' | 'cancelled'>('all');
  
  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
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
  const [newUserForm, setNewUserForm] = useState({ fullName: '', email: '', password: '', role: 'concierge', mobile: '' });

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
      const settPromise = isAdmin ? db.getSystemSettings() : Promise.resolve(null);
      const logPromise = isAdmin ? db.getAuditLogs() : Promise.resolve([]);

      const [ordData, prodData, userData, settingsData, logData] = await Promise.allSettled([
        ordPromise,
        prodPromise,
        userPromise,
        settPromise,
        logPromise
      ]);

      if (ordData.status === 'rejected') {
          if (process.env.NODE_ENV !== 'production') {
              setIsOfflineMode(true);
          }
      } else {
          const safeOrders = ordData.status === 'fulfilled' && Array.isArray(ordData.value) ? ordData.value : [];
          const safeProducts = prodData.status === 'fulfilled' && Array.isArray(prodData.value) ? prodData.value : [];
          const safeUsers = userData.status === 'fulfilled' && Array.isArray(userData.value) ? userData.value : [];
          const safeSettings = settingsData.status === 'fulfilled' ? settingsData.value : null;
          const safeLogs = logData.status === 'fulfilled' && Array.isArray(logData.value) ? logData.value : [];

          setOrders(safeOrders);
          setProducts(safeProducts);
          setUsers(safeUsers);
          setLogs(safeLogs);
          if (safeSettings) setSettings(safeSettings);
          
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- ACTIONS ---

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          await db.createUser(newUserForm);
          await fetchData();
          showNotification(`Operative ${newUserForm.fullName} Registered`);
          setIsUserModalOpen(false);
          setNewUserForm({ fullName: '', email: '', password: '', role: 'concierge', mobile: '' });
      } catch (e: any) {
          showNotification(e.message || "Failed to create user", 'error');
      }
      setActionLoading(false);
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      try {
          await db.updateSystemSettings({ 
              conciergeConfig: settings.conciergeConfig,
              siteContent: settings.siteContent
          });
          showNotification("System Configuration Updated");
      } catch (e) {
          showNotification("Failed to update settings", 'error');
      }
      setActionLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
        await db.updateOrderStatus(id, status);
        const updatedOrders = orders.map(o => o._id === id ? { ...o, orderStatus: status } : o);
        setOrders(updatedOrders);
        if (selectedOrder && selectedOrder._id === id) {
            setSelectedOrder({ ...selectedOrder, orderStatus: status });
        }
        showNotification(`Order status updated to ${status}`);
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
        `$${o.totalAmount}`,
        o.orderStatus,
        o.paymentStatus
      ]);
      
      autoTable(doc, {
        startY: 50,
        head: [['Code', 'Client', 'Amount', 'Status', 'Payment']],
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
        `$${p.price}`,
        p.countInStock.toString(),
        p.isArchived ? 'Yes' : 'No'
      ]);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Product', 'Category', 'Price', 'Stock', 'Archived']],
        body: productData,
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
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        details: product.details && typeof product.details === 'object' ? product.details : {},
        uniquenessTag: product.uniquenessTag || '',
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
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-300 group ${activeTab === item.id ? 'bg-gold-500/10 text-gold-500' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                    <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs uppercase tracking-widest font-bold">{item.label}</span>
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
            <div className="flex items-center gap-4 md:gap-6">
                <button 
                  onClick={generatePDFReport}
                  className="hidden sm:flex items-center gap-2 text-gold-500 hover:text-white transition-colors"
                  title="Download Full System Report (PDF)"
                >
                  <FileText size={18} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Export Report</span>
                </button>
                {isOfflineMode && (
                    <div className="hidden sm:flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        <ServerOff size={14} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Offline Mode</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                    <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/40">System {isOfflineMode ? 'Severed' : 'Online'}</span>
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
                                         <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border ${
                                             order.orderStatus === 'ORDER_SECURED' ? 'border-orange-500/30 text-orange-400 bg-orange-900/10' :
                                             order.orderStatus === 'PAYMENT_AUTHORIZED' ? 'border-green-500/30 text-green-400 bg-green-900/10' :
                                             order.orderStatus === 'CANCELLED' ? 'border-red-500/30 text-red-400 bg-red-900/10' :
                                             'border-white/20 text-white/60'
                                         }`}>
                                             {ORDER_STATUS_LABELS[order.orderStatus as keyof typeof ORDER_STATUS_LABELS] || order.orderStatus}
                                         </span>
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
                                 <div className="absolute top-2 right-2 flex gap-2">
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
                 <div className="mb-6">
                     <h3 className="text-xl font-serif text-white mb-2">The Vault</h3>
                     <p className="text-white/40 text-xs font-mono">Manage sealed and archived artifacts.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {products.filter(p => p.isArchived || p.countInStock === 0).map((product) => (
                         <div key={product._id} className="bg-[#0A0A0A] border border-gold-500/20 transition-all duration-300 group relative">
                             <div className="h-48 overflow-hidden relative">
                                 <img src={product.image} alt={product.title} className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500" />
                                 <div className="absolute top-2 right-2 flex gap-2">
                                     <button onClick={() => handleOpenProductModal(product)} className="p-2 bg-black/50 text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"><Edit size={12} /></button>
                                 </div>
                                 <div className="absolute bottom-2 left-2 flex gap-2">
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
                                     <span>{product.category} {product.houseCode ? `// ${product.houseCode}` : ''}</span>
                                     <span className="text-white/20 italic">
                                         {product.isArchived ? 'ARCHIVED' : 'SOLD OUT'}
                                     </span>
                                 </div>
                             </div>
                         </div>
                     ))}
                     {products.filter(p => p.isArchived || p.countInStock === 0).length === 0 && (
                         <div className="col-span-full py-12 text-center border border-white/5 bg-white/5">
                             <p className="text-white/40 font-mono text-sm">No artifacts in the vault.</p>
                         </div>
                     )}
                 </div>
             </div>
         )}
         
         {activeTab === 'users' && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-gold-500 hover:text-white transition-colors">
                        <UserCheck size={14} /> Register Operative
                    </button>
                </div>
                <div className="bg-[#0A0A0A] border border-white/10 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Name</th>
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Email</th>
                                <th className="p-4 text-[10px] uppercase tracking-widest text-white/50">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-white/[0.02]">
                                    <td className="p-4 text-sm text-white">{u.fullName}</td>
                                    <td className="p-4 text-xs text-white/60">{u.email}</td>
                                    <td className="p-4 text-xs uppercase tracking-widest text-gold-500">{u.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         )}

         {/* --- AUDIT LOG TAB --- */}
         {activeTab === 'audit' && (
             <div className="space-y-6">
                 <div className="bg-[#0A0A0A] border border-white/10 overflow-hidden p-6 font-mono">
                     <div className="mb-6 flex items-center gap-2 text-gold-500 uppercase tracking-widest border-b border-white/10 pb-4">
                         <Terminal size={16} /> System Event Stream
                         {logs.length > 0 && <span className="text-[10px] text-white/30 ml-auto">{logs.length} Events</span>}
                     </div>
                     <div className="space-y-0.5">
                         {logs.length === 0 ? (
                             <div className="text-white/30 text-center py-10 flex flex-col items-center gap-2">
                                 <Activity className="animate-pulse" />
                                 <span className="text-xs uppercase tracking-widest">No activity recorded</span>
                             </div>
                         ) : (
                             logs.map((log, idx) => (
                                 <div key={idx} className="flex flex-col md:flex-row gap-2 md:gap-4 p-3 hover:bg-white/[0.03] transition-colors border-l-2 border-transparent hover:border-gold-500/50 group text-xs">
                                     <div className="flex items-center gap-3 w-full md:w-48 shrink-0 text-white/30">
                                         <Clock size={10} className="hidden md:block" />
                                         {new Date(log.timestamp).toLocaleString()}
                                     </div>
                                     <div className="flex items-center gap-2 w-full md:w-48 shrink-0">
                                         <span className={`uppercase font-bold tracking-wider ${
                                             (typeof log.action === 'string' && (log.action.includes('DELETE') || log.action.includes('CANCEL'))) ? 'text-red-500' :
                                             (typeof log.action === 'string' && (log.action.includes('CREATE') || log.action.includes('SUCCESS'))) ? 'text-green-500' :
                                             'text-gold-500'
                                         }`}>
                                             {log.action || 'UNKNOWN ACTION'}
                                         </span>
                                     </div>
                                     <div className="w-full md:w-48 shrink-0 flex items-center gap-2 text-white/60">
                                         <UserCheck size={10} />
                                         {log.performedBy?.fullName || 'System'}
                                     </div>
                                     <div className="w-full md:w-40 shrink-0 text-white/40 truncate">
                                         {log.targetResource} <span className="opacity-50">{log.targetId ? `ID:${log.targetId.slice(-4)}` : ''}</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         {renderLogDetails(log.details)}
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>
             </div>
         )}

         {activeTab === 'settings' && settings && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="bg-[#0A0A0A] border border-white/10 p-8">
                     <h3 className="text-white font-serif mb-6 flex items-center gap-2"><Crown size={18} className="text-gold-500"/> Site Content</h3>
                     <form onSubmit={handleSettingsUpdate} className="space-y-6">
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Hero Title</label>
                             <input value={settings.siteContent.heroTitle} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, heroTitle: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Hero Subtitle</label>
                             <textarea value={settings.siteContent.heroSubtitle} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, heroSubtitle: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-24" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">CTA Text</label>
                             <input value={settings.siteContent.ctaText} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, ctaText: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Checkout Disclaimer</label>
                             <textarea value={settings.siteContent.checkoutDisclaimer} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, checkoutDisclaimer: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-24" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Footer Text</label>
                             <input value={settings.siteContent.footerText} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, footerText: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Go To Store Image URL</label>
                             <input value={settings.siteContent.storeImage || ''} onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, storeImage: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Scroll Images (One URL per line)</label>
                             <textarea 
                                value={(settings.siteContent.scrollImages || []).join('\n')} 
                                onChange={e => setSettings({...settings, siteContent: {...settings.siteContent, scrollImages: e.target.value.split('\n').filter(url => url.trim() !== '')}})} 
                                className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-32" 
                                placeholder="https://image1.jpg&#10;https://image2.jpg"
                             />
                         </div>
                         <button disabled={actionLoading} className="w-full py-3 bg-white text-black uppercase tracking-widest text-xs font-bold hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50">
                             {actionLoading ? 'Saving...' : 'Update Content'}
                         </button>
                     </form>
                 </div>

                 <div className="bg-[#0A0A0A] border border-white/10 p-8">
                     <h3 className="text-white font-serif mb-6 flex items-center gap-2"><Crown size={18} className="text-gold-500"/> Concierge Configuration</h3>
                     <form onSubmit={handleSettingsUpdate} className="space-y-6">
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">WhatsApp Line</label>
                             <input value={settings.conciergeConfig.whatsappNumber} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, whatsappNumber: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Instagram Handle</label>
                             <input value={settings.conciergeConfig.instagramHandle} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, instagramHandle: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                             <input value={settings.conciergeConfig.emailAddress} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, emailAddress: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Business Hours</label>
                             <input value={settings.conciergeConfig.businessHours} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, businessHours: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                         </div>
                         <div>
                             <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">DM Template</label>
                             <textarea value={settings.conciergeConfig.dmTemplate} onChange={e => setSettings({...settings, conciergeConfig: {...settings.conciergeConfig, dmTemplate: e.target.value}})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none h-24" />
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
                          <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider ${selectedOrder.orderStatus === 'PAYMENT_AUTHORIZED' ? 'border-green-500 text-green-500' : 'border-gold-500 text-gold-500'}`}>
                                  {ORDER_STATUS_LABELS[selectedOrder.orderStatus as OrderStatus] || selectedOrder.orderStatus}
                              </span>
                              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                  {selectedOrder.contactMethod === 'instagram' ? 'Instagram Direct' : 
                                   selectedOrder.contactMethod === 'whatsapp' ? 'WhatsApp' : 
                                   selectedOrder.contactMethod === 'email' ? 'Concierge Email' : 
                                   'Private Concierge'}
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
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Client Registry</h3>
                          <div className="space-y-2 text-sm text-white/80">
                              <p><span className="text-white/30">Name:</span> {selectedOrder.shippingAddress?.fullName}</p>
                              <p><span className="text-white/30">Mobile:</span> {selectedOrder.shippingAddress?.mobile}</p>
                              <p><span className="text-white/30">Email:</span> {selectedOrder.shippingAddress?.email}</p>
                              <p className="border-t border-white/10 pt-2 mt-2"><span className="text-white/30">Address:</span><br/>
                              {selectedOrder.shippingAddress?.house}, {selectedOrder.shippingAddress?.street}<br/>
                              {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
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
                                  <span className="text-white/40 uppercase tracking-widest">Dossier</span>
                                  <span className="text-white font-mono">{selectedOrder.conciergeCode || selectedOrder.code}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-white/40 uppercase tracking-widest">Date Issued</span>
                                  <span className="text-white font-mono">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="space-y-3 mb-6">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-white/80">{item.title} <span className="text-white/40 ml-2">x{item.quantity}</span></span>
                                    <span className="text-white/80 font-mono">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
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
                          <select
                              value={selectedOrder.orderStatus}
                              onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                              className="bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none"
                          >
                              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                              ))}
                          </select>
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
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Uniqueness Tag</label>
                          <input value={currentProduct.uniquenessTag || ''} onChange={e => setCurrentProduct({...currentProduct, uniquenessTag: e.target.value})} placeholder="e.g. Limited Edition of 50" className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Stock Count</label>
                          <div className="flex items-center gap-2">
                              <input type="number" required value={currentProduct.countInStock} onChange={e => setCurrentProduct({...currentProduct, countInStock: Number(e.target.value)})} className="w-full bg-black border border-white/10 p-3 text-white text-sm focus:border-gold-500 outline-none" />
                              <button 
                                type="button"
                                onClick={() => setCurrentProduct(prev => ({ ...prev, countInStock: prev.countInStock > 0 ? 0 : 1 }))}
                                className={`p-3 border ${currentProduct.countInStock > 0 ? 'bg-green-500 text-black border-green-500' : 'bg-red-500 text-white border-red-500'}`}
                                title="Quick Toggle Stock (0/1)"
                              >
                                  <Power size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
                  {/* Archive Toggle in Modal */}
                  <div className="flex items-center gap-4 border border-white/10 p-4">
                      <div className={`w-4 h-4 border cursor-pointer flex items-center justify-center ${currentProduct.isArchived ? 'bg-white border-white' : 'border-white/40'}`} onClick={() => setCurrentProduct(prev => ({ ...prev, isArchived: !prev.isArchived }))}>
                          {currentProduct.isArchived && <Check size={12} className="text-black" />}
                      </div>
                      <span className="text-xs uppercase tracking-widest text-white/60">Archive Item (Hidden from public store)</span>
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