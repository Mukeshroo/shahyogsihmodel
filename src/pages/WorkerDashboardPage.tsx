import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Booking, Worker, SkillCertificate, Invoice } from '../types/index.ts';
import {
  Briefcase,
  Wallet,
  Award,
  ShieldCheck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Power,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  QrCode,
  DollarSign,
  HeartHandshake
} from 'lucide-react';

interface WorkerDashboardPageProps {
  onViewCertificate: (worker: Worker) => void;
  onOpenInvoice: (invoice: Invoice) => void;
}

export const WorkerDashboardPage: React.FC<WorkerDashboardPageProps> = ({
  onViewCertificate,
  onOpenInvoice
}) => {
  const { user, workerProfile, updateWorkerAvailability, refreshUserData } = useAuth();
  const { language, t } = useLanguage();
  const { showToast, fetchNotifications } = useNotifications();

  const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [enteredOtp, setEnteredOtp] = useState<{ [bookingId: string]: string }>({});
  const [completeAmount, setCompleteAmount] = useState<{ [bookingId: string]: string }>({});
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Active worker ID
  const workerId = workerProfile?.id || 'work-1';

  const loadWorkerBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings?workerId=${workerId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignedBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerBookings();
    const interval = setInterval(loadWorkerBookings, 8000);
    return () => clearInterval(interval);
  }, [workerId]);

  // Worker Accepts Job
  const handleAccept = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/accept`, { method: 'POST' });
      if (res.ok) {
        showToast('Job Accepted! Customer notified that you are preparing.');
        loadWorkerBookings();
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Worker Updates Status to ON_THE_WAY or ARRIVED
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Status updated: ${status}`);
        loadWorkerBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Customer OTP to Start Job
  const handleVerifyOtp = async (bookingId: string) => {
    const otp = enteredOtp[bookingId];
    if (!otp) {
      showToast('Please ask customer for their 4-digit OTP.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/verify-otp-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invalid OTP');
      } else {
        showToast('OTP Verified successfully! Work is now IN PROGRESS.');
        loadWorkerBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Job & Generate Invoice
  const handleCompleteJob = async (booking: Booking) => {
    const finalAmount = Number(completeAmount[booking.id]) || booking.totalAmount;
    try {
      const res = await fetch(`/api/v1/bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalAmount })
      });
      if (res.ok) {
        const data = await res.json();
        const earned = Math.round(finalAmount * 0.90);
        showToast(`Job Completed! ₹${earned} (90%) credited to your wallet.`);
        setCompletingId(null);
        loadWorkerBookings();
        refreshUserData();
        if (data.invoice) {
          onOpenInvoice(data.invoice);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeJobs = assignedBookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const pastJobs = assignedBookings.filter((b) => b.status === 'COMPLETED');

  const todayEarnings = workerProfile?.todayEarnings || 1800;
  const totalEarnings = workerProfile?.totalEarnings || 84600;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Worker Identity & Online Switch */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={workerProfile?.avatar || user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
            alt="Worker Avatar"
            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {workerProfile?.name || user?.name}
              </h1>
              <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {workerProfile?.status || 'APPROVED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {workerProfile?.cooperativeName || 'Kalyanpur Shramik Sahyog Samiti Ltd.'}
            </p>
            <p className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
              QR Certificate: {workerProfile?.qrCertificateId || 'CERT-KNP-2026-ELEC-0492'}
            </p>
          </div>
        </div>

        {/* Online / Offline Availability Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateWorkerAvailability(!workerProfile?.isAvailable)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              workerProfile?.isAvailable
                ? 'bg-[#087F5B] text-white hover:bg-[#066347]'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{workerProfile?.isAvailable ? 'DUTY ON (Ready for Gigs)' : 'DUTY OFF (Resting)'}</span>
          </button>

          {workerProfile && (
            <button
              onClick={() => onViewCertificate(workerProfile)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="View & Download QR Certificate"
            >
              <QrCode className="w-4 h-4 text-[#087F5B]" />
              <span className="hidden sm:inline">My QR Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Worker Financial Metrics Cards (90% Share Transparency) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Today's Pay (90%)</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">₹{todayEarnings}</p>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Direct to UPI / Bank</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Total Lifetime Earnings</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">₹{totalEarnings}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">{workerProfile?.completedJobs || 142} jobs completed</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Rating & Fair Score</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">⭐ {workerProfile?.rating || '4.9'}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Zero aggregator deductions</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Welfare Insurance</span>
          <p className="text-sm font-bold text-blue-700 mt-1">₹2,00,000 Cover</p>
          <span className="text-[10px] text-blue-600 block mt-0.5">PM Suraksha Bima Active ✓</span>
        </div>
      </div>

      {/* ACTIVE ASSIGNED GIGS (Actionable Job Management) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#087F5B]" />
            <span>Active & Assigned Jobs ({activeJobs.length})</span>
          </h2>
          <button
            onClick={loadWorkerBookings}
            className="text-xs text-[#087F5B] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {activeJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 space-y-2">
            <Clock className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No active assignments right now.</p>
            <p>Ensure your status is set to "DUTY ON" above to receive fair job allocations in Kanpur.</p>
          </div>
        ) : (
          activeJobs.map((booking) => {
            const workerCut = Math.round(booking.totalAmount * 0.90);
            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-5 border-2 border-emerald-500/30 shadow-md space-y-4"
              >
                {/* Job Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #{booking.bookingCode}
                    </span>
                    {booking.isEmergency && (
                      <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded animate-pulse">
                        🚨 EMERGENCY SOS
                      </span>
                    )}
                    <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Earning (90%)</span>
                    <span className="text-base font-black text-emerald-700">₹{workerCut}</span>
                  </div>
                </div>

                {/* Customer Contact and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{booking.customerName}</p>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-[#087F5B]" />
                      <a href={`tel:${booking.customerPhone}`} className="hover:underline font-semibold">
                        {booking.customerPhone}
                      </a>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#087F5B] shrink-0 mt-0.5" />
                      <span>{booking.address} ({booking.area})</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800">{booking.serviceName}</p>
                    <p className="text-slate-600 italic text-[11px]">"{booking.description}"</p>
                    <p className="text-[11px] text-slate-400">Scheduled: {booking.scheduledTime}</p>
                  </div>
                </div>

                {/* WORKFLOW CONTROLS BASED ON STATUS */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* Step A: Accept Assignment */}
                  {booking.status === 'ASSIGNED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(booking.id)}
                        className="flex-1 bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                      >
                        ✓ Accept Gig ({booking.serviceName})
                      </button>
                    </div>
                  )}

                  {/* Step B: On the way / Arrived */}
                  {booking.status === 'ACCEPTED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'ON_THE_WAY')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                      >
                        🚗 I am On The Way
                      </button>
                    </div>
                  )}

                  {booking.status === 'ON_THE_WAY' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'ARRIVED')}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                      >
                        📍 I have Arrived at Customer Location
                      </button>
                    </div>
                  )}

                  {/* Step C: Verify Customer OTP to Start */}
                  {(booking.status === 'ARRIVED' || booking.status === 'ACCEPTED') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Customer Security OTP Verification Required to Start</span>
                      </div>
                      <p className="text-amber-700 text-[11px]">
                        Ask customer for their 4-digit OTP shown on their screen to unlock and begin the repair work.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={enteredOtp[booking.id] || ''}
                          onChange={(e) => setEnteredOtp({ ...enteredOtp, [booking.id]: e.target.value })}
                          placeholder="Enter 4-digit OTP"
                          className="w-36 text-center font-mono font-bold text-sm p-2 bg-white border border-amber-300 rounded-lg focus:outline-none"
                        />
                        <button
                          onClick={() => handleVerifyOtp(booking.id)}
                          className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                        >
                          Verify & Start Work
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step D: Complete Work and Submit Bill */}
                  {booking.status === 'IN_PROGRESS' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">Work in Progress</span>
                        <span className="text-[11px] text-emerald-700 font-medium">Verify completion with customer</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 font-medium">Final Amount (₹):</span>
                          <input
                            type="number"
                            defaultValue={booking.totalAmount}
                            onChange={(e) => setCompleteAmount({ ...completeAmount, [booking.id]: e.target.value })}
                            className="w-24 text-xs p-1.5 border border-emerald-300 rounded-lg bg-white font-bold"
                          />
                        </div>
                        <button
                          onClick={() => handleCompleteJob(booking)}
                          className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
                        >
                          ✓ Finish Work & Generate Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPLETED JOBS & LEDGER HISTORY */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Completed Jobs History ({pastJobs.length})</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
          {pastJobs.map((j) => (
            <div key={j.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{j.serviceName} · #{j.bookingCode}</p>
                <p className="text-slate-500">{j.customerName} · {j.address}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{new Date(j.completedAt || j.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className="text-emerald-700 font-bold block text-sm">+₹{j.workerShare} (90%)</span>
                <span className="text-[10px] text-slate-400 block">Total bill: ₹{j.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
