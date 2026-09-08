import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Crown, ChevronRight, Lock, CheckCircle2, 
  UserCheck, BadgeCheck, AlertCircle, Copy, Mail, Instagram, 
  MessageCircle, Send, Sparkles, Check, ArrowUpRight, Truck, FileText, Phone,
  Home, RefreshCw
} from 'lucide-react';
import { CartItem, Address, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../utils/db';
import { storage } from '../utils/storage';
import { INDIAN_STATES } from '../constants/locations';
import { 
  generatePurchaseCode, 
  generateConciergeMessage, 
  getContactUrl, 
  getMailtoUrl, 
  CONCIERGE_CONFIG 
} from '../utils/conciergeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CheckoutPageProps {
  onBack: () => void;
  directItem?: any;
  onRegisterConciergeOrder: (details: { 
    address: Address; 
    items: CartItem[]; 
    total: number; 
    orderId: string; 
    orderCode: string; 
    paymentStatus: string; 
    orderStatus: OrderStatus; 
    contactMethod: string; 
  }) => void;
}

export type PaymentMethod = 'gmail' | 'instagram' | 'private';

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, directItem, onRegisterConciergeOrder }) => {
  const { user, openAuthModal } = useAuth();
  const { cartItems, total, refreshCart } = useCart();

  // Compute effective items: directItem (from Acquire Now) merged with cartItems
  const effectiveItems = React.useMemo(() => {
    if (directItem) {
      const exists = cartItems.some(i => i.id === directItem.id && i.selectedSize === directItem.selectedSize);
      if (exists) return cartItems;
      return [
        {
          id: directItem.id,
          cartItemId: directItem.cartItemId || `direct_${directItem.id}_${directItem.selectedSize || 'std'}`,
          title: directItem.title,
          price: directItem.price,
          quantity: 1,
          image: directItem.image,
          category: directItem.category || 'APPAREL',
          selectedSize: directItem.selectedSize || 'STD',
          houseCode: directItem.houseCode,
          maxStock: directItem.maxStock
        },
        ...cartItems
      ];
    }
    return cartItems;
  }, [directItem, cartItems]);

  const effectiveTotal = React.useMemo(() => {
    return effectiveItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [effectiveItems]);
  
  // Stages: 'shipping' -> 'payment' -> 'confirmed'
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'confirmed'>('shipping');
  const [purchaseCode, setPurchaseCode] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [preferredPrivateChannel, setPreferredPrivateChannel] = useState<'whatsapp' | 'gmail' | 'instagram'>('whatsapp');
  const [privateChannelHandle, setPrivateChannelHandle] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const [address, setAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    country: 'India',
    address: '',
    city: '',
    state: '',
    pincode: '',
    mobile: '',
    alternateMobile: '',
    email: ''
  });

  // If vault is empty and no direct item, return
  useEffect(() => {
    if (!directItem && cartItems.length === 0 && currentStep === 'shipping') {
      onBack();
    }
  }, [directItem, cartItems, onBack, currentStep]);

  // Pre-fill user details when authenticated
  useEffect(() => {
    if (user) {
      let fName = user.fullName || '';
      let lName = '';
      if (fName.includes(' ')) {
        const parts = fName.split(' ');
        lName = parts.pop() || '';
        fName = parts.join(' ');
      }

      setAddress(prev => ({
        ...prev,
        firstName: prev.firstName || fName,
        lastName: prev.lastName || lName,
        email: prev.email || user.email || '',
        mobile: prev.mobile || user.mobile || '',
        alternateMobile: prev.alternateMobile || user.alternateMobile || '',
        ...(user.address || {})
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof Address]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

  const validateShippingForm = () => {
    const newErrors: Partial<Record<keyof Address, string>> = {};
    if (!address.firstName.trim()) newErrors.firstName = 'First name required';
    if (!address.lastName.trim()) newErrors.lastName = 'Last name required';
    
    const cleanMobile = address.mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'Mobile phone required';
    } else if (cleanMobile.length < 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!address.email.trim() || !address.email.includes('@')) {
      newErrors.email = 'Valid client email required';
    }

    if (!address.address.trim()) newErrors.address = 'Street address / residence coordinates required';
    if (!address.city.trim()) newErrors.city = 'City / Town required';
    if (!address.state.trim()) newErrors.state = 'State selection required';
    
    const cleanPin = address.pincode.replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      newErrors.pincode = 'Valid 6-digit PIN code required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move from Shipping Data collection to Private Concierge Payment page
  const handleProceedToPayment = async () => {
    setFormError(null);

    if (!user) {
      openAuthModal();
      return;
    }

    if (effectiveItems.some(item => item.maxStock !== undefined && item.quantity > item.maxStock)) {
      setFormError("One or more selected silhouettes exceed current atelier allocation. Please adjust quantity.");
      return;
    }

    if (!validateShippingForm()) {
      setFormError("Please provide all required delivery coordinates before proceeding.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate unique code in strict format DEUZ-TIME-DDMMYY
      const newCode = generatePurchaseCode();
      setPurchaseCode(newCode);

      const payloadAddress: Address = {
        ...address,
        fullName: `${address.firstName.trim()} ${address.lastName.trim()}`.trim()
      };

      // 2. Persist to Firestore and Admin Dashboard sync
      const response = await db.createConciergeOrder({
        items: effectiveItems,
        address: payloadAddress,
        total: effectiveTotal,
        contactMethod: 'pending_selection',
        orderCode: newCode
      });

      if (response && response.orderId) {
        setCreatedOrderId(response.orderId);
      }

      // Update user profile address in background
      if (user && user.id) {
        db.updateUserProfile(user.id, {
          addresses: [payloadAddress],
          mobile: payloadAddress.mobile
        }).catch(() => {});
      }

      // 3. Advance to the Private Concierge Payment Page
      setCurrentStep('payment');
    } catch (err: any) {
      console.error("Order creation failed", err);
      setFormError(err.message || "Failed to initialize acquisition protocol. Please retry.");
      refreshCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to compile the exact textual dossier for auto-copying
  const compileDossierText = () => {
    return generateConciergeMessage(purchaseCode, effectiveTotal, effectiveItems, {
      ...address,
      fullName: `${address.firstName} ${address.lastName}`.trim()
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleSwitchChannel = async (newChannel: 'whatsapp' | 'gmail' | 'instagram') => {
    setPreferredPrivateChannel(newChannel);
    const id = createdOrderId || purchaseCode;
    if (id) {
      await db.updateOrderChannel(id, newChannel).catch(() => {});
    }
    setCopyFeedback(`Confirmation channel updated to ${newChannel.toUpperCase()}`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // OPTION 1: GMAIL
  // Redirect to Gmail with auto-copying of shipping address, product price, unique code, house code, etc.
  const handleGmailPayment = async () => {
    setIsSubmitting(true);
    const dossierText = compileDossierText();

    // 1. Auto-copy dossier
    await copyToClipboard(dossierText, "Dossier copied! Launching Gmail compose...");

    // 2. Sync with Firebase Firestore
    if (createdOrderId) {
      await db.updateOrderChannel(createdOrderId, 'gmail').catch(() => {});
    }

    const orderPayload = {
      id: createdOrderId || purchaseCode,
      code: purchaseCode,
      conciergeCode: purchaseCode,
      address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      shippingAddress: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      items: effectiveItems,
      total: effectiveTotal,
      totalAmount: effectiveTotal,
      orderId: createdOrderId,
      orderCode: purchaseCode,
      paymentStatus: 'Pending',
      orderStatus: 'ORDER_SECURED',
      contactMethod: 'gmail',
      createdAt: new Date().toISOString()
    };
    storage.saveConfirmedOrder(orderPayload);
    storage.saveOrderCode(purchaseCode);

    onRegisterConciergeOrder({
      address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      items: effectiveItems,
      total: effectiveTotal,
      orderId: createdOrderId,
      orderCode: purchaseCode,
      paymentStatus: 'Pending',
      orderStatus: 'ORDER_SECURED',
      contactMethod: 'gmail'
    });

    // 3. Open Gmail web composer or fallback to mailto
    const gmailWebUrl = getContactUrl('gmail', dossierText, purchaseCode);
    const mailtoUrl = getMailtoUrl(dossierText, purchaseCode);

    setTimeout(() => {
      try {
        const opened = window.open(gmailWebUrl || mailtoUrl, '_blank');
        if (!opened) {
          window.location.href = mailtoUrl;
        }
      } catch {
        window.location.href = mailtoUrl;
      }
      setIsSubmitting(false);
    }, 400);
  };

  // OPTION 2: INSTAGRAM
  // Redirect to Instagram DM with auto-copying of shipping address, product price, unique code, house code, etc.
  const handleInstagramPayment = async () => {
    setIsSubmitting(true);
    const dossierText = compileDossierText();

    // 1. Auto-copy dossier
    await copyToClipboard(dossierText, "Dossier copied! Redirecting to Instagram DM...");

    // 2. Sync with Firebase Firestore
    if (createdOrderId) {
      await db.updateOrderChannel(createdOrderId, 'instagram').catch(() => {});
    }

    const orderPayload = {
      id: createdOrderId || purchaseCode,
      code: purchaseCode,
      conciergeCode: purchaseCode,
      address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      shippingAddress: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      items: effectiveItems,
      total: effectiveTotal,
      totalAmount: effectiveTotal,
      orderId: createdOrderId,
      orderCode: purchaseCode,
      paymentStatus: 'Pending',
      orderStatus: 'ORDER_SECURED',
      contactMethod: 'instagram',
      createdAt: new Date().toISOString()
    };
    storage.saveConfirmedOrder(orderPayload);
    storage.saveOrderCode(purchaseCode);

    onRegisterConciergeOrder({
      address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
      items: effectiveItems,
      total: effectiveTotal,
      orderId: createdOrderId,
      orderCode: purchaseCode,
      paymentStatus: 'Pending',
      orderStatus: 'ORDER_SECURED',
      contactMethod: 'instagram'
    });

    // 3. Redirect to Instagram Direct
    const instaUrl = getContactUrl('instagram', dossierText, purchaseCode);

    setTimeout(() => {
      if (instaUrl) {
        window.open(instaUrl, '_blank');
      }
      setIsSubmitting(false);
    }, 400);
  };

  // OPTION 3: PRIVATE
  // Details of shipping address, product price, unique code, house code, etc. are sent to the admin dashboard
  // and our team will contact them through WhatsApp, Gmail, or Instagram.
  const handlePrivateDeskPayment = async () => {
    setIsSubmitting(true);

    try {
      // Sync with Firestore & Admin Dashboard
      if (createdOrderId) {
        await db.updateOrderChannel(createdOrderId, 'private').catch(() => {});
        await db.updateOrderNotes(
          createdOrderId, 
          `[PRIVATE CONCIERGE TRANSMISSION]\nClient preferred contact channel: ${preferredPrivateChannel.toUpperCase()}\nClient handle/notes: ${privateChannelHandle || 'None provided'}\nUnique Code: ${purchaseCode}\nHouse Codes: ${effectiveItems.map(i => i.houseCode || 'N/A').join(', ')}`
        ).catch(() => {});
      }

      const orderPayload = {
        id: createdOrderId || purchaseCode,
        code: purchaseCode,
        conciergeCode: purchaseCode,
        address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
        shippingAddress: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
        items: effectiveItems,
        total: effectiveTotal,
        totalAmount: effectiveTotal,
        orderId: createdOrderId,
        orderCode: purchaseCode,
        paymentStatus: 'Pending',
        orderStatus: 'ORDER_SECURED',
        contactMethod: 'private',
        createdAt: new Date().toISOString()
      };
      storage.saveConfirmedOrder(orderPayload);
      storage.saveOrderCode(purchaseCode);

      onRegisterConciergeOrder({
        address: { ...address, fullName: `${address.firstName} ${address.lastName}`.trim() },
        items: effectiveItems,
        total: effectiveTotal,
        orderId: createdOrderId,
        orderCode: purchaseCode,
        paymentStatus: 'Pending',
        orderStatus: 'ORDER_SECURED',
        contactMethod: 'private'
      });

      // Show confirmed state
      setCurrentStep('confirmed');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate & Download PDF Dossier Invoice
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('DEUZ & CO.', 105, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('NOT FOR EVERYONE — ATELIER ACQUISITION DOSSIER', 105, 38, { align: 'center' });
    
    doc.setDrawColor(60, 60, 60);
    doc.line(20, 48, 190, 48);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text(`UNIQUE PURCHASE CODE: ${purchaseCode}`, 20, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 220);
    doc.text(`DATE ISSUED : ${new Date().toLocaleDateString('en-GB')}`, 20, 68);
    doc.text(`ATELIER DESK : PRIVATE CONCIERGE PROTOCOL`, 20, 75);
    
    doc.text('INSURED DELIVERY COORDINATES:', 110, 60);
    doc.setTextColor(255, 255, 255);
    doc.text(`${address.firstName} ${address.lastName}`, 110, 68);
    doc.setTextColor(180, 180, 180);
    doc.text(`${address.address}`, 110, 75);
    doc.text(`${address.city}, ${address.state} — ${address.pincode}`, 110, 82);
    doc.text(`Phone: ${address.mobile} | Email: ${address.email}`, 110, 89);
    
    const itemData = effectiveItems.map((item, idx) => [
      `${idx + 1}. ${item.title}`,
      item.houseCode ? `[${item.houseCode}]` : 'ATELIER',
      item.selectedSize || 'STD',
      item.quantity.toString(),
      `INR ${(item.price * item.quantity).toLocaleString('en-IN')}`
    ]);
    
    autoTable(doc, {
      startY: 105,
      head: [['ARTIFACT', 'HOUSE CODE', 'SIZE', 'QTY', 'VALUE']],
      body: itemData,
      theme: 'plain',
      styles: { 
        fillColor: [0, 0, 0], 
        textColor: [200, 200, 200],
        fontSize: 9,
        cellPadding: 5,
        lineColor: [40, 40, 40],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [20, 20, 20], 
        textColor: [212, 175, 55],
        fontStyle: 'bold'
      }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 140;
    doc.setDrawColor(60, 60, 60);
    doc.line(110, finalY + 8, 190, finalY + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL VALUE:', 110, finalY + 18);
    doc.setTextColor(212, 175, 55);
    doc.text(`INR ${effectiveTotal.toLocaleString('en-IN')}`, 190, finalY + 18, { align: 'right' });
    
    doc.save(`DEUZ_${purchaseCode}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col overflow-y-auto"
    >
      {/* Top Bar / Navigation */}
      <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-mono uppercase tracking-[0.2em]"
        >
          <ArrowLeft size={16} />
          <span>RETURN TO BOUTIQUE</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          <span className="font-serif tracking-[0.3em] text-xs uppercase text-gold-400">
            DEUZ ATELIER CHECKOUT
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-white/40 text-[10px] font-mono uppercase tracking-widest">
          <ShieldCheck size={14} className="text-gold-400" />
          <span>INSURED PRIVATE FREIGHT</span>
        </div>
      </header>

      {/* Copy notification toast */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-gold-400 text-black font-mono text-xs font-bold uppercase tracking-widest rounded-sm shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center gap-2"
          >
            <Check size={16} />
            <span>{copyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-12">

        {/* ========================================================= */}
        {/* USER AUTHENTICATION GATE (Requirement: user must be logged in) */}
        {/* ========================================================= */}
        {!user ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto my-12 bg-white/[0.02] border border-white/10 p-8 sm:p-12 text-center rounded-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            
            <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center mx-auto mb-6 text-gold-400">
              <Lock size={28} />
            </div>

            <h2 className="text-xl sm:text-2xl font-serif text-white tracking-[0.1em] uppercase mb-3">
              AUTHENTICATION MANDATORY
            </h2>

            <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed mb-8 max-w-md mx-auto">
              In accordance with atelier protocol, all acquisitions and bespoke private allocations require a verified client dossier. Please authenticate to complete your shipping registry.
            </p>

            <button
              onClick={openAuthModal}
              className="w-full py-4 bg-gold-400 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2"
            >
              <span>SIGN IN / REGISTER TO PROCEED</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={onBack}
              className="mt-4 text-[10px] text-white/40 hover:text-white font-mono uppercase tracking-widest"
            >
              Continue browsing collection
            </button>
          </motion.div>
        ) : (
          <div>
            {/* Step Indicator Header */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-10 text-xs font-mono tracking-widest">
              <div className={`flex items-center gap-2 ${currentStep === 'shipping' ? 'text-gold-400 font-bold' : 'text-white/40'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${currentStep === 'shipping' ? 'border-gold-400 bg-gold-400/20 text-gold-400' : 'border-white/20 text-white/40'}`}>
                  01
                </span>
                <span>SHIPPING REGISTRY</span>
              </div>

              <div className="w-8 sm:w-16 h-[1px] bg-white/10" />

              <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-gold-400 font-bold' : currentStep === 'confirmed' ? 'text-emerald-400' : 'text-white/30'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${currentStep === 'payment' ? 'border-gold-400 bg-gold-400/20 text-gold-400' : currentStep === 'confirmed' ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400' : 'border-white/20 text-white/30'}`}>
                  02
                </span>
                <span>PRIVATE PAYMENT</span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* STAGE 1: SHIPPING DATA COLLECTION PAGE */}
            {/* ========================================================= */}
            {currentStep === 'shipping' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
              >
                {/* Left Column: Shipping Registry Form */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-sm">
                  <div className="mb-6 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-gold-400 text-[10px] font-mono uppercase tracking-[0.25em] mb-1">
                      <Truck size={14} />
                      <span>INSURED COURIER DISPATCH</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wider uppercase">
                      Shipping Registry
                    </h2>
                    <p className="text-xs text-white/50 font-light mt-1">
                      Enter your verified coordinates for discreet, insured express delivery.
                    </p>
                  </div>

                  {formError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2 rounded-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          FIRST NAME *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={address.firstName}
                          onChange={handleInputChange}
                          placeholder="e.g. Alexander"
                          className={`w-full bg-black/60 border ${errors.firstName ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.firstName && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.firstName}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          LAST NAME *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={address.lastName}
                          onChange={handleInputChange}
                          placeholder="e.g. Vance"
                          className={`w-full bg-black/60 border ${errors.lastName ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.lastName && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.lastName}</span>}
                      </div>
                    </div>

                    {/* Email & Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          EMAIL ADDRESS *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={address.email}
                          onChange={handleInputChange}
                          placeholder="client@domain.com"
                          className={`w-full bg-black/60 border ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.email && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.email}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          PRIMARY CONTACT MOBILE (10 DIGITS) *
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={address.mobile}
                          onChange={handleInputChange}
                          placeholder="e.g. 9876543210"
                          maxLength={15}
                          className={`w-full bg-black/60 border ${errors.mobile ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.mobile && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.mobile}</span>}
                      </div>
                    </div>

                    {/* Alternate Mobile */}
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                        ALTERNATE CONTACT / WHATSAPP NUMBER (OPTIONAL)
                      </label>
                      <input
                        type="tel"
                        name="alternateMobile"
                        value={address.alternateMobile || ''}
                        onChange={handleInputChange}
                        placeholder="Secondary contact for delivery authorization"
                        className="w-full bg-black/60 border border-white/10 focus:border-gold-400 px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors"
                      />
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                        STREET ADDRESS / RESIDENCE / APARTMENT *
                      </label>
                      <textarea
                        name="address"
                        rows={2}
                        value={address.address}
                        onChange={handleInputChange}
                        placeholder="Flat / Suite No., Building Name, Street, Landmark"
                        className={`w-full bg-black/60 border ${errors.address ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} p-3.5 text-xs text-white font-mono rounded-sm outline-none transition-colors resize-none`}
                      />
                      {errors.address && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.address}</span>}
                    </div>

                    {/* City, State, Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          TOWN / CITY *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={handleInputChange}
                          placeholder="e.g. Mumbai"
                          className={`w-full bg-black/60 border ${errors.city ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.city && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.city}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          STATE / TERRITORY *
                        </label>
                        <select
                          name="state"
                          value={address.state}
                          onChange={handleInputChange}
                          className={`w-full bg-black/90 border ${errors.state ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        {errors.state && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.state}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/60 uppercase tracking-widest mb-1.5">
                          PINCODE (6 DIGITS) *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={address.pincode}
                          onChange={handleInputChange}
                          placeholder="e.g. 400001"
                          maxLength={6}
                          className={`w-full bg-black/60 border ${errors.pincode ? 'border-red-500' : 'border-white/10 focus:border-gold-400'} px-3.5 py-3 text-xs text-white font-mono rounded-sm outline-none transition-colors`}
                        />
                        {errors.pincode && <span className="text-[10px] text-red-400 font-mono mt-1 block">{errors.pincode}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Proceed to Payment CTA */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={handleProceedToPayment}
                      disabled={isSubmitting}
                      className="w-full py-4 sm:py-5 bg-gold-400 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_35px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>INITIALIZING ALLOCATION...</span>
                      ) : (
                        <>
                          <span>CONTINUE TO PRIVATE CONCIERGE PAYMENT</span>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest text-center mt-3">
                      Generates unique acquisition code DEUZ-TIME-DDMMYY
                    </p>
                  </div>
                </div>

                {/* Right Column: Acquisition Dossier Preview */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
                        VAULT RESERVATION
                      </span>
                      <span className="text-[10px] font-mono text-gold-400 tracking-wider">
                        {effectiveItems.length} {effectiveItems.length === 1 ? 'PIECE' : 'PIECES'}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                      {effectiveItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-16 h-20 object-cover rounded-sm bg-black shrink-0" 
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-serif text-white uppercase tracking-wider line-clamp-1">
                                {item.title}
                              </h4>
                              
                              {/* House Code */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-mono text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded border border-gold-400/20">
                                  {item.houseCode ? `HOUSE CODE: ${item.houseCode}` : 'HOUSE: ATELIER ARCHIVE'}
                                </span>
                              </div>

                              {item.selectedSize && (
                                <span className="text-[9px] font-mono text-white/50 block mt-1">
                                  SIZE: {item.selectedSize} • QTY: {item.quantity}
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-serif text-white font-medium">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-white/60">
                        <span>SUBTOTAL</span>
                        <span>₹{effectiveTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-gold-400">
                        <span>INSURED EXPRESS FREIGHT</span>
                        <span>COMPLIMENTARY</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>ALL APPLICABLE TAXES</span>
                        <span>INCLUDED</span>
                      </div>
                      <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                        <span className="text-white font-bold tracking-wider">TOTAL VALUE</span>
                        <span className="text-xl font-serif text-gold-400 font-bold">
                          ₹{effectiveTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Atelier Trust Badges */}
                  <div className="p-5 bg-white/[0.01] border border-white/5 rounded-sm space-y-3">
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <Crown size={14} className="text-gold-400 shrink-0" />
                      <span>Single-run private edition. Authentication certificate enclosed.</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <ShieldCheck size={14} className="text-gold-400 shrink-0" />
                      <span>Direct verification via Deuz Executive Concierge.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STAGE 2: PRIVATE CONCIERGE PAYMENT PAGE */}
            {/* ========================================================= */}
            {currentStep === 'payment' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Dossier Code Card */}
                <div className="bg-[#0A0A0A] border border-gold-400/30 p-6 sm:p-8 rounded-sm text-center relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                  
                  <span className="text-[9.5px] font-mono uppercase tracking-[0.3em] text-white/40 block mb-1">
                    ALLOCATION SECURED • UNIQUE PURCHASE CODE
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-3 my-3">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gold-200 to-gold-400 tracking-wider">
                      {purchaseCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(purchaseCode, "Unique Code copied!")}
                      className="p-2 border border-gold-400/30 hover:border-gold-400 bg-gold-400/10 text-gold-400 hover:text-white rounded transition-colors"
                      title="Copy Unique Purchase Code"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-white/60 max-w-lg mx-auto font-light">
                    Format: <span className="font-mono text-gold-400">DEUZ-TIME-DDMMYY</span>. Transmitted to our atelier dispatch registry.
                  </p>

                  {/* Summary row */}
                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-2.5 bg-black/40 border border-white/5 rounded">
                      <span className="text-[8.5px] text-white/40 font-mono uppercase block">HOUSE CODE(S)</span>
                      <span className="text-xs text-gold-400 font-mono font-medium truncate block">
                        {effectiveItems.map(i => i.houseCode).filter(Boolean).join(', ') || 'ARC-ATELIER'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded">
                      <span className="text-[8.5px] text-white/40 font-mono uppercase block">TOTAL VALUE</span>
                      <span className="text-xs text-white font-serif font-bold">
                        ₹{effectiveTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded">
                      <span className="text-[8.5px] text-white/40 font-mono uppercase block">RECIPIENT</span>
                      <span className="text-xs text-white font-mono truncate block">
                        {address.firstName} {address.lastName}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded">
                      <span className="text-[8.5px] text-white/40 font-mono uppercase block">DELIVERY REGION</span>
                      <span className="text-xs text-white font-mono truncate block">
                        {address.city}, {address.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Header */}
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-serif text-white tracking-widest uppercase">
                    Select Private Concierge Channel
                  </h3>
                  <p className="text-xs text-white/50 font-light mt-1">
                    Choose how you wish to communicate and complete payment for your allocation.
                  </p>
                </div>

                {/* The THREE specific options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* OPTION 1: GMAIL */}
                  <div className="bg-[#0A0A0A] border border-white/10 hover:border-gold-400/80 p-6 rounded-sm flex flex-col justify-between transition-all duration-300 group hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] relative">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <Mail size={22} />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono text-gold-400 uppercase tracking-widest px-2 py-0.5 bg-gold-400/10 rounded">
                          OPTION 1
                        </span>
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                          AUTO-COPY
                        </span>
                      </div>

                      <h4 className="text-lg font-serif text-white uppercase tracking-wider mb-2">
                        Gmail Concierge
                      </h4>

                      <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
                        Redirects directly to Gmail with automatic copying of shipping coordinates, product price, unique code, and house code.
                      </p>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[10px] font-mono text-white/50 space-y-1 mb-6">
                        <p>✓ Auto-copies full order dossier</p>
                        <p>✓ Pre-drafts email to {CONCIERGE_CONFIG.emailAddress}</p>
                        <p>✓ Direct invoice verification</p>
                      </div>
                    </div>

                    <button
                      onClick={handleGmailPayment}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-white text-black hover:bg-gold-400 font-mono font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>TRANSMIT VIA GMAIL</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {/* OPTION 2: INSTAGRAM */}
                  <div className="bg-[#0A0A0A] border border-white/10 hover:border-pink-500/80 p-6 rounded-sm flex flex-col justify-between transition-all duration-300 group hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] relative">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <Instagram size={22} />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono text-pink-400 uppercase tracking-widest px-2 py-0.5 bg-pink-500/10 rounded">
                          OPTION 2
                        </span>
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                          AUTO-COPY
                        </span>
                      </div>

                      <h4 className="text-lg font-serif text-white uppercase tracking-wider mb-2">
                        Instagram DM
                      </h4>

                      <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
                        Redirects to Instagram Direct (@{CONCIERGE_CONFIG.instagramHandle}) with auto-copying of shipping address, price, unique code, and house code.
                      </p>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[10px] font-mono text-white/50 space-y-1 mb-6">
                        <p>✓ Auto-copies full order dossier</p>
                        <p>✓ Opens Instagram chat with @{CONCIERGE_CONFIG.instagramHandle}</p>
                        <p>✓ Instant paste & confirmation</p>
                      </div>
                    </div>

                    <button
                      onClick={handleInstagramPayment}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-white text-black hover:bg-pink-400 font-mono font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>TRANSMIT VIA INSTAGRAM</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {/* OPTION 3: PRIVATE */}
                  <div className="bg-[#0A0A0A] border border-white/10 hover:border-gold-400 p-6 rounded-sm flex flex-col justify-between transition-all duration-300 group hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] relative">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <Crown size={22} />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono text-gold-400 uppercase tracking-widest px-2 py-0.5 bg-gold-400/10 rounded">
                          OPTION 3
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
                          ADMIN SYNC
                        </span>
                      </div>

                      <h4 className="text-lg font-serif text-white uppercase tracking-wider mb-2">
                        Private Desk
                      </h4>

                      <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
                        Details of shipping address, price, unique code, and house code are sent to the Admin Dashboard. Our team will contact you.
                      </p>

                      {/* Client channel preference selection */}
                      <div className="mb-4">
                        <label className="block text-[9.5px] font-mono text-white/60 uppercase tracking-wider mb-2">
                          Preferred Contact Channel:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                          <button
                            type="button"
                            onClick={() => setPreferredPrivateChannel('whatsapp')}
                            className={`py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm transition-colors ${preferredPrivateChannel === 'whatsapp' ? 'bg-gold-400 text-black border-gold-400 font-bold' : 'border-white/10 text-white/60 hover:text-white'}`}
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredPrivateChannel('gmail')}
                            className={`py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm transition-colors ${preferredPrivateChannel === 'gmail' ? 'bg-gold-400 text-black border-gold-400 font-bold' : 'border-white/10 text-white/60 hover:text-white'}`}
                          >
                            Gmail
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredPrivateChannel('instagram')}
                            className={`py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm transition-colors ${preferredPrivateChannel === 'instagram' ? 'bg-gold-400 text-black border-gold-400 font-bold' : 'border-white/10 text-white/60 hover:text-white'}`}
                          >
                            Instagram
                          </button>
                        </div>

                        {preferredPrivateChannel === 'instagram' && (
                          <input
                            type="text"
                            placeholder="Your Instagram Handle (@...)"
                            value={privateChannelHandle}
                            onChange={(e) => setPrivateChannelHandle(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-[11px] text-white font-mono rounded outline-none focus:border-gold-400"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handlePrivateDeskPayment}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gold-400 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>TRANSMIT TO ADMIN DESK</span>
                      <Send size={14} />
                    </button>
                  </div>

                </div>

                {/* Additional Utility: Download Dossier PDF & Back to Edit Shipping */}
                <div className="flex flex-wrap items-center justify-between pt-6 border-t border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setCurrentStep('shipping')}
                    className="text-white/40 hover:text-white flex items-center gap-2 tracking-widest"
                  >
                    <ArrowLeft size={14} />
                    <span>EDIT SHIPPING DATA</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="text-gold-400 hover:text-white flex items-center gap-2 tracking-widest"
                  >
                    <FileText size={14} />
                    <span>DOWNLOAD OFFICIAL INVOICE PDF</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STAGE 3: CONFIRMED SCREEN (For Option 3: Private Desk) */}
            {/* ========================================================= */}
            {currentStep === 'confirmed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto my-6 bg-[#0A0A0A] border border-gold-400/40 p-8 sm:p-12 text-center rounded-sm relative overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15)]"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

                <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center mx-auto mb-6 text-gold-400">
                  <CheckCircle2 size={32} />
                </div>

                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-400 block mb-2">
                  DISPATCH PROTOCOL ACTIVE
                </span>

                <h2 className="text-2xl sm:text-3xl font-serif text-white uppercase tracking-wider mb-2">
                  Dossier Received at Admin Desk
                </h2>

                <div className="my-6 p-4 bg-black/60 border border-white/10 rounded-sm">
                  <span className="text-[9px] font-mono text-white/40 uppercase block mb-1">
                    UNIQUE ALLOCATION CODE
                  </span>
                  <span className="text-2xl font-mono text-gold-400 font-bold tracking-wider">
                    {purchaseCode}
                  </span>
                </div>

                <p className="text-xs text-white/70 font-light leading-relaxed mb-6">
                  Your full shipping coordinates, product allocation values, unique code, and house codes have been securely synchronized with our Executive Admin Dashboard. Our team will contact you directly via <span className="font-bold text-gold-400 uppercase">{preferredPrivateChannel}</span> to finalize payment and courier dispatch.
                </p>

                {/* Products & Current Status Section */}
                <div className="my-6 text-left border border-white/10 bg-white/[0.02] p-4 rounded-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      ACQUIRED ARTIFACTS
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-sm border border-orange-500/30 text-orange-400 bg-orange-900/10">
                      ● ORDER_SECURED
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {effectiveItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-black/40 border border-white/5 rounded-sm">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-12 h-14 object-cover border border-white/10 rounded-sm" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-serif truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                            {item.houseCode && <span className="text-gold-400">{item.houseCode}</span>}
                            <span>Qty: {item.quantity}</span>
                            {((item as any).selectedSize || (item as any).size) && (
                              <span>Size: {(item as any).selectedSize || (item as any).size}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-white font-bold whitespace-nowrap">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="font-mono text-white/60 uppercase text-[10px]">Total Valuation</span>
                    <span className="font-mono text-gold-400 font-bold text-sm">
                      ₹{effectiveTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Change Confirmation Method */}
                <div className="my-6 p-4 bg-black/60 border border-white/10 rounded-sm text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                      CHANGE CONFIRMATION CHANNEL
                    </span>
                    <span className="text-[9px] font-mono text-gold-400 uppercase">
                      Current: {preferredPrivateChannel.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchChannel('whatsapp')}
                      className={`p-2.5 border rounded-sm text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        preferredPrivateChannel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <MessageCircle size={16} />
                      <span className="text-[9px] font-mono uppercase tracking-wider">WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchChannel('gmail')}
                      className={`p-2.5 border rounded-sm text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        preferredPrivateChannel === 'gmail'
                          ? 'border-gold-400 bg-gold-400/10 text-gold-400 font-bold'
                          : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <Mail size={16} />
                      <span className="text-[9px] font-mono uppercase tracking-wider">Gmail Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchChannel('instagram')}
                      className={`p-2.5 border rounded-sm text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        preferredPrivateChannel === 'instagram'
                          ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold'
                          : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <Instagram size={16} />
                      <span className="text-[9px] font-mono uppercase tracking-wider">Instagram DM</span>
                    </button>
                  </div>
                </div>

                {/* Instant WhatsApp fast lane option */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                      FAST-LANE WHATSAPP DESK
                    </span>
                    <span className="text-[11px] text-white/60">
                      Wish to discuss directly right now? Connect with our curator immediately.
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${CONCIERGE_CONFIG.whatsappNumber}?text=${encodeURIComponent(compileDossierText())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-widest rounded-sm whitespace-nowrap flex items-center gap-2"
                  >
                    <MessageCircle size={14} />
                    <span>CHAT NOW</span>
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-3 border border-white/20 hover:border-gold-400 text-white text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={14} />
                    <span>SAVE INVOICE PDF</span>
                  </button>

                  <button
                    onClick={onBack}
                    className="px-6 py-3 bg-white hover:bg-gold-400 text-black text-xs font-mono font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Home size={14} />
                    <span>RETURN TO HOME</span>
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        )}

      </div>
    </motion.div>
  );
};

export default CheckoutPage;
