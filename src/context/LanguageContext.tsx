import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Brand
  tagline: {
    en: 'Local Skills. Fair Work. Stronger Communities.',
    hi: 'स्थानीय हुनर। निष्पक्ष काम। मजबूत समुदाय।'
  },
  pilotKanpur: {
    en: 'Kanpur, UP Pilot (SIH 2026)',
    hi: 'कानपुर, उ.प्र. पायलट (SIH 2026)'
  },
  // Nav
  home: { en: 'Home', hi: 'होम' },
  findServices: { en: 'Find Services', hi: 'सेवाएं खोजें' },
  myBookings: { en: 'My Bookings', hi: 'मेरी बुकिंग' },
  workerPortal: { en: 'Worker Portal', hi: 'कारीगर पोर्टल' },
  secretaryPortal: { en: 'Secretary Desk', hi: 'सोसायटी सचिव' },
  federationPortal: { en: 'Federation Admin', hi: 'फेडरेशन एडमिन' },
  superAdmin: { en: 'Super Admin', hi: 'सुपर एडमिन' },
  aiForecast: { en: 'AI Demand Forecast', hi: 'AI मांग पूर्वानुमान' },
  welfareInsurance: { en: 'Welfare & Insurance', hi: 'कल्याण व बीमा' },
  emergencySos: { en: 'Emergency SOS', hi: 'आपातकालीन SOS' },
  voiceSearch: { en: 'Voice Booking', hi: 'बोलकर बुक करें' },
  installApp: { en: 'Install App', hi: 'ऐप इंस्टॉल करें' },
  // Hero
  heroTitle: {
    en: 'Verified Local Technicians Owned by Their Cooperative',
    hi: 'सहकारी समिति द्वारा सत्यापित आपके नजदीकी मिस्त्री व कारीगर'
  },
  heroSubtitle: {
    en: 'Fair 90% pay to workers, transparent 10% platform fee, QR-certified skills, and 24/7 rapid emergency dispatch in Kanpur.',
    hi: 'कारीगर को 90% पूरी मजदूरी, पारदर्शी 10% शुल्क, QR प्रमाणित कौशल और कानपुर में 24/7 त्वरित आपातकालीन सेवा।'
  },
  searchPlaceholder: {
    en: 'Search electrician, plumber, appliance repair, carpenter...',
    hi: 'इलेक्ट्रीशियन, प्लंबर, फ्रिज-गीजर रिपेयर, बढ़ई खोजें...'
  },
  // Categories
  categoriesTitle: { en: 'Cooperative Service Sectors', hi: 'सहकारी सेवा श्रेणियां' },
  nearbyWorkers: { en: 'Verified Technicians Near You', hi: 'आपके नजदीकी सत्यापित कारीगर' },
  fairShareTitle: { en: 'The Cooperative Difference', hi: 'सहयोग समिति का अंतर' },
  fairShareSubtitle: {
    en: 'Private platforms take 25-35% commission. SAHYOG transfers 90% directly to the worker and invests 2% in worker healthcare & insurance.',
    hi: 'निजी कंपनियां 25-35% तक कमीशन काटती हैं। सहयोग में 90% सीधा कारीगर को मिलता है और 2% उनके स्वास्थ्य व बीमा में जमा होता है।'
  },
  // Actions
  bookNow: { en: 'Book Service', hi: 'अभी बुक करें' },
  viewProfile: { en: 'View Profile', hi: 'प्रोफाइल देखें' },
  verifyQr: { en: 'Verify QR Certificate', hi: 'QR प्रमाणपत्र जांचें' },
  callWorker: { en: 'Call Worker', hi: 'कारीगर को कॉल करें' },
  shareOtp: { en: 'Share OTP with Worker', hi: 'कारीगर को OTP बताएं' },
  payNow: { en: 'Pay Securely', hi: 'सुरक्षित भुगतान करें' },
  downloadInvoice: { en: 'Download Invoice', hi: 'बिल डाउनलोड करें' },
  giveRating: { en: 'Rate Worker', hi: 'रेटिंग दें' },
  // Statuses
  PENDING: { en: 'Pending', hi: 'लंबित' },
  MATCHING: { en: 'Matching Worker', hi: 'कारीगर की खोज जारी' },
  ASSIGNED: { en: 'Worker Assigned', hi: 'कारीगर आवंटित' },
  ACCEPTED: { en: 'Accepted', hi: 'स्वीकृत' },
  ON_THE_WAY: { en: 'On The Way', hi: 'रास्ते में है' },
  ARRIVED: { en: 'Arrived at Location', hi: 'पते पर पहुंच गए' },
  IN_PROGRESS: { en: 'Work In Progress', hi: 'काम चालू है' },
  COMPLETED: { en: 'Completed', hi: 'कार्य पूर्ण' },
  CANCELLED: { en: 'Cancelled', hi: 'रद्द' },
  DISPUTED: { en: 'Disputed', hi: 'विवादित' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  speak: (text: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sahyog_lang') as Language) || 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sahyog_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, speak }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
