import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Package, Clock, ShieldCheck, AlertCircle, Search, ArrowUpRight, Copy, ExternalLink, Check } from 'lucide-react';
import { db } from '../utils/db';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_DESCRIPTIONS, ORDER_PHASES, OrderStatus } from '../types';

interface MyOrdersPageProps {
  onBack: () => void;
}

const OrderTimeline = ({ currentStatus }: { currentStatus: OrderStatus }) => {
  const statusMap: Record<string, number> = {
      'ORDER_SECURED': 0,
      'PAYMENT_AUTHORIZED': 1,
      'ORDER_VERIFIED': 2,
      'IN_PRODUCTION': 3,
      'QUALITY_ASSURED': 4,
      'READY_FOR_DISPATCH': 5,
      'DISPATCHED': 6,
      'IN_TRANSIT': 7,
      'ARRIVED_AT_HUB': 8,
      'OUT_FOR_DELIVERY': 9,
      'DELIVERED': 10,
      'EXPERIENCE_UNLOCKED': 11,
      'CANCELLED': -1
  };

  const currentStepIndex = statusMap[currentStatus] ?? 0;

  if (currentStatus === 'CANCELLED') {
      return (
          <div className="flex items-center gap-2 text-red-500 bg-red-900/10 px-4 py-3 border border-red-500/20 rounded-sm w-full mt-6">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Dossier Archived</span>
          </div>
      );
  }

  return (
    <div className="w-full py-6 mt-2">
      <div className="relative flex justify-between items-center px-1">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-[5px] h-[1px] bg-white/10 -z-0" />
        
        {/* Active Line (Progress) */}
        <div 
            className="absolute left-0 top-[5px] h-[1px] bg-gold-500 transition-all duration-1000 -z-0" 
            style={{ width: `${(currentStepIndex / 11) * 100}%` }}
        />

        {ORDER_PHASES.map((phase, idx) => {
          // A phase is completed if the current status is beyond its last status
          const phaseLastStatusIndex = statusMap[phase.statuses[phase.statuses.length - 1]];
          const phaseFirstStatusIndex = statusMap[phase.statuses[0]];
          const isCompleted = currentStepIndex >= phaseLastStatusIndex;
          const isCurrent = currentStepIndex >= phaseFirstStatusIndex && currentStepIndex <= phaseLastStatusIndex;
          const isPast = currentStepIndex > phaseLastStatusIndex;

          return (
            <div key={phase.name} className="relative z-10 flex flex-col items-center gap-3 group">
              <div 
                className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                  isCompleted || isCurrent
                    ? 'bg-gold-500 border-gold-500' 
                    : 'bg-[#0A0A0A] border-white/20'
                } ${isCurrent ? 'ring-4 ring-gold-500/20 scale-125' : ''}`} 
              >
                  {isPast && <div className="absolute inset-0 flex items-center justify-center text-[6px] text-black font-bold">✓</div>}
              </div>
              <span className={`text-[9px] uppercase tracking-widest absolute top-6 whitespace-nowrap transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-white' : 'text-white/30'
              }`}>
                {phase.name.split(' — ')[1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await db.getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to load archives", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusInstruction = (order: Order) => {
    const status = order.orderStatus;
    if (status === 'ORDER_SECURED' && order.paymentLink) {
        return "Allocation secured. A private invoice has been issued. Please complete payment.";
    }
    return ORDER_STATUS_DESCRIPTIONS[status] || "Status update pending.";
  };

  const handleCopyCode = (code: string) => {
      navigator.clipboard.writeText(code);
      showToast("Reference copied to clipboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto overflow-x-hidden"
    >
      {/* Nav */}
      <nav className="sticky top-0 left-0 right-0 z-50 p-8 flex justify-between items-center bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
            <Package size={20} className="text-gold-500" />
            <h1 className="text-sm font-serif text-white tracking-[0.2em] uppercase">My Dossiers</h1>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
          <span className="uppercase tracking-widest text-[10px] hidden md:block group-hover:mr-2 transition-all">Close Archive</span>
          <X size={20} />
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-2 border-white/10 border-t-gold-500 rounded-full animate-spin" />
                <p className="text-white/30 text-[10px] uppercase tracking-widest">Retrieving Records...</p>
            </div>
        ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center border border-white/5 bg-white/[0.02] rounded-sm">
                <Search size={48} className="text-white/20 mb-6" />
                <h2 className="text-xl font-serif text-white mb-2">No Active Dossiers</h2>
                <p className="text-white/40 text-sm max-w-md">Your acquisition history is empty. Visit the gallery to initiate a request.</p>
            </div>
        ) : (
            <div className="space-y-8">
                {orders.map((order) => (
                    <motion.div 
                        key={order.id || order._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0A0A0A] border border-white/10 rounded-sm overflow-hidden group hover:border-gold-500/30 transition-all duration-500"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02]">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-gold-500 font-mono text-lg tracking-wider">{order.conciergeCode || order.code || 'PENDING'}</span>
                                    {order.orderStatus === 'PAYMENT_AUTHORIZED' && <ShieldCheck size={14} className="text-green-500" />}
                                    <button onClick={() => handleCopyCode(order.conciergeCode || order.code || '')} className="text-white/20 hover:text-white transition-colors"><Copy size={12}/></button>
                                </div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    Requested on {new Date(order.createdAt || order.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Live Status</p>
                                    <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider border rounded-sm ${
                                        order.orderStatus === 'PAYMENT_AUTHORIZED' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                        order.orderStatus === 'CANCELLED' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                                        'bg-gold-500/10 text-gold-500 border-gold-500/30'
                                    }`}>
                                        {ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || order.orderStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Items & Timeline */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Items */}
                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-12 h-16 bg-black border border-white/10 overflow-hidden shrink-0">
                                                <img src={item.image} alt="" className="w-full h-full object-cover opacity-60" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{item.title}</p>
                                                <p className="text-white/40 text-xs">
                                                    {item.selectedSize ? `Size: ${item.selectedSize} • ` : ''} 
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Timeline */}
                                <OrderTimeline currentStatus={order.orderStatus} />
                                
                                {/* Concierge Instructions */}
                                <div className="bg-white/5 border border-white/10 p-4 rounded-sm flex gap-3 items-start">
                                    <div className="mt-0.5 text-gold-500"><AlertCircle size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-gold-500 uppercase tracking-widest mb-1">Concierge Update</p>
                                        <p className="text-white/60 text-xs leading-relaxed font-light">
                                            {getStatusInstruction(order)}
                                        </p>
                                    </div>
                                </div>

                                {/* Tracking Info */}
                                {order.trackingInfo && order.trackingInfo.trackingNumber && (
                                    <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-sm flex gap-3 items-start">
                                        <div className="mt-0.5 text-white/40"><Package size={14} /></div>
                                        <div className="w-full">
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Logistics & Tracking</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-white text-xs">
                                                    <span className="text-white/60">{order.trackingInfo.carrier}:</span> {order.trackingInfo.trackingNumber}
                                                </p>
                                                {order.trackingInfo.trackingUrl && (
                                                    <a href={order.trackingInfo.trackingUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:text-gold-400 text-[10px] uppercase tracking-widest flex items-center gap-1">
                                                        Track <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Meta & Actions */}
                            <div className="flex flex-col justify-between h-full border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Value</p>
                                        <p className="text-xl font-serif text-white">₹{(order.totalAmount || order.total).toLocaleString('en-IN')}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Service Level</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                                            <span className="text-[10px] text-white/80 font-medium">Personal Concierge Active</span>
                                        </div>
                                        <p className="text-[9px] text-white/40 mt-1">Your order is under personal concierge handling.</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Channel</p>
                                        <p className="text-white/60 text-xs capitalize flex items-center gap-2">
                                            {order.contactMethod === 'instagram' ? 'Instagram Direct' : 
                                             order.contactMethod === 'whatsapp' ? 'WhatsApp' : 
                                             order.contactMethod === 'email' ? 'Concierge Email' : 
                                             'Private Concierge'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-8 space-y-3">
                                    {order.paymentLink && order.orderStatus === 'ORDER_SECURED' && (
                                        <a 
                                            href={order.paymentLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full block text-center py-4 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black transition-all text-[10px] uppercase tracking-widest font-bold"
                                        >
                                            Complete Payment
                                        </a>
                                    )}
                                    
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-white/30 text-[9px]">
                                        <span className="flex items-center gap-1"><Clock size={10} /> Last Activity</span>
                                        <span>{new Date(order.updatedAt || new Date()).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-black px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2"
        >
          <Check size={14} />
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MyOrdersPage;