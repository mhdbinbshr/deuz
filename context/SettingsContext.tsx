import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../utils/db';

interface SiteContent {
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
}

interface ConciergeConfig {
  instagramHandle: string;
  whatsappNumber: string;
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
  aboutImage: 'https://ik.imagekit.io/dto1zguat/file_0000000054e071fa80c009a3a2a07326.png'
};

const DEFAULT_CONCIERGE: ConciergeConfig = {
  instagramHandle: 'deuzandco',
  whatsappNumber: '918848918633',
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
      // In a real app, this endpoint might be public or require a simplified token
      // For now, we assume public access or cached default fallback
      const data = await db.getSystemSettings().catch(() => null);
      if (data) {
        if (data.siteContent) setContent({ ...DEFAULT_CONTENT, ...data.siteContent });
        if (data.conciergeConfig) setConcierge({ ...DEFAULT_CONCIERGE, ...data.conciergeConfig });
      }
    } catch (e) {
      console.warn("Failed to load dynamic settings, using defaults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
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
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};