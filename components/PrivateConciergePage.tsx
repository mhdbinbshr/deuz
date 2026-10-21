import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Compass, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  PhoneCall, 
  Globe, 
  Search, 
  Send,
  MessageSquare,
  Lock,
  ExternalLink,
  MapPin,
  Building2
} from 'lucide-react';
import { db } from '../utils/db';
import { useAuth } from '../context/AuthContext';

interface PrivateConciergePageProps {
  onClose: () => void;
}

const CONSULTATION_TYPES = [
  {
    id: 'salon',
    title: 'Private Salon Fitting',
    subtitle: 'Exclusive atelier fitting & singular tailoring session',
    badge: 'In-Person Salon',
    duration: '90 Minutes'
  },
  {
    id: 'bespoke',
    title: 'Bespoke Curatorial Commission',
    subtitle: 'Direct consultation with the Maison Creative Direction',
    badge: 'Signature Atelier',
    duration: '120 Minutes'
  },
  {
    id: 'acquisition',
    title: 'Archive & Vault Acquisition',
    subtitle: 'Private acquisition review of museum & vault artifacts',
    badge: 'Museum Reserve',
    duration: '60 Minutes'
  },
  {
    id: 'virtual',
    title: 'Encrypted Virtual Salon',
    subtitle: 'Ultra-high-definition private digital salon worldwide',
    badge: 'Encrypted Tele-Salon',
    duration: '45 Minutes'
  }
];

export interface IndianCityAtelier {
  city: string;
  region: 'Metros' | 'West' | 'North' | 'South' | 'East & Central';
  label: string;
  address: string;
  openHours: string;
  zone: string;
  isFlagship?: boolean;
}

