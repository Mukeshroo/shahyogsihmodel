import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Booking } from '../types/index.ts';
import {
  AlertTriangle,
  X,
  MapPin,
  Zap,
  Wrench,
  Cpu,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Navigation
} from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: Booking) => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, onBookingCreated }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { showToast, fetchNotifications } = useNotifications();

  const [step, setStep] = useState<'SELECT' | 'DISPATCHING' | 'ASSIGNED'>('SELECT');
  const [selectedHazard, setSelectedHazard] = useState<string>('cat-electrician');
  const [description, setDescription] = useState<string>('');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);

  // Kanpur pilot coordinates (Kalyanpur default)
  const currentAddress = user?.address || 'Flat 402, Ganga Heights, Kalyanpur, Kanpur';
  const customerLat = 26.4960;
  const customerLng = 80.2600;

  const hazards = [
    {
      id: 'cat-electrician',
      icon: Zap,
      title: language === 'hi' ? 'बिजली शॉर्ट सर्किट / स्पार्किंग' : 'Electrical Short Circuit / Sparking',
      subtitle: language === 'hi' ? 'एमसीबी ट्रिप, धुआं, तार जलना' : 'MCB tripping, burning smell, power cut'
    },
    {
      id: 'cat-plumber',
      icon: Wrench,
      title: language === 'hi' ? 'पाइप फटना / पानी लीकेज' : 'Burst Pipe / Severe Flooding',
      subtitle: language === 'hi' ? 'टंकी ओवरफ्लो, मुख्य वाल्व रिपेयर' : 'Main valve failure, water line rupture'
    },
    {
      id: 'cat-appliance',
      icon: Cpu,
      title: language === 'hi' ? 'गीजर / इन्वर्टर आपात खराबी' : 'Geyser / Inverter Hazard',
      subtitle: language === 'hi' ? 'करंट आना, हीटर ओवरहीटिंग' : 'Current leakage, inverter alarm'
    }
  ];

  const triggerSos = async () => {
    setLoading(true);
    setStep('DISPATCHING');

    try {
      const hazardObj = hazards.find((h) => h.id === selectedHazard);
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id || 'user-cust-1',
          customerName: user?.name || 'Priya Sharma',
          customerPhone: user?.phone || '+91 98390 12345',
          address: currentAddress,
          area: 'Kalyanpur',
          lat: customerLat,
          lng: customerLng,
          serviceCategoryId: selectedHazard,
          description: description || `EMERGENCY SOS: ${hazardObj?.title}`,
          scheduledTime: 'Immediate SOS',
          isEmergency: true,
          amount: 500
        })
      });

      if (!res.ok) throw new Error('SOS dispatch failed');
      const booking: Booking = await res.json();
      setActiveBooking(booking);
      setStep('ASSIGNED');
      showToast(`🚨 SOS Dispatch: ${booking.workerName || 'Worker'} assigned!`);
      fetchNotifications();
      if (onBookingCreated) {
        onBookingCreated(booking);
      }
    } catch (err) {
      console.error(err);
      setStep('SELECT');
      showToast('Error dispatching emergency SOS. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('SELECT');
    setActiveBooking(null);
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-500/20 relative">
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: SELECT HAZARD */}
        {step === 'SELECT' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'hi' ? 'आपातकालीन घरेलू सेवा SOS' : 'Emergency Household SOS'}
                  </h3>
                  <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                    24/7 Rapid
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'कानपुर में निकटतम सत्यापित सहकारी मिस्त्री को तत्काल प्राथमिकता पर भेजा जाएगा।'
                    : 'Dispatches the nearest verified cooperative technician on high priority in Kanpur.'}
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4 text-[11px] text-amber-800">
              <span className="font-bold">⚠️ Notice:</span> For household utilities and maintenance only. Not for medical, police, or fire emergency dispatch.
            </div>

            {/* Current Address Pill */}
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium truncate">{currentAddress}</span>
            </div>

            {/* Hazard Options */}
            <div className="space-y-2 mb-4">
              {hazards.map((h) => {
                const Icon = h.icon;
                const isSelected = selectedHazard === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHazard(h.id)}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                      <p className="text-[11px] text-slate-500">{h.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional note */}
            <div className="mb-4">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'संक्षिप्त विवरण (वैकल्पिक: जैसे- किचन में पानी बह रहा है)'
                    : 'Brief details (e.g. water overflowing in second floor bathroom)'
                }
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Dispatch Button */}
            <button
              onClick={triggerSos}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer transition active:scale-98"
            >
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <span>
                {language === 'hi' ? 'आपातकालीन मिस्त्री बुलाएं (SOS Dispatch)' : 'Dispatch Emergency Technician'}
              </span>
            </button>
          </div>
        )}

        {/* STEP 2: DISPATCHING SIMULATION */}
        {step === 'DISPATCHING' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4 animate-ping">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {language === 'hi' ? 'निकटतम मिस्त्री से संपर्क हो रहा है...' : 'Matching Nearest Cooperative Worker...'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Scanning Kalyanpur & Kanpur radius with Fair Allocation algorithm for closest active technician.
            </p>
          </div>
        )}

        {/* STEP 3: ASSIGNED */}
        {step === 'ASSIGNED' && activeBooking && (
          <div>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#087F5B] mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'सहकारी मिस्त्री रवाना हो चुके हैं!' : 'Verified Worker Dispatched!'}
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                Emergency Booking Code: #{activeBooking.bookingCode}
              </p>
            </div>

            {/* Worker Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeBooking.workerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                  alt={activeBooking.workerName || 'Worker'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{activeBooking.workerName}</span>
                    <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
                  </div>
                  <p className="text-[11px] text-slate-500">{activeBooking.serviceName}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Estimated Arrival: ~8-12 minutes (0.8 km)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Security OTP */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-center">
              <span className="text-[11px] text-emerald-800 font-medium block">
                {language === 'hi' ? 'कारीगर के आने पर यह सुरक्षा OTP बताएं:' : 'Share this security OTP upon worker arrival:'}
              </span>
              <div className="text-2xl font-black tracking-widest text-[#087F5B] my-1 font-mono">
                {activeBooking.otpCode}
              </div>
              <span className="text-[10px] text-emerald-600 block">
                Work will only start after OTP verification for your security.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={`tel:${activeBooking.workerPhone || '9839123456'}`}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {activeBooking.workerName?.split(' ')[0]}</span>
              </a>
              <button
                onClick={handleResetAndClose}
                className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition cursor-pointer"
              >
                Track in Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
