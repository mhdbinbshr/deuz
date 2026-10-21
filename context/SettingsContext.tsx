import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../utils/db';
import { CONCIERGE_CONFIG } from '../utils/conciergeService';

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  checkoutDisclaimer: string;
  footerText: string;
  storeImage: string;
  scrollImages: string[];
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutDescription?: string;
  aboutImage?: string;
  sovereignCategory?: string;
  sovereignPrice?: string;
  sovereignStatus?: string;
  latestDropProductId?: string;
  latestDropTitle?: string;
  latestDropDescription?: string;
  latestDropImage?: string;
  latestDropCategory?: string;
  latestDropPrice?: string;
  latestDropStatus?: string;
}

interface ConciergeConfig {
  instagramHandle: string;
  whatsappNumber: string;
  phoneNumber?: string;
  displayPhone?: string;
  emailAddress: string;
  businessHours: string;
  dmTemplate: string;
}

interface SettingsContextType {
  content: SiteContent;
  concierge: ConciergeConfig;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_CONTENT: SiteContent = {
  heroTitle: 'NOT FOR EVERYONE',
  heroSubtitle: 'Not for everyone.',
  ctaText: 'Initiate Request',
  checkoutDisclaimer: 'Submit your allocation request. No payment is required until our curators verify your dossier.',
  footerText: 'Designed in Cinematic Vision',
  storeImage: 'https://ik.imagekit.io/dto1zguat/Evolve_1.jpg',
  scrollImages: [
    'https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541',
    'https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400',
    'https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983',
    'https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419'
  ],
  aboutTitle: 'THE HOUSE STANDARD',
  aboutSubtitle: 'DEUZ IS THE DESIGN.',
  aboutDescription: 'DEUZ & CO is anchored in singularity. One design defines the house — structured with discipline, refined with precision, and elevated through measured evolution. We do not multiply form. We perfect it. Each release strengthens the standard.',
  aboutImage: 'https://ik.imagekit.io/dto1zguat/1775236374031.png?updatedAt=1788674480127',
  latestDropProductId: 'auto',
  sovereignCategory: 'Apparel',
  sovereignPrice: '₹12,000',
  sovereignStatus: 'Active'
};

const DEFAULT_CONCIERGE: ConciergeConfig = {
  instagramHandle: 'deuzandco',
  whatsappNumber: '919207676921',
  phoneNumber: '+91 920 7676 921',
  displayPhone: '920 7676 921',
  emailAddress: 'deuzandco@gmail.com',
  businessHours: '9 AM - 9 PM IST',
  dmTemplate: 'Greetings from DEUZ & CO.'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [concierge, setConcierge] = useState<ConciergeConfig>(DEFAULT_CONCIERGE);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await db.getSystemSettings().catch(() => null);
      if (data) {
        if (data.siteContent) setContent({ ...DEFAULT_CONTENT, ...data.siteContent });
        if (data.conciergeConfig) {
          const merged = { ...DEFAULT_CONCIERGE, ...data.conciergeConfig };
          setConcierge(merged);
          Object.assign(CONCIERGE_CONFIG, {
            whatsappNumber: merged.whatsappNumber || DEFAULT_CONCIERGE.whatsappNumber,
            phoneNumber: merged.phoneNumber || DEFAULT_CONCIERGE.phoneNumber,
            displayPhone: merged.displayPhone || DEFAULT_CONCIERGE.displayPhone,
            instagramHandle: merged.instagramHandle || DEFAULT_CONCIERGE.instagramHandle,
            emailAddress: merged.emailAddress || DEFAULT_CONCIERGE.emailAddress
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load dynamic settings, using defaults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const unsub = db.subscribeSystemSettings((data) => {
      if (data) {
        if (data.siteContent) setContent({ ...DEFAULT_CONTENT, ...data.siteContent });
        if (data.conciergeConfig) {
          const merged = { ...DEFAULT_CONCIERGE, ...data.conciergeConfig };
          setConcierge(merged);
          Object.assign(CONCIERGE_CONFIG, {
            whatsappNumber: merged.whatsappNumber || DEFAULT_CONCIERGE.whatsappNumber,
            phoneNumber: merged.phoneNumber || DEFAULT_CONCIERGE.phoneNumber,
            displayPhone: merged.displayPhone || DEFAULT_CONCIERGE.displayPhone,
            instagramHandle: merged.instagramHandle || DEFAULT_CONCIERGE.instagramHandle,
            emailAddress: merged.emailAddress || DEFAULT_CONCIERGE.emailAddress
          });
        }
        setLoading(false);
      }
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ content, concierge, refreshSettings: fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    return {
      content: DEFAULT_CONTENT,
      concierge: DEFAULT_CONCIERGE,
      refreshSettings: async () => {},
      loading: false
    };
  }
  return context;
};