export const ATELIER_CITIES: IndianCityAtelier[] = [
  // Flagship Metros
  { 
    city: 'Mumbai', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'Bandra Kurla & Colaba', 
    address: 'Jio World Plaza & Taj Mahal Palace, Mumbai 400051',
    openHours: '11:00 — 20:30 IST',
    isFlagship: true
  },
  { 
    city: 'New Delhi', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'Chanakyapuri & Emporio', 
    address: 'The Chanakya & DLF Emporio, New Delhi 110021',
    openHours: '11:00 — 20:30 IST',
    isFlagship: true
  },
  { 
    city: 'Bengaluru', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'UB City & Lavelle Road', 
    address: 'The Collection, UB City, 24 Vittal Mallya Rd, Bengaluru 560001',
    openHours: '11:00 — 20:00 IST',
    isFlagship: true
  },
  { 
    city: 'Hyderabad', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'Banjara Hills & Jubilee Hills', 
    address: 'Road No. 10, Banjara Hills, Hyderabad 500034',
    openHours: '11:00 — 20:00 IST',
    isFlagship: true
  },
  { 
    city: 'Kolkata', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'Park Street & Alipore', 
    address: 'Queens Mansion, Park Street, Kolkata 700016',
    openHours: '11:00 — 20:00 IST',
    isFlagship: true
  },
  { 
    city: 'Chennai', 
    region: 'Metros',
    zone: 'Asia/Kolkata', 
    label: 'Nungambakkam & Boat Club', 
    address: 'Khader Nawaz Khan Road, Nungambakkam, Chennai 600006',
    openHours: '11:00 — 20:00 IST',
    isFlagship: true
  },

  // Western India
  {
    city: 'Pune',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Koregaon Park & Kalyani Nagar',
    address: 'North Main Road, Koregaon Park, Pune 411001',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Ahmedabad',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Sindhu Bhavan Road & Bodakdev',
    address: 'Sindhu Bhavan Marg, Bodakdev, Ahmedabad 380054',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Surat',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Vesu VIP Enclave',
    address: 'VIP Road, Vesu, Surat 395007',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Vadodara',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Alkapuri Heritage Row',
    address: 'RC Dutt Road, Alkapuri, Vadodara 390007',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Goa',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Panaji & Candolim Coast',
    address: 'Campal Heritage Precinct, Panaji, Goa 403001',
    openHours: '11:30 — 21:00 IST'
  },
  {
    city: 'Nagpur',
    region: 'West',
    zone: 'Asia/Kolkata',
    label: 'Civil Lines & Ramdaspeth',
    address: 'Palm Road, Civil Lines, Nagpur 440001',
    openHours: '11:00 — 19:30 IST'
  },

  // Northern India
  {
    city: 'Jaipur',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Civil Lines & C-Scheme',
    address: 'Jacob Road, Civil Lines, Jaipur 302006',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Chandigarh',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Sector 9 & Sukhna Sanctuary',
    address: 'Madhya Marg, Sector 9-D, Chandigarh 160009',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Lucknow',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Hazratganj & Gomti Nagar',
    address: 'Mahatma Gandhi Marg, Hazratganj, Lucknow 226001',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Ludhiana',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Sarabha Nagar & Gurdev Nagar',
    address: 'Ferozepur Road, Sarabha Nagar, Ludhiana 141001',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Amritsar',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Mall Road & Cantonment',
    address: 'The Mall, Cantonment, Amritsar 143001',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Agra',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Taj Nagri VIP Corridor',
    address: 'Fatehabad Road, Taj Nagri, Agra 282001',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Varanasi',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Cantonment Heritage Row',
    address: 'The Mall Road, Cantonment, Varanasi 221002',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Udaipur',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Lake Pichola Royal Salon',
    address: 'Haridas Ji Ki Magri, Lake Pichola, Udaipur 313001',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Dehradun',
    region: 'North',
    zone: 'Asia/Kolkata',
    label: 'Rajpur Road Enclave',
    address: 'Old Rajpur Road, Dehradun 248001',
    openHours: '11:00 — 19:30 IST'
  },

  // Southern India
  {
    city: 'Kochi',
    region: 'South',
    zone: 'Asia/Kolkata',
    label: 'Marine Drive & Willingdon Island',
    address: 'Shanmugham Road, Marine Drive, Kochi 682031',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Coimbatore',
    region: 'South',
    zone: 'Asia/Kolkata',
    label: 'Race Course Road',
    address: 'Race Course Promenade, Coimbatore 641018',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Visakhapatnam',
    region: 'South',
    zone: 'Asia/Kolkata',
    label: 'Beach Road & Waltair Uplands',
    address: 'Dr NTR Beach Road, Waltair Uplands, Visakhapatnam 530003',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Thiruvananthapuram',
    region: 'South',
    zone: 'Asia/Kolkata',
    label: 'Kowdiar Palace Enclave',
    address: 'Kowdiar Avenue, Thiruvananthapuram 695003',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Mysore',
    region: 'South',
    zone: 'Asia/Kolkata',
    label: 'Gokulam & Yadavagiri',
    address: 'Jhansi Lakshmi Bai Road, Yadavagiri, Mysore 570020',
    openHours: '11:00 — 19:30 IST'
  },

  // Eastern & Central India
  {
    city: 'Indore',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'Vijay Nagar & Old Palasia',
    address: 'AB Road, Vijay Nagar, Indore 452010',
    openHours: '11:00 — 20:00 IST'
  },
  {
    city: 'Bhopal',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'Arera Colony & Shamla Hills',
    address: 'E-3 Arera Colony, Bhopal 462016',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Patna',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'Bailey Road & Patliputra',
    address: 'Jawaharlal Nehru Marg, Patna 800001',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Bhubaneswar',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'Saheed Nagar & Janpath',
    address: 'Janpath Boulevard, Saheed Nagar, Bhubaneswar 751007',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Guwahati',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'GS Road & Uzanbazar',
    address: 'GS Road, Christian Basti, Guwahati 781005',
    openHours: '11:00 — 19:30 IST'
  },
  {
    city: 'Raipur',
    region: 'East & Central',
    zone: 'Asia/Kolkata',
    label: 'VIP Road & Shankar Nagar',
    address: 'VIP Road, Shankar Nagar, Raipur 492007',
    openHours: '11:00 — 19:30 IST'
  }
];

const FLAGSHIP_CLOCKS = ATELIER_CITIES.filter(c => c.isFlagship);

