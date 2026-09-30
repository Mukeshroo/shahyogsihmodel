import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { ServiceCategory, Worker, Booking } from '../types/index.ts';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Zap,
  Wrench,
  Cpu,
  Hammer,
  Sparkle,
  Paintbrush
} from 'lucide-react';

interface BookingFlowModalProps {
  categories: ServiceCategory[];
  workers: Worker[];
  selectedCategoryId?: string;
  selectedWorker?: Worker | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: (booking: Booking) => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  categories,
  workers,
  selectedCategoryId,
  selectedWorker,
  isOpen,
  onClose,
  onBookingCreated
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { showToast, fetchNotifications } = useNotifications();

  const [step, setStep] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<string>(selectedCategoryId || 'cat-electrician');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [scheduleOption, setScheduleOption] = useState<'immediate' | 'today_evening' | 'tomorrow'>('immediate');
  const [address, setAddress] = useState<string>(user?.address || 'Flat 402, Ganga Heights, Kalyanpur, Kanpur');
  const [area, setArea] = useState<string>('Kalyanpur');
  const [preferWorker, setPreferWorker] = useState<Worker | null>(selectedWorker || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const eligibleWorkers = workers.filter(
    (w) => w.status === 'APPROVED' && w.approvedSkills.includes(categoryId)
  );

  const basePrice = currentCategory?.basePrice || 350;
  const worker90 = Math.round(basePrice * 0.90);
  const platform10 = basePrice - worker90;

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id || 'user-cust-1',
          customerName: user?.name || 'Priya Sharma',
          customerPhone: user?.phone || '+91 98390 12345',
          address,
          area,
          lat: 26.4960,
          lng: 80.2600,
          serviceCategoryId: categoryId,
          description: problemDescription || `Request for ${currentCategory?.name}`,
          scheduledTime:
            scheduleOption === 'immediate'
              ? 'Today, Immediate (Priority)'
              : scheduleOption === 'today_evening'
              ? 'Today Evening (5:00 PM - 7:00 PM)'
              : 'Tomorrow Morning (10:00 AM - 12:00 PM)',
          isEmergency: false,
          preferredWorkerId: preferWorker?.id || null,
          amount: basePrice
        })
      });

      if (!res.ok) throw new Error('Failed to create booking');
      const newBooking: Booking = await res.json();
      showToast(`Booking #${newBooking.bookingCode} confirmed! Assigned to ${newBooking.workerName || 'cooperative technician'}.`);
      fetchNotifications();
      onBookingCreated(newBooking);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error booking service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span className={step >= 1 ? 'text-[#087F5B]' : ''}>1. Service</span>
            <span className={step >= 2 ? 'text-[#087F5B]' : ''}>2. Details</span>
            <span className={step >= 3 ? 'text-[#087F5B]' : ''}>3. Address</span>
            <span className={step >= 4 ? 'text-[#087F5B]' : ''}>4. Fair Match</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#087F5B] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: SELECT SERVICE */}
        {step === 1 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Select Service Category</h3>
            <p className="text-xs text-slate-500 mb-4">Choose from cooperative-certified household trades</p>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-[#087F5B] bg-emerald-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{language === 'hi' ? c.nameHi : c.description}</p>
                    <p className="text-xs font-extrabold text-[#087F5B] mt-2">₹{c.basePrice} <span className="text-[10px] font-normal text-slate-400">/ base</span></p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROBLEM DETAILS & TIME */}
        {step === 2 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Service Details & Preferred Time</h3>
            <p className="text-xs text-slate-500 mb-4">Selected: <span className="font-semibold text-slate-800">{currentCategory?.name}</span></p>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Describe the issue or requirement
              </label>
              <textarea
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="E.g., Switchboard sparking in bedroom, or need tap replacement in kitchen..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#087F5B] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-700 block mb-2">When do you need the technician?</label>
              <div className="space-y-2">
                {[
                  { id: 'immediate', label: '⚡ Immediate Priority (Within 45-60 mins)', desc: 'Nearest on-duty cooperative worker dispatched' },
                  { id: 'today_evening', label: '🌆 Today Evening (5:00 PM - 7:00 PM)', desc: 'Standard evening slot' },
                  { id: 'tomorrow', label: '📅 Tomorrow Morning (10:00 AM - 12:00 PM)', desc: 'Next day scheduled visit' }
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setScheduleOption(s.id as any)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center ${
                      scheduleOption === s.id
                        ? 'border-[#087F5B] bg-emerald-50/40 text-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{s.label}</p>
                      <p className="text-[10px] text-slate-500">{s.desc}</p>
                    </div>
                    <input type="radio" checked={scheduleOption === s.id} readOnly />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-600 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Address</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ADDRESS */}
        {step === 3 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Service Address in Kanpur</h3>
            <p className="text-xs text-slate-500 mb-4">Location is matched with nearby cooperative clusters</p>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">Kanpur Area / Colony</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#087F5B] focus:outline-none"
              >
                <option value="Kalyanpur">Kalyanpur (Ward 24)</option>
                <option value="Swaroop Nagar">Swaroop Nagar (Ward 18)</option>
                <option value="Civil Lines">Civil Lines (Ward 12)</option>
                <option value="Kidwai Nagar">Kidwai Nagar (Ward 35)</option>
                <option value="Barra">Barra (Ward 41)</option>
                <option value="Kakadeo">Kakadeo / Coaching Hub</option>
                <option value="Sharda Nagar">Sharda Nagar</option>
                <option value="IIT Kanpur Campus">IIT Kanpur Campus</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-700 block mb-1">Complete House / Flat Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#087F5B] focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Exact house location is kept secure and only shared with the assigned worker.</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-slate-600 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FAIR WORK ALLOCATION & CONFIRMATION */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#087F5B]" />
              <h3 className="text-base font-bold text-slate-900">Fair Work Allocation & Transparency</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Our automated engine assigns the gig based on distance, skill, and rotation fairness to prevent monopolies.
            </p>

            {/* Fair Allocation Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#087F5B]">Algorithmic Allocation Active</span>
                <span className="text-[11px] font-mono text-emerald-800 font-semibold">96.8% Fairness Score</span>
              </div>
              <p className="text-slate-600">
                {preferWorker
                  ? `Direct technician preference: ${preferWorker.name} (${preferWorker.cooperativeName})`
                  : `Nearest verified cooperative worker in ${area} will be assigned instantly.`}
              </p>
            </div>

            {/* 90/10 Split Transparency Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800">Estimated Cost:</span>
                <span className="text-lg font-black text-slate-900">₹{basePrice}</span>
              </div>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Worker Direct Share (90%):</span>
                  <span>₹{worker90}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cooperative & Welfare Fund (10%):</span>
                  <span>₹{platform10}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(3)}
                className="text-xs font-semibold text-slate-600 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20 active:scale-98 transition"
              >
                {isSubmitting ? (
                  <span>Creating Booking in Database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Book Service</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
