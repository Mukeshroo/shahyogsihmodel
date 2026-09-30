import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider, useNotifications } from './context/NotificationContext.tsx';

import { DemoBar } from './components/DemoBar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { PwaInstallBanner } from './components/PwaInstallBanner.tsx';
import { VoiceSearchModal } from './components/VoiceSearchModal.tsx';
import { SosModal } from './components/SosModal.tsx';
import { CertificateModal } from './components/CertificateModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { BookingFlowModal } from './components/BookingFlowModal.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { SearchPage } from './pages/SearchPage.tsx';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage.tsx';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage.tsx';
import { SecretaryPortalPage } from './pages/SecretaryPortalPage.tsx';
import { FederationPortalPage } from './pages/FederationPortalPage.tsx';
import { SuperAdminPage } from './pages/SuperAdminPage.tsx';
import { AiForecastPage } from './pages/AiForecastPage.tsx';
import { PublicVerifyPage } from './pages/PublicVerifyPage.tsx';
import { WelfarePage } from './pages/WelfarePage.tsx';

import { ServiceCategory, Worker, Booking, SkillCertificate, Invoice } from './types/index.ts';
import { MessageSquare, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { toastMessage, whatsAppPreview, closeWhatsAppPreview } = useNotifications();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [urlCertId, setUrlCertId] = useState<string>('');

  // Categories & Workers Cache
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  // Modals State
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedBookingCat, setSelectedBookingCat] = useState<string | undefined>(undefined);
  const [selectedBookingWorker, setSelectedBookingWorker] = useState<Worker | null>(null);

  const [inspectCertificate, setInspectCertificate] = useState<SkillCertificate | null>(null);
  const [inspectWorker, setInspectWorker] = useState<Worker | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const [inspectInvoice, setInspectInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Load initial categories & workers
  useEffect(() => {
    fetch('/api/v1/services')
      .then((r) => r.json())
      .then((d) => setCategories(d))
      .catch(console.error);

    fetch('/api/v1/workers')
      .then((r) => r.json())
      .then((d) => setWorkers(d))
      .catch(console.error);
  }, []);

  // Check URL pathname for /verify/:id (supporting GitHub Pages subpaths)
  useEffect(() => {
    const path = window.location.pathname;
    const verifyIdx = path.indexOf('/verify/');
    if (verifyIdx !== -1) {
      const id = path.slice(verifyIdx + 8).split('/')[0].split('?')[0];
      if (id) {
        setUrlCertId(id);
        setCurrentView('verify');
      }
    }
  }, []);

  const handleOpenCertificate = async (worker: Worker) => {
    setInspectWorker(worker);
    try {
      const res = await fetch(`/api/v1/certificates/verify/${worker.qrCertificateId}`);
      if (res.ok) {
        const data = await res.json();
        setInspectCertificate(data.certificate);
        setIsCertModalOpen(true);
      } else {
        // Fallback certificate view
        setInspectCertificate({
          id: 'temp-cert',
          certificateNumber: worker.qrCertificateId,
          workerId: worker.id,
          workerName: worker.name,
          cooperativeId: worker.cooperativeId,
          cooperativeName: worker.cooperativeName,
          skills: worker.approvedSkills.map((s) => s.replace('cat-', '').toUpperCase() + ' Certified'),
          issueDate: '2026-01-20',
          expiryDate: '2027-01-19',
          status: 'ACTIVE',
          signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          verificationUrl: `/verify/${worker.qrCertificateId}`,
          authorizedBy: 'Cooperative Secretary'
        });
        setIsCertModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBooking = (catId?: string, worker?: Worker) => {
    setSelectedBookingCat(catId);
    setSelectedBookingWorker(worker || null);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#12304A]">
      {/* 1. SIH 2026 Demo Bar with 1-Click Role Switcher */}
      <DemoBar
        onOpenSos={() => setIsSosOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* 2. PWA Install Prompt Banner */}
      <PwaInstallBanner />

      {/* 3. Primary Responsive Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* 4. Main Page View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            categories={categories}
            workers={workers}
            onSelectCategory={(catId) => {
              setSelectedBookingCat(catId);
              setCurrentView('search');
            }}
            onSelectWorker={(worker) => setSelectedBookingWorker(worker)}
            onOpenSos={() => setIsSosOpen(true)}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onOpenBooking={handleOpenBooking}
            onViewCertificate={handleOpenCertificate}
            onNavigate={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'search' && (
          <SearchPage
            categories={categories}
            workers={workers}
            initialCategory={selectedBookingCat}
            onOpenBooking={handleOpenBooking}
            onViewCertificate={handleOpenCertificate}
          />
        )}

        {currentView === 'customer' && (
          <CustomerDashboardPage
            onOpenPayment={(booking) => {
              setPaymentBooking(booking);
              setIsPaymentModalOpen(true);
            }}
            onOpenInvoice={(invoice) => {
              setInspectInvoice(invoice);
              setIsInvoiceModalOpen(true);
            }}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentView === 'worker' && (
          <WorkerDashboardPage
            onViewCertificate={handleOpenCertificate}
            onOpenInvoice={(invoice) => {
              setInspectInvoice(invoice);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}

        {currentView === 'secretary' && (
          <SecretaryPortalPage onViewCertificate={handleOpenCertificate} />
        )}

        {currentView === 'federation' && (
          <FederationPortalPage />
        )}

        {currentView === 'admin' && (
          <SuperAdminPage />
        )}

        {currentView === 'forecast' && (
          <AiForecastPage />
        )}

        {currentView === 'welfare' && (
          <WelfarePage />
        )}

        {currentView === 'verify' && (
          <PublicVerifyPage initialCertificateId={urlCertId || 'CERT-KNP-2026-ELEC-0492'} />
        )}
      </main>

      {/* 5. Modals */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectService={(catId) => {
          setSelectedBookingCat(catId);
          setCurrentView('search');
        }}
      />

      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onBookingCreated={(booking) => {
          setCurrentView('customer');
        }}
      />

      <BookingFlowModal
        categories={categories}
        workers={workers}
        selectedCategoryId={selectedBookingCat}
        selectedWorker={selectedBookingWorker}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingCreated={() => {
          setCurrentView('customer');
        }}
      />

      <CertificateModal
        certificate={inspectCertificate}
        worker={inspectWorker}
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      <InvoiceModal
        invoice={inspectInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      <PaymentModal
        booking={paymentBooking}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          // reload customer bookings
        }}
      />

      {/* 6. Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12304A] text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. WhatsApp Live Message Notification Simulation Drawer */}
      {whatsAppPreview && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl max-w-sm border border-emerald-500 animate-in fade-in">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📱</span> WhatsApp Business Alert
            </span>
            <button onClick={closeWhatsAppPreview} className="p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-bold">{whatsAppPreview.title}</p>
          <p className="text-[11px] opacity-90 mt-0.5">{whatsAppPreview.message}</p>
        </div>
      )}

      {/* 8. Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-extrabold text-[#12304A] text-sm">SAHYOG</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cooperative Gig Services Platform for Household & Community Services · SIH 2026 Problem Statement 26089
            </p>
            <p className="text-[11px] text-slate-400">
              Team: CYBER KNIGHTS01 · Pilot District: Kanpur Nagar, Uttar Pradesh
            </p>
          </div>

          <div className="flex gap-4 font-semibold text-slate-600">
            <button onClick={() => setCurrentView('verify')} className="hover:text-[#087F5B] cursor-pointer">
              Verify QR Certificate
            </button>
            <button onClick={() => setCurrentView('forecast')} className="hover:text-[#087F5B] cursor-pointer">
              AI Demand Forecast
            </button>
            <button onClick={() => setCurrentView('welfare')} className="hover:text-[#087F5B] cursor-pointer">
              Worker Welfare & Insurance
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