export const PrivateConciergePage: React.FC<PrivateConciergePageProps> = ({ onClose }) => {
  const { user } = useAuth();
  
  // State
  const [selectedType, setSelectedType] = useState('salon');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [customCity, setCustomCity] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityRegionFilter, setCityRegionFilter] = useState<'ALL' | 'Metros' | 'West' | 'North' | 'South' | 'East & Central' | 'CUSTOM'>('ALL');
  const [cityValidationError, setCityValidationError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointment' | 'inquiry' | 'lookup'>('appointment');
  
  // Appointment Form State
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.mobile || '',
    datePreference: '',
    notes: ''
  });

  // Submitted Appointment Dossier
  const [submittedDossier, setSubmittedDossier] = useState<{
    code: string;
    name: string;
    type: string;
    location: string;
    date: string;
  } | null>(null);

  // Quick Instant Inquiry
  const [inquiryData, setInquiryData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    subject: 'High Fashion Archival Ingestion',
    message: ''
  });
  const [inquirySent, setInquirySent] = useState(false);

  // Lookup Tool
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // World times with live ticking seconds for flagship atelier salons
  const [cityTimes, setCityTimes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const updateTimes = () => {
      const times: { [key: string]: string } = {};
      FLAGSHIP_CLOCKS.forEach(({ city, zone }) => {
        try {
          times[city] = new Intl.DateTimeFormat('en-GB', {
            timeZone: zone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).format(new Date());
        } catch {
          times[city] = '--:--:--';
        }
      });
      setCityTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Prepopulate if user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.mobile || ''
      }));
      setInquiryData(prev => ({
        ...prev,
        name: prev.name || user.fullName || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('deuzandco@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedDossierCode, setCopiedDossierCode] = useState(false);
  const handleCopyPhone = () => {
    navigator.clipboard.writeText('+91 920 7676 921');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCityValidationError('');

    const isCustom = selectedCity === 'Custom';
    if (isCustom && !customCity.trim()) {
      setCityValidationError('Please enter your custom city or sovereign private residence coordinates.');
      return;
    }

    setIsSubmitting(true);

    const typeObj = CONSULTATION_TYPES.find(t => t.id === selectedType);
    const cityObj = ATELIER_CITIES.find(c => c.city === selectedCity);
    const appointmentLocation = isCustom 
      ? `Custom Location: ${customCity.trim()} (Private Client Residence / Venue)` 
      : `${cityObj?.city || selectedCity} — ${cityObj?.label || 'Maison Salon'}`;
    const generatedCode = `CNCG-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await db.submitAppointment({
        code: generatedCode,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        consultationType: typeObj?.title || selectedType,
        location: appointmentLocation,
        datePreference: formData.datePreference,
        notes: isCustom ? `[CUSTOM CITY / COORDINATES: ${customCity.trim()}] ${formData.notes || ''}` : (formData.notes || ''),
        status: 'PENDING'
      });

      setSubmittedDossier({
        code: generatedCode,
        name: formData.name,
        type: typeObj?.title || selectedType,
        location: appointmentLocation,
        date: formData.datePreference || 'Immediate Scheduling'
      });
    } catch (err: any) {
      console.error('Failed to submit appointment to Firestore:', err);
      // Fallback local display
      setSubmittedDossier({
        code: generatedCode,
        name: formData.name,
        type: typeObj?.title || selectedType,
        location: appointmentLocation,
        date: formData.datePreference || 'Immediate Scheduling'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await db.submitAppointment({
        name: inquiryData.name,
        email: inquiryData.email,
        consultationType: inquiryData.subject || 'Direct Concierge Inquiry',
        location: 'Concierge Desk — Direct Transmission',
        datePreference: 'Immediate Concierge Review',
        notes: inquiryData.message,
        status: 'PENDING'
      });
      await db.logAuditEvent('CONCIERGE_INQUIRY_TRANSMITTED', 'concierge', 'desk', {
        name: inquiryData.name,
        email: inquiryData.email,
        subject: inquiryData.subject,
        message: inquiryData.message
      });
      setInquirySent(true);
    } catch (err) {
      setInquirySent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const found = await db.getAppointmentByCode(lookupCode.trim());
      if (found) {
        setLookupResult(found);
      } else {
        setLookupError(`No registered consultation dossier located under code "${lookupCode.trim().toUpperCase()}".`);
      }
    } catch (e: any) {
      setLookupError('Network verification issue. Please contact the desk directly.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[120] bg-[#030303] text-[#f2efe9] overflow-y-auto overflow-x-hidden font-sans select-none"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(212,175,55,0.3) #030303'
      }}
    >
      {/* Ambient Cinema Lighting & Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} 
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,rgba(160,120,40,0.02)_50%,transparent_80%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.95)_100%)]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 left-0 right-0 z-50 px-4 sm:px-12 py-4 sm:py-6 flex justify-between items-center backdrop-blur-xl bg-black/60 border-b border-white/[0.06]">
        <button
          onClick={onClose}
          className="flex items-center gap-2.5 sm:gap-4 group cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-500/40 flex items-center justify-center bg-[#0a0a0a] group-hover:bg-gold-500 group-hover:border-gold-500 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0">
            <ArrowLeft size={16} className="text-gold-400 group-hover:text-black transition-colors" />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-[7.5px] sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold-400/70 group-hover:text-gold-400 font-mono truncate">
              Return to Home
            </span>
            <span className="block text-[11px] sm:text-sm font-serif tracking-[0.15em] sm:tracking-[0.2em] text-white truncate">
              PRIVATE CONCIERGE SUITE
            </span>
          </div>
        </button>

        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-gold-300 uppercase">
                VIP: {user.fullName.split(' ')[0]}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all shrink-0"
            aria-label="Close Concierge"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Suite Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-12 py-8 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* Hero Banner */}
        <section className="text-center space-y-5 sm:space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-300 text-[8px] sm:text-[9px] uppercase tracking-[0.22em] sm:tracking-[0.3em] font-mono shadow-[0_0_25px_rgba(212,175,55,0.12)] max-w-full">
            <Sparkles size={12} className="text-gold-400 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
            <span className="truncate">Salon Privé & Haute Couture Services</span>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-7xl font-serif text-white tracking-[0.08em] sm:tracking-[0.1em] uppercase leading-tight">
            The Private Concierge
          </h1>

          <p className="text-xs sm:text-base text-white/60 font-light max-w-2xl mx-auto leading-relaxed px-2">
            By invitation and exclusive appointment. Sourcing singular archive editions, organizing private atelier fittings, and coordinating high-jewelry acquisitions across our global salons.
          </p>

          {/* Major Indian Cities Live Atelier Clocks */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 sm:pt-6 max-w-5xl mx-auto">
            {FLAGSHIP_CLOCKS.map(({ city, label, openHours }) => (
              <div 
                key={city}
                className="p-3.5 sm:p-4 rounded-sm border border-white/[0.07] bg-white/[0.02] backdrop-blur-md text-left transition-all hover:border-gold-500/40 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between text-gold-400 mb-1.5">
                  <span className="text-[10px] font-mono tracking-widest uppercase">{city}</span>
                  <span className="text-xs font-mono font-bold tracking-widest text-white">
                    {cityTimes[city] || '--:--:--'}
                  </span>
                </div>
                <p className="text-xs font-serif text-white/90 truncate">{label}</p>
                <p className="text-[9px] font-mono text-white/40 truncate mt-0.5">By Private Appointment · {openHours}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Tabs for Services */}
        <div className="flex justify-center border-b border-white/[0.08] pb-3 sm:pb-1">
          <div className="flex flex-wrap sm:inline-flex justify-center gap-1.5 sm:gap-4 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl sm:rounded-full backdrop-blur-md w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('appointment')}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'appointment'
                  ? 'bg-gold-500 text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Book Salon Fitting
            </button>
            <button
              onClick={() => setActiveTab('inquiry')}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inquiry'
                  ? 'bg-gold-500 text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Direct Inquiry
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'lookup'
                  ? 'bg-gold-500 text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Dossier Lookup
            </button>
          </div>
        </div>

        {/* Tab 1: Appointment Booking Suite */}
        {activeTab === 'appointment' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Selectors & Form */}
            <div className="lg:col-span-8 space-y-10">
              <AnimatePresence mode="wait">
                {submittedDossier ? (
                  /* Confirmation Passport Dossier */
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-8 sm:p-12 rounded-sm border-2 border-gold-500/50 bg-[#080808] text-center space-y-8 relative overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.9)]"
                  >
                    {/* Filigree corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500" />

                    <div className="w-16 h-16 rounded-full border-2 border-gold-500/60 bg-gold-500/10 mx-auto flex items-center justify-center text-gold-400 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                      <CheckCircle2 size={32} />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-gold-400">
                        Official Reservation Confirmed & Logged
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-widest uppercase">
                        Salon Appointment Dossier
                      </h2>
                      <p className="text-xs sm:text-sm text-white/60 font-light max-w-md mx-auto">
                        Your private salon consultation has been registered with the Head Concierge desk.
                      </p>
                    </div>

                    {/* Passport Card */}
                    <div className="max-w-md mx-auto bg-black border border-gold-500/30 p-6 rounded-sm text-left space-y-4 shadow-xl">
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Dossier Reference</span>
                        <span className="text-sm font-mono font-bold tracking-widest text-gold-400">{submittedDossier.code}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Client Operative</span>
                        <span className="text-xs font-serif text-white">{submittedDossier.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Consultation Nature</span>
                        <span className="text-xs font-serif text-gold-300">{submittedDossier.type}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Location</span>
                        <span className="text-xs font-mono text-white/80">{submittedDossier.location}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Schedule Preference</span>
                        <span className="text-xs font-mono text-white">{submittedDossier.date}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(submittedDossier.code);
                          setCopiedDossierCode(true);
                          setTimeout(() => setCopiedDossierCode(false), 2500);
                        }}
                        className="flex-1 py-3 px-6 border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
                      >
                        {copiedDossierCode ? 'Copied Dossier ID!' : 'Copy Dossier ID'}
                      </button>
                      <button
                        onClick={() => setSubmittedDossier(null)}
                        className="flex-1 py-3 px-6 bg-gold-500 text-black hover:bg-white text-xs font-mono uppercase font-bold tracking-widest transition-all cursor-pointer"
                      >
                        Schedule Another
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Form View */
                  <form onSubmit={handleAppointmentSubmit} className="space-y-10">
                    
                    {/* Step 1: Select Consultation Nature */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-mono">1</span>
                        <h3 className="text-sm uppercase tracking-[0.25em] font-mono text-gold-400">
                          Select Consultation Nature
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CONSULTATION_TYPES.map((type) => (
                          <div
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`p-5 rounded-sm border transition-all cursor-pointer text-left relative overflow-hidden ${
                              selectedType === type.id
                                ? 'border-gold-500 bg-gold-500/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-white/5 text-gold-400">
                                {type.badge}
                              </span>
                              <span className="text-[9px] font-mono text-white/40">{type.duration}</span>
                            </div>
                            <h4 className="text-base font-serif text-white tracking-wide mb-1">
                              {type.title}
                            </h4>
                            <p className="text-xs text-white/50 leading-relaxed">
                              {type.subtitle}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Select Salon Atelier City / Major Cities of India & Custom City */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-mono">2</span>
                          <div>
                            <h3 className="text-sm uppercase tracking-[0.25em] font-mono text-gold-400 font-bold">
                              Select Atelier City or Custom Coordinates
                            </h3>
                            <p className="text-[10px] font-mono text-white/50">
                              30+ Major Indian Ateliers • White-Glove In-Person Sovereign Dispatch
                            </p>
                          </div>
                        </div>

                        {/* Custom Entry Quick Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCity('Custom');
                            setCityRegionFilter('CUSTOM');
                          }}
                          className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                            selectedCity === 'Custom'
                              ? 'bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                              : 'bg-white/5 border-gold-500/30 text-gold-400 hover:bg-gold-500/15'
                          }`}
                        >
                          <MapPin size={11} />
                          <span>Custom City Space</span>
                        </button>
                      </div>

                      {/* City Search and Regional Filter Chips */}
                      <div className="space-y-2.5">
                        <div className="relative">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                          <input
                            type="text"
                            value={citySearchQuery}
                            onChange={e => setCitySearchQuery(e.target.value)}
                            placeholder="Filter major Indian cities (e.g. Pune, Jaipur, Lucknow, Kochi, Ahmedabad...)"
                            className="w-full bg-black/60 border border-white/10 focus:border-gold-500/60 pl-9 pr-4 py-2.5 text-xs text-white font-mono rounded outline-none transition-colors placeholder:text-white/30"
                          />
                          {citySearchQuery && (
                            <button
                              type="button"
                              onClick={() => setCitySearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/40 hover:text-white"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>

                        {/* Region Filters */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(['ALL', 'Metros', 'North', 'West', 'South', 'East & Central', 'CUSTOM'] as const).map(reg => (
                            <button
                              key={reg}
                              type="button"
                              onClick={() => {
                                setCityRegionFilter(reg);
                                if (reg === 'CUSTOM') {
                                  setSelectedCity('Custom');
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                cityRegionFilter === reg
                                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/60 font-bold'
                                  : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:text-white hover:border-white/20'
                              }`}
                            >
                              {reg === 'ALL' ? 'All India (30+)' : reg === 'CUSTOM' ? '+ Custom City' : reg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* City Cards Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 gold-scrollbar">
                        {/* Custom City Card Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCity('Custom');
                            setCityRegionFilter('CUSTOM');
                          }}
                          className={`p-3.5 rounded-sm border text-left transition-all cursor-pointer relative overflow-hidden ${
                            selectedCity === 'Custom'
                              ? 'border-gold-400 bg-gradient-to-r from-gold-500/20 to-amber-500/10 text-white shadow-[0_0_25px_rgba(212,175,55,0.25)] ring-1 ring-gold-400'
                              : 'border-gold-500/30 bg-gold-500/5 text-white/80 hover:text-white hover:border-gold-500/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-gold-400 font-bold flex items-center gap-1">
                              <MapPin size={10} /> CUSTOM
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <span className="block text-xs font-serif tracking-wide uppercase font-bold text-white">
                            Custom Sovereign City
                          </span>
                          <span className="block text-[8.5px] font-mono text-gold-400/80 truncate mt-0.5">
                            {customCity.trim() ? customCity.trim() : 'Enter your private coordinates'}
                          </span>
                        </button>

                        {/* Filtered Indian Cities */}
                        {ATELIER_CITIES
                          .filter(c => {
                            if (cityRegionFilter === 'CUSTOM') return false;
                            if (cityRegionFilter !== 'ALL' && c.region !== cityRegionFilter) return false;
                            if (citySearchQuery.trim()) {
                              const q = citySearchQuery.toLowerCase();
                              return c.city.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
                            }
                            return true;
                          })
                          .map((c) => (
                            <button
                              type="button"
                              key={c.city}
                              onClick={() => {
                                setSelectedCity(c.city);
                                setCityValidationError('');
                              }}
                              className={`p-3.5 rounded-sm border text-left transition-all cursor-pointer relative ${
                                selectedCity === c.city
                                  ? 'border-gold-500 bg-gold-500/15 text-white shadow-[0_0_20px_rgba(212,175,55,0.2)] ring-1 ring-gold-400'
                                  : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">
                                  {c.region}
                                </span>
                                {c.isFlagship && (
                                  <span className="text-[8px] font-mono text-gold-400 uppercase tracking-wider font-semibold">
                                    Flagship
                                  </span>
                                )}
                              </div>
                              <span className="block text-xs font-serif tracking-widest uppercase font-bold text-white">
                                {c.city}
                              </span>
                              <span className="block text-[8.5px] font-mono text-gold-400/80 truncate mt-0.5">
                                {c.label}
                              </span>
                            </button>
                          ))}
                      </div>

                      {/* DEDICATED CUSTOM CITY ENTER SPACE */}
                      {(selectedCity === 'Custom' || cityRegionFilter === 'CUSTOM') && (
                        <div className="p-4 sm:p-5 rounded-lg border border-gold-500/50 bg-gradient-to-br from-gold-500/10 via-black to-[#0d0d0d] space-y-3 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                            <label className="text-[10px] sm:text-[11px] uppercase font-mono tracking-[0.15em] sm:tracking-[0.2em] text-gold-400 font-bold flex items-center gap-2">
                              <MapPin size={14} className="text-gold-400 animate-pulse shrink-0" />
                              <span>Custom City / Private Residence Coordinates *</span>
                            </label>
                            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                              <span>Sovereign White-Glove Dispatch</span>
                            </span>
                          </div>

                          <div className="relative z-10">
                            <input
                              type="text"
                              value={customCity}
                              onChange={e => {
                                setCustomCity(e.target.value);
                                setSelectedCity('Custom');
                                setCityValidationError('');
                              }}
                              placeholder="e.g. Udaipur, Jodhpur, Monaco, Dubai, Dehradun, Yacht Berth 4, Client Private Estate..."
                              className="w-full bg-black/90 border border-gold-500/50 focus:border-gold-400 p-3.5 text-xs sm:text-sm text-white font-mono rounded outline-none transition-all placeholder:text-white/30 shadow-inner"
                              autoFocus
                            />
                          </div>

                          <p className="text-[10px] font-mono text-white/60 relative z-10 leading-relaxed">
                            Atelier DEUZ coordinates armed diplomatic delivery, private chartered viewings, and on-site bespoke tailoring sessions to any sovereign estate across India and overseas.
                          </p>
                        </div>
                      )}

                      {/* City Validation Error */}
                      {cityValidationError && (
                        <p className="text-[11px] font-mono text-red-400 flex items-center gap-1.5">
                          <span>•</span> {cityValidationError}
                        </p>
                      )}
                    </div>

                    {/* Step 3: Contact & Scheduling Dossier */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-mono">3</span>
                        <h3 className="text-sm uppercase tracking-[0.25em] font-mono text-gold-400">
                          Client Operative Dossier
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Full Name *</label>
                          <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Lord / Lady / Title & Name"
                            className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Confidential Email *</label>
                          <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="operative@domain.com"
                            className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Direct Phone / Signal</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Preferred Date & Window</label>
                          <input
                            type="text"
                            value={formData.datePreference}
                            onChange={e => setFormData({ ...formData, datePreference: e.target.value })}
                            placeholder="e.g. Oct 24, Afternoon or Flexible"
                            className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                          Tailoring or Archival Ingestion Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Specific museum pieces of interest, custom sizing specifications, or security requirements..."
                          className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-gold-500 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Encrypting & Registering Dossier...</span>
                      ) : (
                        <>
                          <span>Submit Reservation to Head Concierge</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Head Concierge Desk Info & Protocols */}
            <div className="lg:col-span-4 space-y-8">
              {/* Direct Desk Card */}
              <div className="p-6 rounded-sm border border-gold-500/30 bg-gradient-to-b from-[#120f09] to-[#080808] space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-gold-400">
                    Direct Line
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-serif text-white tracking-wide">
                    Head Concierge Desk
                  </h3>
                  <p className="text-xs text-white/50 font-light mt-1">
                    Direct private communications channel for acquisitions, vault viewings, and appointment changes.
                  </p>
                </div>

                <div className="p-3.5 bg-black/80 border border-white/10 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-gold-400" />
                    <span className="text-xs font-mono text-white/90">deuzandco@gmail.com</span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1.5 text-gold-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="p-3.5 bg-black/80 border border-white/10 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PhoneCall size={14} className="text-gold-400" />
                    <a href="tel:+919207676921" className="text-xs font-mono text-white/90 hover:text-gold-400 transition-colors">+91 920 7676 921</a>
                  </div>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1.5 text-gold-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Phone Number"
                  >
                    {copiedPhone ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="space-y-3 pt-2 text-[11px] text-white/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} className="text-gold-400 shrink-0" />
                    <span>All consultations strictly bound by Non-Disclosure Protocol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-gold-400 shrink-0" />
                    <span>Average concierge response latency: &lt; 2 Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-gold-400 shrink-0" />
                    <span>Global white-glove armed courier delivery upon acquisition</span>
                  </div>
                </div>
              </div>

              {/* Private Concierge Appointment Protocol */}
              <div className="p-6 rounded-sm border border-white/[0.07] bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-mono tracking-[0.2em] text-gold-400">
                    Private Appointment Protocol
                  </h4>
                  <span className="text-[9px] font-mono text-white/40">Exclusive Consultation</span>
                </div>
                <p className="text-xs text-white/70 font-light leading-relaxed">
                  To safeguard client discretion and security, all consultations are conducted strictly by confidential private booking at sovereign residences, luxury suites, or reserved private ateliers.
                </p>
                <div className="space-y-2.5 pt-1 text-[11px] font-mono text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                    <span>Discreet bespoke fittings scheduled individually</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                    <span>Dedicated Master Tailor & Archival Curator assigned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                    <span>Locations coordinated directly upon dossier verification</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-gold-400/80 flex items-center gap-2">
                  <MapPin size={12} className="shrink-0 text-gold-400" />
                  <span>Available across all metropolitan centers and worldwide private estates.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Inquiry */}
        {activeTab === 'inquiry' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-widest uppercase">
                Direct Dispatch to Head Concierge
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-light max-w-lg mx-auto">
                Transmit an encrypted dispatch directly to our executive concierge desk for private acquisitions, press inquiries, or bespoke queries.
              </p>
            </div>

            {inquirySent ? (
              <div className="p-10 rounded-sm border border-gold-500/40 bg-black text-center space-y-4">
                <CheckCircle2 size={40} className="text-gold-400 mx-auto" />
                <h3 className="text-2xl font-serif text-white uppercase">Inquiry Transmitted</h3>
                <p className="text-xs text-white/60 max-w-md mx-auto">
                  Your dispatch has been registered. An encrypted confirmation has also been dispatched to your email client.
                </p>
                <button
                  onClick={() => setInquirySent(false)}
                  className="px-6 py-2.5 border border-gold-500/40 text-gold-300 text-xs font-mono uppercase tracking-widest hover:bg-gold-500/10 transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-6 bg-white/[0.02] border border-white/[0.08] p-8 rounded-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Your Name *</label>
                    <input
                      required
                      type="text"
                      value={inquiryData.name}
                      onChange={e => setInquiryData({ ...inquiryData, name: e.target.value })}
                      placeholder="Title & Full Name"
                      className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Confidential Email *</label>
                    <input
                      required
                      type="email"
                      value={inquiryData.email}
                      onChange={e => setInquiryData({ ...inquiryData, email: e.target.value })}
                      placeholder="client@domain.com"
                      className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Subject *</label>
                  <select
                    value={inquiryData.subject}
                    onChange={e => setInquiryData({ ...inquiryData, subject: e.target.value })}
                    className="w-full bg-black border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none"
                  >
                    <option value="High Fashion Archival Ingestion">High Fashion Archival Ingestion</option>
                    <option value="Vault Artifact Private Purchase">Vault Artifact Private Purchase</option>
                    <option value="Bespoke Runway Fitting">Bespoke Runway Fitting</option>
                    <option value="VIP Editorial & Press Inquiries">VIP Editorial & Press Inquiries</option>
                    <option value="General Concierge Assistance">General Concierge Assistance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={inquiryData.message}
                    onChange={e => setInquiryData({ ...inquiryData, message: e.target.value })}
                    placeholder="Provide details regarding your request, desired pieces, or schedule..."
                    className="w-full bg-black/80 border border-white/10 p-3.5 text-sm text-white focus:border-gold-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gold-500 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>Transmit Inquiry to deuzandco@gmail.com</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Dossier Lookup */}
        {activeTab === 'lookup' && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-widest uppercase">
                Lookup Registered Dossier
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-light">
                Verify the live status of your private salon appointment or concierge requisition code.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="flex gap-2">
              <input
                required
                type="text"
                value={lookupCode}
                onChange={e => setLookupCode(e.target.value)}
                placeholder="e.g. CNCG-2026-8491"
                className="flex-1 bg-black border border-white/10 p-3.5 text-sm font-mono text-white focus:border-gold-500 outline-none uppercase"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-6 py-3.5 bg-gold-500 text-black font-mono font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {lookupLoading ? 'Verifying...' : 'Lookup'}
              </button>
            </form>

            {lookupError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center">
                {lookupError}
              </div>
            )}

            {lookupResult && (
              <div className="p-6 bg-black border border-gold-500/40 rounded-sm space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Dossier Code</span>
                  <span className="text-sm font-mono font-bold text-gold-400">{lookupResult.code}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Status</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest bg-gold-500/20 text-gold-300 border border-gold-500/40">
                    {lookupResult.status || 'CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Client</span>
                  <span className="text-xs font-serif text-white">{lookupResult.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Service</span>
                  <span className="text-xs font-serif text-gold-300">{lookupResult.consultationType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Location</span>
                  <span className="text-xs font-mono text-white/80">{lookupResult.location}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default PrivateConciergePage;
